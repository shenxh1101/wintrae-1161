import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { SYMPTOM_LIST, getToday, formatDateCN, formatWeekdayCN, MEAL_TYPE_LABELS, MEAL_ORDER, FOOD_TAGS } from '@/utils';
import type { SymptomType, MealType, FoodTagType, MealRecord } from '@/types';
import TagChip from '@/components/TagChip';
import EmptyState from '@/components/EmptyState';
import dayjs from 'dayjs';

const DailyPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(getToday());
  const [weightInput, setWeightInput] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [symptomNote, setSymptomNote] = useState<string>('');

  const {
    dailyRecords,
    mealRecords,
    updateDailyRecord,
    updateMealRecord,
    removeMealRecord
  } = useStore();

  const currentRecord = useMemo(() => {
    return dailyRecords.find(r => r.date === currentDate);
  }, [dailyRecords, currentDate]);

  const todayMealsCount = useMemo(() => {
    return mealRecords.filter(r => r.date === currentDate).length;
  }, [mealRecords, currentDate]);

  const [editingRecord, setEditingRecord] = useState<MealRecord | null>(null);
  const [editMealType, setEditMealType] = useState<MealType>('breakfast');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [editTags, setEditTags] = useState<FoodTagType[]>([]);
  const [editNote, setEditNote] = useState<string>('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  }, [currentDate, currentRecord]);

  const isToday = currentDate === getToday();

  const navigateDate = (offset: number) => {
    const newDate = dayjs(currentDate).add(offset, 'day').format('YYYY-MM-DD');
    if (dayjs(newDate).isAfter(dayjs())) return;
    setCurrentDate(newDate);
    setEditingRecord(null);
    setExpandedId(null);
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

  const dayMeals = useMemo(() => {
    return mealRecords.filter(r => r.date === currentDate);
  }, [mealRecords, currentDate]);

  const groupedMeals = useMemo(() => {
    const groups: Record<MealType, typeof dayMeals> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    dayMeals.forEach(m => {
      if (groups[m.mealType]) groups[m.mealType].push(m);
    });
    return groups;
  }, [dayMeals]);

  const openEditModal = (record: MealRecord) => {
    setEditingRecord(record);
    setEditMealType(record.mealType);
    setEditImageUrl(record.imageUrl);
    setEditTags([...record.tags]);
    setEditNote(record.note || '');
  };

  const closeEditModal = () => {
    setEditingRecord(null);
  };

  const toggleEditTag = (tag: FoodTagType) => {
    setEditTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleEditImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      if (res.tempFilePaths?.[0]) {
        setEditImageUrl(res.tempFilePaths[0]);
      }
    } catch (e) {
      const ids = [292, 312, 326, 401, 431, 570, 580, 625, 835, 1080];
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      setEditImageUrl(`https://picsum.photos/id/${randomId}/600/600`);
    }
  };

  const saveEdit = () => {
    if (!editingRecord) return;
    updateMealRecord(editingRecord.id, {
      mealType: editMealType,
      imageUrl: editImageUrl,
      tags: editTags,
      note: editNote.trim()
    });
    Taro.showToast({ title: '已更新', icon: 'success' });
    closeEditModal();
  };

  const handleDeleteEdit = (recordId?: string) => {
    const targetId = recordId || editingRecord?.id;
    if (!targetId) return;
    Taro.showModal({
      title: '确认删除',
      content: '确定删除这条餐食记录吗？删除后无法恢复。',
      confirmColor: '#EF4444',
      success: (r) => {
        if (r.confirm) {
          removeMealRecord(targetId);
          Taro.showToast({ title: '已删除', icon: 'success' });
          closeEditModal();
          if (expandedId === targetId) setExpandedId(null);
        }
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

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

      {/* 当日饮食总览 */}
      <View className={styles.sectionCard}>
        <View className={styles.overviewHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🍱</Text>
            当日饮食总览
          </Text>
          {dayMeals.length > 0 && (
            <Text className={styles.overviewHint}>点击展开，可编辑</Text>
          )}
        </View>
        {dayMeals.length > 0 ? (
          <View>
            {MEAL_ORDER.map(mealType => {
              const meals = groupedMeals[mealType];
              if (meals.length === 0) return null;
              return (
                <View key={mealType} className={styles.mealTypeGroup}>
                  <View className={styles.mealTypeHeader}>
                    <Text className={styles.mealTypeDot}>●</Text>
                    <Text className={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[mealType]}</Text>
                    <Text className={styles.mealTypeCount}>· {meals.length} 条</Text>
                  </View>
                  <View className={styles.mealGroupList}>
                    {meals.map(record => {
                      const isExpanded = expandedId === record.id;
                      return (
                        <View key={record.id} className={styles.dailyMealCard}>
                          <View className={styles.dailyMealMain} onClick={() => toggleExpand(record.id)}>
                            <Image className={styles.dailyMealImg} src={record.imageUrl} mode="aspectFill" />
                            <View className={styles.dailyMealInfo}>
                              <View className={styles.dailyMealTop}>
                                <Text className={styles.dailyMealTime}>{record.createdAt.slice(11)}</Text>
                                <Text className={styles.dailyMealExpandIcon}>
                                  {isExpanded ? '收起 ▲' : '展开 ▼'}
                                </Text>
                              </View>
                              {record.tags.length > 0 && (
                                <View className={styles.dailyMealTags}>
                                  {record.tags.slice(0, 3).map(t => (
                                    <TagChip key={t} tagKey={t} size="sm" />
                                  ))}
                                  {record.tags.length > 3 && (
                                    <Text className={styles.moreTags}>+{record.tags.length - 3}</Text>
                                  )}
                                </View>
                              )}
                              {record.note && (
                                <Text className={styles.dailyMealBriefNote}>
                                  {isExpanded ? record.note : record.note.length > 30 ? record.note.slice(0, 30) + '...' : record.note}
                                </Text>
                              )}
                            </View>
                          </View>

                          {isExpanded && (
                            <View className={styles.dailyMealExpanded}>
                              <View className={styles.expandedSection}>
                                <Text className={styles.expandedLabel}>🏷️ 全部标签</Text>
                                <View className={styles.expandedTags}>
                                  {record.tags.length > 0 ? (
                                    record.tags.map(t => (
                                      <TagChip key={t} tagKey={t} size="md" />
                                    ))
                                  ) : (
                                    <Text className={styles.expandedEmpty}>暂无标签</Text>
                                  )}
                                </View>
                              </View>
                              {record.note && (
                                <View className={styles.expandedSection}>
                                  <Text className={styles.expandedLabel}>📝 备注</Text>
                                  <Text className={styles.expandedNote}>{record.note}</Text>
                                </View>
                              )}
                              <View className={styles.expandedActions}>
                                <Button
                                  className={classnames(styles.expandBtn, styles.expandBtnEdit)}
                                  onClick={() => openEditModal(record)}
                                >
                                  <Text className={styles.expandBtnEditText}>✏️ 编辑记录</Text>
                                </Button>
                                <Button
                                  className={classnames(styles.expandBtn, styles.expandBtnDelete)}
                                  onClick={handleDeleteEdit.bind(null, record.id)}
                                >
                                  <Text className={styles.expandBtnDeleteText}>🗑️ 删除</Text>
                                </Button>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            title="当日暂无饮食记录"
            description="切换到「饮食拍照」页面开始记录吧"
          />
        )}
      </View>

      {/* 编辑弹窗 */}
      {editingRecord && (
        <View className={styles.editModalMask} onClick={closeEditModal}>
          <View className={styles.editModal} onClick={(e) => e.stopPropagation?.()}>
            <View className={styles.editModalHeader}>
              <Text className={styles.editModalTitle}>✏️ 编辑餐食记录</Text>
              <Text className={styles.editModalClose} onClick={closeEditModal}>×</Text>
            </View>

            <ScrollView scrollY className={styles.editModalBody}>
              {/* 餐次选择 */}
              <View className={styles.editField}>
                <Text className={styles.editFieldLabel}>餐次类型</Text>
                <View className={styles.editMealTypeRow}>
                  {MEAL_ORDER.map(t => (
                    <View
                      key={t}
                      className={classnames(styles.editMealTypeBtn, {
                        [styles.editMealTypeActive]: editMealType === t
                      })}
                      onClick={() => setEditMealType(t)}
                    >
                      <Text className={classnames({ [styles.editMealTypeActiveText]: editMealType === t })}>
                        {MEAL_TYPE_LABELS[t]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 图片 */}
              <View className={styles.editField}>
                <Text className={styles.editFieldLabel}>餐食图片</Text>
                <View className={styles.editPhoto} onClick={handleEditImage}>
                  {editImageUrl ? (
                    <Image className={styles.editPhotoImg} src={editImageUrl} mode="aspectFill" />
                  ) : (
                    <Text>点击选择图片</Text>
                  )}
                </View>
              </View>

              {/* 标签 */}
              <View className={styles.editField}>
                <Text className={styles.editFieldLabel}>食物标签（可多选）</Text>
                <View className={styles.editTags}>
                  {FOOD_TAGS.map(t => (
                    <TagChip
                      key={t.key}
                      tagKey={t.key}
                      size="md"
                      selected={editTags.includes(t.key)}
                      onClick={() => toggleEditTag(t.key)}
                    />
                  ))}
                </View>
              </View>

              {/* 备注 */}
              <View className={styles.editField}>
                <Text className={styles.editFieldLabel}>备注</Text>
                <Textarea
                  className={styles.editNoteInput}
                  placeholder="添加备注..."
                  value={editNote}
                  onInput={(e) => setEditNote(e.detail.value)}
                  maxlength={200}
                  autoHeight
                />
              </View>
            </ScrollView>

            <View className={styles.editModalFooter}>
              <Button
                className={classnames(styles.editModalBtn, styles.editModalBtnDelete)}
                onClick={handleDeleteEdit}
              >
                <Text className={styles.editModalBtnDeleteText}>删除</Text>
              </Button>
              <Button
                className={classnames(styles.editModalBtn, styles.editModalBtnSave)}
                onClick={saveEdit}
              >
                <Text className={styles.editModalBtnSaveText}>保存修改</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

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
