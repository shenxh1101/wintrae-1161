import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useStore } from '@/store/useStore';
import { formatDate, getWeekStart, getWeekEnd } from '@/utils';
import dayjs from 'dayjs';

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const SUGGESTION_ICONS = ['🧂', '💧', '⚖️', '🥬'];

const ReportPage: React.FC = () => {
  const { weeklyReport, mealRecords } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    return dayjs().add(weekOffset, 'week').startOf('week').format('YYYY-MM-DD');
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    return dayjs().add(weekOffset, 'week').endOf('week').format('YYYY-MM-DD');
  }, [weekOffset]);

  // 高盐高糖数据模拟
  const saltSugarData = useMemo(() => {
    return WEEK_LABELS.map((_, i) => ({
      salt: [1, 0, 1, 0, 0, 1, 0][i] as number,
      sugar: [0, 1, 0, 0, 1, 0, 0][i] as number
    }));
  }, []);

  // 体重趋势数据
  const weightData = useMemo(() => {
    const baseTrend = weeklyReport.trend;
    const min = Math.min(...baseTrend);
    const max = Math.max(...baseTrend);
    const range = max - min || 1;
    return baseTrend.map((v, i) => ({
      value: v,
      label: WEEK_LABELS[i],
      percent: ((v - min) / range) * 80 + 10
    }));
  }, [weeklyReport.trend]);

  // 生成折线图SVG path
  const linePath = useMemo(() => {
    const points = weightData.map((d, i) => {
      const x = (i / (weightData.length - 1)) * 100;
      const y = 100 - d.percent;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [weightData]);

  const handlePrevWeek = () => setWeekOffset(w => w - 1);
  const handleNextWeek = () => {
    if (weekOffset < 0) setWeekOffset(w => w + 1);
  };

  const handleHistorySearch = () => {
    Taro.showActionSheet({
      itemList: [
        '按日期检索',
        '按标签检索（高盐）',
        '按标签检索（高糖）',
        '按标签检索（清淡）'
      ],
      success: () => {
        Taro.showToast({ title: '检索功能开发中', icon: 'none' });
      }
    });
  };

  const maxBarHeight = Math.max(
    ...saltSugarData.map(d => Math.max(d.salt, d.sugar)),
    1
  );

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 周报周期 */}
      <View className={styles.weekHeader}>
        <View>
          <Text className={styles.weekTitle}>📊 周报分析</Text>
          <View className={styles.weekDate}>
            {formatDate(weekStart, 'MM.DD')} - {formatDate(weekEnd, 'MM.DD')}
          </View>
        </View>
        <View className={styles.weekNav}>
          <View className={styles.weekNavBtn} onClick={handlePrevWeek}>
            <Text>‹</Text>
          </View>
          <View
            className={styles.weekNavBtn}
            style={{ opacity: weekOffset < 0 ? 1 : 0.4 }}
            onClick={() => weekOffset < 0 && handleNextWeek()}
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
            <Text className={styles.qualColor}>{weeklyReport.qualifiedDays}</Text>
            <Text className={styles.overviewUnit}>/ {weeklyReport.totalDays}天</Text>
          </View>
          <Text className={styles.overviewSub}>
            达标率 {Math.round(weeklyReport.qualifiedDays / weeklyReport.totalDays * 100)}%
          </Text>
        </View>

        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>🧂</Text>
          <Text className={styles.overviewLabel}>高盐次数</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.saltColor}>{weeklyReport.highSaltCount}</Text>
            <Text className={styles.overviewUnit}>次</Text>
          </View>
          <Text className={styles.overviewSub}>
            {weeklyReport.highSaltCount <= 3 ? '控制良好 ✓' : '建议减少 ⚠️'}
          </Text>
        </View>

        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>🍰</Text>
          <Text className={styles.overviewLabel}>高糖次数</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.sugarColor}>{weeklyReport.highSugarCount}</Text>
            <Text className={styles.overviewUnit}>次</Text>
          </View>
          <Text className={styles.overviewSub}>
            {weeklyReport.highSugarCount <= 2 ? '控制良好 ✓' : '建议减少 ⚠️'}
          </Text>
        </View>

        <View className={styles.overviewCard}>
          <Text className={styles.overviewIcon}>⚖️</Text>
          <Text className={styles.overviewLabel}>平均体重</Text>
          <View className={styles.overviewValue}>
            <Text className={styles.weightColor}>{weeklyReport.avgWeight.toFixed(1)}</Text>
            <Text className={styles.overviewUnit}>kg</Text>
          </View>
          <Text className={styles.overviewSub}>
            日均饮水 {weeklyReport.avgWaterCups.toFixed(1)} 杯
          </Text>
        </View>
      </View>

      {/* 高盐高糖柱状图 */}
      <View className={styles.chartCard}>
        <View className={styles.chartHeader}>
          <Text className={styles.chartTitle}>
            <Text>📈</Text>
            高盐/高糖频次
          </Text>
          <Text className={styles.chartTag}>本周</Text>
        </View>

        <View className={styles.barChart}>
          {saltSugarData.map((item, index) => (
            <View key={index} className={styles.barItem}>
              <View style={{ display: 'flex', gap: '8rpx', alignItems: 'flex-end', height: '180rpx' }}>
                <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <Text className={styles.barValue}>{item.salt || ''}</Text>
                  <View
                    className={[styles.barFill, styles.barHighSalt].join(' ')}
                    style={{ height: `${(item.salt / maxBarHeight) * 140}rpx` }}
                  />
                </View>
                <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <Text className={styles.barValue}>{item.sugar || ''}</Text>
                  <View
                    className={[styles.barFill, styles.barHighSugar].join(' ')}
                    style={{ height: `${(item.sugar / maxBarHeight) * 140}rpx` }}
                  />
                </View>
              </View>
              <Text className={styles.barLabel}>{item.label}</Text>
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
            className={styles.lineSvg}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: 'auto', height: '200rpx', position: 'absolute', top: '32rpx', left: '32rpx', right: '32rpx', zIndex: 1 }}
          >
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <View className={styles.linePoints}>
            {weightData.map((point, index) => (
              <View
                key={index}
                className={styles.linePoint}
                style={{ height: '200rpx', position: 'relative' }}
              >
                <Text
                  className={styles.pointValue}
                  style={{ top: `${100 - point.percent - 14}%` }}
                >
                  {point.value.toFixed(1)}
                </Text>
                <View
                  className={styles.pointDot}
                  style={{ top: `${100 - point.percent}%` }}
                />
                <Text className={styles.pointLabel} style={{ bottom: '-32rpx' }}>
                  {point.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 历史检索入口 */}
      <View className={styles.entryCard} onClick={handleHistorySearch}>
        <View className={styles.entryInfo}>
          <Text className={styles.entryTitle}>
            <Text>🔍</Text>
            历史检索
          </Text>
          <Text className={styles.entryDesc}>按日期或食物标签查询历史记录</Text>
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
          {weeklyReport.suggestions.map((text, index) => (
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
    </ScrollView>
  );
};

export default ReportPage;
