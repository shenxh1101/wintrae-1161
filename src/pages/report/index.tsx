import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import {
  formatDateCN,
  getWeekDates,
  formatWeekdayCN,
  WEEKDAY_SHORT,
  FOOD_TAGS,
  MEAL_TYPE_LABELS
} from '@/utils';
import type { FoodTagType, MealRecord } from '@/types';
import dayjs from 'dayjs';
import TagChip from '@/components/TagChip';

const SUGGESTION_ICONS = ['🧂', '💧', '⚖️', '🥬'];

const ReportPage: React.FC = () => {
  const { mealRecords, computeWeeklyReport } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);

  // 历史检索相关状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [searchTags, setSearchTags] = useState<FoodTagType[]>([]);

  const report = useMemo(() => computeWeeklyReport(weekOffset), [computeWeeklyReport, weekOffset]);
  const prevReport = useMemo(() => computeWeeklyReport(weekOffset - 1), [computeWeeklyReport, weekOffset]);
  const weekDates = getWeekDates(weekOffset);

  // 每日高盐高糖数据（基于真实记录）
  const saltSugarByDay = useMemo(() => {
    return weekDates.map(date => {
      const dayMeals = mealRecords.filter(m => m.date === date);
      let salt = 0, sugar = 0;
      dayMeals.forEach(m => {
        if (m.tags.includes('high-salt')) salt++;
        if (m.tags.includes('high-sugar')) sugar++;
      });
      return { date, salt, sugar, weekday: WEEKDAY_SHORT[dayjs(date).day()] };
    });
  }, [weekDates, mealRecords]);

  // 体重趋势数据
  const weightData = useMemo(() => {
    return report.trend.map((value, i) => ({
      value,
      label: WEEKDAY_SHORT[dayjs(weekDates[i]).day()],
      date: weekDates[i]
    }));
  }, [report.trend, weekDates]);

  // 周对比数据
  const weekCompare = useMemo(() => {
    const saltDiff = report.highSaltCount - prevReport.highSaltCount;
    const sugarDiff = report.highSugarCount - prevReport.highSugarCount;
    const qualDiff = report.qualifiedDays - prevReport.qualifiedDays;
    const weightDiff = +(report.avgWeight - prevReport.avgWeight).toFixed(1);

    return [
      {
        label: '高盐次数',
        current: report.highSaltCount,
        prev: prevReport.highSaltCount,
        diff: saltDiff,
        icon: '🧂',
        unit: '次',
        color: '#EF4444'
      },
      {
        label: '高糖次数',
        current: report.highSugarCount,
        prev: prevReport.highSugarCount,
        diff: sugarDiff,
        icon: '🍰',
        unit: '次',
        color: '#F59E0B'
      },
      {
        label: '达标天数',
        current: report.qualifiedDays,
        prev: prevReport.qualifiedDays,
        diff: qualDiff,
        icon: '✅',
        unit: '天',
        color: '#10B981'
      },
      {
        label: '平均体重',
        current: report.avgWeight.toFixed(1),
        prev: prevReport.avgWeight.toFixed(1),
        diff: weightDiff,
        icon: '⚖️',
        unit: 'kg',
        color: '#3B82F6'
      }
    ];
  }, [report, prevReport]);

  // 折线图SVG path
  const linePath = useMemo(() => {
    const values = weightData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - (((v - min) / range) * 80 + 10);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [weightData]);

  // 柱状图最高柱
  const maxBarVal = Math.max(
    ...saltSugarByDay.map(d => Math.max(d.salt, d.sugar)),
    1
  );

  // 历史检索结果
  const searchResults = useMemo(() => {
    let result = [...mealRecords];
    if (searchDateFrom) {
      result = result.filter(r => r.date >= searchDateFrom);
    }
    if (searchDateTo) {
      result = result.filter(r => r.date <= searchDateTo);
    }
    if (searchTags.length > 0) {
      result = result.filter(r =>
        searchTags.some(tag => r.tags.includes(tag))
      );
    }
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [mealRecords, searchDateFrom, searchDateTo, searchTags]);

  const toggleSearchTag = (tag: FoodTagType) => {
    setSearchTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleDateSelect = (field: 'from' | 'to') => {
    const options: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      options.push(`${formatDateCN(d)} ${formatWeekdayCN(d)}`);
    }
    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        const selected = dayjs().subtract(res.tapIndex, 'day').format('YYYY-MM-DD');
        if (field === 'from') setSearchDateFrom(selected);
        else setSearchDateTo(selected);
      }
    });
  };

  const resetSearch = () => {
    setSearchDateFrom('');
    setSearchDateTo('');
    setSearchTags([]);
  };

  const renderResultItem = (item: MealRecord) => (
    <View key={item.id} className={styles.resultItem}>
      <Image className={styles.resultImg} src={item.imageUrl} mode="aspectFill" />
      <View className={styles.resultInfo}>
        <View className={styles.resultHeader}>
          <Text className={styles.resultMeal}>
            {MEAL_TYPE_LABELS[item.mealType]}
          </Text>
          <Text className={styles.resultDate}>
            {formatDateCN(item.date)} · {item.createdAt.slice(11)}
          </Text>
        </View>
        {item.tags.length > 0 && (
          <View className={styles.resultTags}>
            {item.tags.map(t => (
              <TagChip key={t} tagKey={t} size="sm" />
            ))}
          </View>
        )}
        {item.note && (
          <Text className={styles.resultNote}>{item.note}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 周报周期 */}
      <View className={styles.weekHeader}>
        <View>
          <Text className={styles.weekTitle}>📊 周报分析</Text>
          <View className={styles.weekDate}>
            {formatDateCN(report.weekStart)} - {formatDateCN(report.weekEnd)}
            {weekOffset === 0 && <Text style={{ marginLeft: '8rpx', color: '#10B981' }}>（本周）</Text>}
            {weekOffset < 0 && <Text style={{ marginLeft: '8rpx', color: '#6B7280' }}>（历史）</Text>}
          </View>
        </View>
        <View className={styles.weekNav}>
          <View className={styles.weekNavBtn} onClick={() => setWeekOffset(w => w - 1)}>
            <Text>‹</Text>
          </View>
          <View
            className={styles.weekNavBtn}
            style={{ opacity: weekOffset < 0 ? 1 : 0.4 }}
            onClick={() => weekOffset < 0 && setWeekOffset(w => w + 1)}
          >
            <Text>›</Text>
          </View>
        </View>
      </View>

      {/* 核心指标概览 */}
      <View className={styles.overviewGrid}>
        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>✅</Text>
          <Text className={styles.overviewLabel}>健康达标</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.qualColor}>{report.qualifiedDays}</Text>
            <Text className={styles.overviewUnit}>/ {report.totalDays}天</Text>
          </View>
          <Text className={styles.overviewSub}>
            达标率 {Math.round(report.qualifiedDays / report.totalDays * 100)}%
          </Text>
        </View>

        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>🧂</Text>
          <Text className={styles.overviewLabel}>高盐次数</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.saltColor}>{report.highSaltCount}</Text>
            <Text className={styles.overviewUnit}>次</Text>
          </View>
          <Text className={styles.overviewSub}>
            {report.highSaltCount <= 3 ? '控制良好 ✓' : '建议减少 ⚠️'}
          </Text>
        </View>

        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>🍰</Text>
          <Text className={styles.overviewLabel}>高糖次数</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.sugarColor}>{report.highSugarCount}</Text>
            <Text className={styles.overviewUnit}>次</Text>
          </View>
          <Text className={styles.overviewSub}>
            {report.highSugarCount <= 2 ? '控制良好 ✓' : '建议减少 ⚠️'}
          </Text>
        </View>

        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>⚖️</Text>
          <Text className={styles.overviewLabel}>平均体重</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.weightColor}>{report.avgWeight.toFixed(1)}</Text>
            <Text className={styles.overviewUnit}>kg</Text>
          </View>
          <Text className={styles.overviewSub}>
            日均饮水 {report.avgWaterCups.toFixed(1)} 杯
          </Text>
        </View>
      </View>

      {/* 本周 vs 上周对比 */}
      <View className={styles.chartCard}>
        <View className={styles.chartHeader}>
          <Text className={styles.chartTitle}>
            <Text>📊</Text>
            本周 vs 上周
          </Text>
          <Text className={styles.chartTag}>对比分析</Text>
        </View>
        <View className={styles.compareGrid}>
          {weekCompare.map((item, index) => (
            <View key={index} className={styles.compareCard}>
              <View className={styles.compareIcon}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.compareLabel}>{item.label}</Text>
              <View className={styles.compareValues}>
                <Text className={styles.compareCurrent} style={{ color: item.color }}>
                  {item.current} <Text className={styles.compareUnit}>{item.unit}</Text>
                </Text>
              </View>
              <View className={classnames(styles.compareDiff, {
                [styles.diffUp]: item.diff > 0,
                [styles.diffDown]: item.diff < 0,
                [styles.diffNeutral]: item.diff === 0
              })}>
                {item.diff > 0 && <Text>↑ {item.diff}</Text>}
                {item.diff < 0 && <Text>↓ {Math.abs(item.diff)}</Text>}
                {item.diff === 0 && <Text>— 持平</Text>}
              </View>
              <View className={styles.comparePrev}>
                <Text className={styles.comparePrevLabel}>上周 {item.prev}{item.unit}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 高盐高糖柱状图 */}
      <View className={styles.chartCard}>
        <View className={styles.chartHeader}>
          <Text className={styles.chartTitle}>
            <Text>📈</Text>
            每日高盐/高糖频次
          </Text>
          <Text className={styles.chartTag}>单位：次/天</Text>
        </View>

        <View className={styles.barChart}>
          {saltSugarByDay.map((item, index) => (
            <View key={index} className={styles.barItem}>
              <View className={styles.barsWrap}>
                <View className={styles.barColumn}>
                  {item.salt > 0 && <Text className={styles.barValue}>{item.salt}</Text>}
                  <View
                    className={[styles.barFill, styles.barHighSalt].join(' ')}
                    style={{ height: `${(item.salt / maxBarVal) * 140}rpx` }}
                  />
                </View>
                <View className={styles.barColumn}>
                  {item.sugar > 0 && <Text className={styles.barValue}>{item.sugar}</Text>}
                  <View
                    className={[styles.barFill, styles.barHighSugar].join(' ')}
                    style={{ height: `${(item.sugar / maxBarVal) * 140}rpx` }}
                  />
                </View>
              </View>
              <View className={styles.barDayWrap}>
                <Text className={styles.barLabel}>{item.weekday}</Text>
                {(item.salt > 0 || item.sugar > 0) && (
                  <Text className={styles.barBadge}>{item.salt + item.sugar}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#EF4444' }} />
            <Text className={styles.legendText}>高盐</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#F59E0B' }} />
            <Text className={styles.legendText}>高糖</Text>
          </View>
          <View className={styles.legendItem}>
            <Text className={styles.legendText}>
              总计：{report.highSaltCount + report.highSugarCount} 次
            </Text>
          </View>
        </View>
      </View>

      {/* 体重趋势图 */}
      <View className={styles.chartCard}>
        <View className={styles.chartHeader}>
          <Text className={styles.chartTitle}>
            <Text>📉</Text>
            体重变化趋势
          </Text>
          <Text className={styles.chartTag}>单位: kg</Text>
        </View>

        <View className={styles.lineChart}>
          <View className={styles.chartGridLine} style={{ top: '24rpx' }} />
          <View className={styles.chartGridLine} style={{ top: '80rpx' }} />
          <View className={styles.chartGridLine} style={{ top: '136rpx' }} />
          <View className={styles.chartGridLine} style={{ top: '192rpx' }} />

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: '32rpx',
              left: '32rpx',
              right: '32rpx',
              height: '200rpx',
              zIndex: 1,
              width: 'auto'
            }}
          >
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <View className={styles.linePoints}>
            {weightData.map((point, index) => {
              const values = weightData.map(d => d.value);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const range = max - min || 1;
              const pct = ((point.value - min) / range) * 80 + 10;
              return (
                <View
                  key={index}
                  className={styles.linePoint}
                  style={{ height: '200rpx', position: 'relative', flex: 1 }}
                >
                  <Text className={styles.pointValue} style={{ top: `${100 - pct - 12}%` }}>
                    {point.value.toFixed(1)}
                  </Text>
                  <View className={styles.pointDot} style={{ top: `${100 - pct}%` }} />
                  <View className={styles.pointDayWrap} style={{ bottom: '-48rpx' }}>
                    <Text className={styles.pointLabel}>{point.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: '56rpx' }} />
      </View>

      {/* 历史检索入口 */}
      <View className={styles.entryCard} onClick={() => setShowSearch(true)}>
        <View className={styles.entryInfo}>
          <Text className={styles.entryTitle}>
            <Text>🔍</Text>
            历史记录检索
          </Text>
          <Text className={styles.entryDesc}>
            按日期范围、食物标签查询历史记录（共 {mealRecords.length} 条）
          </Text>
        </View>
        <Text className={styles.entryArrow}>›</Text>
      </View>

      {/* 习惯建议 */}
      <View className={styles.suggestionSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text>💡</Text>
            智能建议
          </Text>
        </View>
        <View className={styles.suggestionList}>
          {report.suggestions.map((text, index) => (
            <View key={index} className={styles.suggestionCard}>
              <View className={styles.suggestionIcon}>
                <Text>{SUGGESTION_ICONS[index % SUGGESTION_ICONS.length]}</Text>
              </View>
              <View className={styles.suggestionContent}>
                <Text className={styles.suggestionIndex}>建议 {index + 1}</Text>
                <Text className={styles.suggestionText}>{text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 历史检索弹窗 */}
      {showSearch && (
        <View className={styles.searchModalMask} onClick={() => setShowSearch(false)}>
          <View className={styles.searchModal} onClick={(e) => e.stopPropagation?.()}>
            <View className={styles.searchHeader}>
              <Text className={styles.searchTitle}>🔍 历史记录检索</Text>
              <Text className={styles.searchClose} onClick={() => setShowSearch(false)}>×</Text>
            </View>

            {/* 筛选条件 */}
            <View className={styles.searchFilters}>
              <View className={styles.filterRow}>
                <Text className={styles.filterLabel}>日期范围</Text>
                <View className={styles.datePickers}>
                  <View
                    className={styles.datePickerBtn}
                    onClick={() => handleDateSelect('from')}
                  >
                    <Text style={{ color: searchDateFrom ? '#1F2937' : '#9CA3AF' }}>
                      {searchDateFrom ? formatDateCN(searchDateFrom) : '开始日期'}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: '24rpx' }}>▾</Text>
                  </View>
                  <Text style={{ color: '#9CA3AF', padding: '0 8rpx' }}>至</Text>
                  <View
                    className={styles.datePickerBtn}
                    onClick={() => handleDateSelect('to')}
                  >
                    <Text style={{ color: searchDateTo ? '#1F2937' : '#9CA3AF' }}>
                      {searchDateTo ? formatDateCN(searchDateTo) : '结束日期'}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: '24rpx' }}>▾</Text>
                  </View>
                </View>
              </View>

              <View className={styles.filterRow}>
                <Text className={styles.filterLabel}>食物标签</Text>
                <View className={styles.filterTags}>
                  {FOOD_TAGS.map(tag => (
                    <TagChip
                      key={tag.key}
                      tagKey={tag.key}
                      size="sm"
                      selected={searchTags.includes(tag.key)}
                      onClick={() => toggleSearchTag(tag.key)}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* 结果统计 */}
            <View className={styles.searchResultHeader}>
              <Text className={styles.searchResultCount}>
                共找到 <Text style={{ color: '#10B981', fontWeight: 600 }}>{searchResults.length}</Text> 条记录
              </Text>
              {(searchDateFrom || searchDateTo || searchTags.length > 0) && (
                <Text className={styles.resetBtn} onClick={resetSearch}>重置条件</Text>
              )}
            </View>

            {/* 结果列表 */}
            <ScrollView scrollY className={styles.searchResultList}>
              {searchResults.length > 0 ? (
                searchResults.map(renderResultItem)
              ) : (
                <View style={{ padding: '64rpx 32rpx', alignItems: 'center', gap: '16rpx' }}>
                  <Text style={{ fontSize: '64rpx' }}>🔍</Text>
                  <Text style={{ fontSize: '28rpx', color: '#6B7280' }}>
                    暂无匹配的记录，试试调整筛选条件
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReportPage;
