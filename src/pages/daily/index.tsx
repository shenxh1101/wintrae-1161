import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { SYMPTOM_LIST, getToday, formatDateCN, formatWeekdayCN } from '@/utils';
import type { SymptomType } from '@/types';
import dayjs from 'dayjs';

const DailyPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(getToday());
  const [weightInput, setWeightInput] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [symptomNote, setSymptomNote] = useState<string>('');

  const {
    dailyRecords,
    mealRecords,
    updateDailyRecord
  } = useStore();

  const currentRecord = useMemo(() => {
    return dailyRecords.find(r => r.date === currentDate);
  }, [dailyRecords, currentDate]);

  const todayMealsCount = useMemo(() => {
    return mealRecords.filter(r => r.date === currentDate).length;
  }, [mealRecords, currentDate]);

  // 加载当前日期的记录到表单
  useEffect(() => {
    if (currentRecord) {
      setWeightInput(currentRecord.weight ? currentRecord.weight.toString() : '');
      setSelectedSymptoms(currentRecord.symptoms);
      setSymptomNote(currentRecord.symptomNote);
    } else {
      setWeightInput('');
      setSelectedSymptoms([]);
      setSymptomNote('');
    }
    console.log('[DailyPage] Loaded record for date:', currentDate, currentRecord);
  }, [currentDate, currentRecord]);

  const isToday = currentDate === getToday();

  const navigateDate = (offset: number) => {
    const newDate = dayjs(currentDate).add(offset, 'day').format('YYYY-MM-DD');
    if (dayjs(newDate).isAfter(dayjs())) return;
    setCurrentDate(newDate);
  };

  const handleWeightChange = (value: string) => {
    setWeightInput(value);
    const numValue = value === '' ? null : parseFloat(value);
    if (!isNaN(parseFloat(value)) || value === '') {
      updateDailyRecord(currentDate, { weight: numValue });
    }
  };

  const handleWaterChange = (delta: number) => {
    const currentCups = currentRecord?.waterCups || 0;
    const newCups = Math.max(0, Math.min(15, currentCups + delta));
    updateDailyRecord(currentDate, { waterCups: newCups });
    console.log('[DailyPage] Water updated:', { from: currentCups, to: newCups });
  };

  const toggleSymptom = (symptomKey: SymptomType) => {
    const newSymptoms = selectedSymptoms.includes(symptomKey)
      ? selectedSymptoms.filter(k => k !== symptomKey)
      : [...selectedSymptoms, symptomKey];
    setSelectedSymptoms(newSymptoms);
    updateDailyRecord(currentDate, { symptoms: newSymptoms });
  };

  const handleSymptomNoteChange = (value: string) => {
    setSymptomNote(value);
    updateDailyRecord(currentDate, { symptomNote: value });
  };

  const waterCups = currentRecord?.waterCups || 0;
  const waterGoal = 8;
  const waterPercent = Math.min(100, Math.round((waterCups / waterGoal) * 100));

  const previousRecord = useMemo(() => {
    const prevDate = dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
    return dailyRecords.find(r => r.date === prevDate);
  }, [dailyRecords, currentDate]);

  const weightDiff = useMemo(() => {
    if (currentRecord?.weight && previousRecord?.weight) {
      return +(currentRecord.weight - previousRecord.weight).toFixed(1);
    }
    return 0;
  }, [currentRecord, previousRecord]);

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 日期切换条 */}
      <View className={styles.dateBar}>
        <View className={styles.navArrow} onClick={() => navigateDate(-1)}>
          <Text>‹</Text>
        </View>
        <View className={styles.dateInfo}>
          <Text className={styles.dateMain}>
            {formatDateCN(currentDate, 'MM月DD日')}
            {isToday && <Text className={styles.todayBadge}>今天</Text>}
          </Text>
          <Text className={styles.dateSub}>{formatWeekdayCN(currentDate)}</Text>
        </View>
        <View
          className={classnames(styles.navArrow, { [styles.navArrowDisabled]: isToday })}
          onClick={() => !isToday && navigateDate(1)}
          style={{ opacity: isToday ? 0.4 : 1 }}
        >
          <Text>›</Text>
        </View>
      </View>

      {/* 当日汇总卡片 */}
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>📊 当日数据汇总</Text>
        <View className={styles.summaryStats}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{todayMealsCount}</Text>
            <Text className={styles.summaryLabel}>饮食记录(条)</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{waterCups}/{waterGoal}</Text>
            <Text className={styles.summaryLabel}>饮水(杯)</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{selectedSymptoms.length}</Text>
            <Text className={styles.summaryLabel}>异常症状</Text>
          </View>
        </View>
        <View className={styles.summaryQual}>
          <Text>{currentRecord?.isQualified ? '✅' : '⚠️'}</Text>
          <Text className={styles.summaryQualText}>
            {currentRecord?.isQualified ? '当日健康达标' : '需要关注饮食健康'}
          </Text>
        </View>
      </View>

      {/* 体重 + 饮水 卡片 */}
      <View className={styles.statsRow}>
        {/* 体重卡片 */}
        <View className={styles.weightCard}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardLabel}>体重</Text>
            <Text className={styles.cardIcon}>⚖️</Text>
          </View>
          <View className={styles.weightInputRow}>
            <Input
              className={styles.weightInput}
              type="digit"
              placeholder="--"
              placeholderStyle="color: #D1D5DB;"
              value={weightInput}
              onInput={(e) => handleWeightChange(e.detail.value)}
              maxlength={5}
            />
            <Text className={styles.weightUnit}>kg</Text>
          </View>
          {weightDiff !== 0 && previousRecord?.weight ? (
            <View className={classnames(styles.weightTrend, {
              [styles.trendDown]: weightDiff < 0,
              [styles.trendUp]: weightDiff > 0
            })}>
              <Text>{weightDiff > 0 ? '↑' : '↓'}</Text>
              <Text>较昨日 {weightDiff > 0 ? '+' : ''}{weightDiff}kg</Text>
            </View>
          ) : (
            <View className={styles.weightTrend} style={{ color: '#9CA3AF' }}>
              <Text>— 暂无对比数据</Text>
            </View>
          )}
        </View>

        {/* 饮水卡片 */}
        <View className={styles.waterCard}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardLabel}>饮水</Text>
            <Text className={styles.cardIcon}>💧</Text>
          </View>
          <View className={styles.waterCountRow}>
            <Text className={styles.waterNumber}>{waterCups}</Text>
            <Text className={styles.waterGoal}> / {waterGoal} 杯</Text>
          </View>
          <View className={styles.waterProgressWrap}>
            <View className={styles.waterProgressBar}>
              <View
                className={styles.waterProgressFill}
                style={{ width: `${waterPercent}%` }}
              />
            </View>
            <Text className={styles.cardLabel} style={{ fontSize: '20rpx' }}>
              完成 {waterPercent}%
            </Text>
          </View>
          <View className={styles.waterControl}>
            <Button
              className={classnames(styles.waterBtn)}
              onClick={() => handleWaterChange(-1)}
            >
              <Text>-1</Text>
            </Button>
            <Button
              className={classnames(styles.waterBtn, styles.waterBtnPrimary)}
              onClick={() => handleWaterChange(1)}
            >
              <Text>+1 杯</Text>
            </Button>
          </View>
        </View>
      </View>

      {/* 异常症状记录 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🩺</Text>
          异常症状记录
        </Text>
        <View className={styles.symptomGrid}>
          {SYMPTOM_LIST.map(item => (
            <View
              key={item.key}
              className={classnames(styles.symptomChip, {
                [styles.symptomChipActive]: selectedSymptoms.includes(item.key)
              })}
              onClick={() => toggleSymptom(item.key)}
            >
              <Text className={styles.symptomText}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Textarea
          className={styles.symptomNoteInput}
          placeholder="补充说明症状详情、持续时间等（选填）..."
          placeholderStyle="color: #9CA3AF; font-size: 26rpx;"
          value={symptomNote}
          onInput={(e) => handleSymptomNoteChange(e.detail.value)}
          maxlength={200}
          autoHeight
        />
      </View>

      {/* 历史记录说明 */}
      <View className={styles.sectionCard} style={{ marginBottom: 0 }}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💡</Text>
          温馨提示
        </Text>
        <Text style={{
          fontSize: '26rpx',
          color: '#6B7280',
          lineHeight: 1.7
        }}>
          • 建议每日清晨空腹测量体重，数据更准确{'\n'}
          • 慢性病患者每日饮水建议 1500-2000ml（约8杯）{'\n'}
          • 出现持续不适症状请及时就医，本应用不替代诊疗
        </Text>
      </View>
    </ScrollView>
  );
};

export default DailyPage;
