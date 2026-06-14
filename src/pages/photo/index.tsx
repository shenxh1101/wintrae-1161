import React, { useState, useMemo } from 'react';
import { View, Text, Image, Textarea, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import TagChip from '@/components/TagChip';
import MealCard from '@/components/MealCard';
import EmptyState from '@/components/EmptyState';
import { useStore } from '@/store/useStore';
import { FOOD_TAGS, MEAL_TYPE_LABELS, getToday, formatFullDateCN } from '@/utils';
import type { MealType, FoodTagType } from '@/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const PHOTO_IMAGE_IDS = [292, 312, 326, 401, 431, 570, 580, 625, 835, 1080];

const getDefaultMealType = (): MealType => {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 19) return 'dinner';
  return 'snack';
};

const PhotoPage: React.FC = () => {
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<FoodTagType[]>([]);
  const [note, setNote] = useState<string>('');

  const { mealRecords, consecutiveDays, addMealRecord } = useStore();
  const today = getToday();

  const todayRecords = useMemo(() => {
    return mealRecords.filter(r => r.date === today);
  }, [mealRecords, today]);

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 11) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  const toggleTag = (tagKey: FoodTagType) => {
    setSelectedTags(prev =>
      prev.includes(tagKey)
        ? prev.filter(k => k !== tagKey)
        : [...prev, tagKey]
    );
  };

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setImageUrl(res.tempFilePaths[0]);
        console.log('[PhotoPage] Image selected:', res.tempFilePaths[0]);
      }
    } catch (err) {
      console.warn('[PhotoPage] chooseImage cancelled, using mock image');
      const randomId = PHOTO_IMAGE_IDS[Math.floor(Math.random() * PHOTO_IMAGE_IDS.length)];
      setImageUrl(`https://picsum.photos/id/${randomId}/600/600`);
    }
  };

  const handleSave = () => {
    if (!imageUrl) {
      Taro.showToast({ title: '请先添加餐食图片', icon: 'none' });
      return;
    }

    addMealRecord({
      date: today,
      mealType,
      imageUrl,
      tags: selectedTags,
      note: note.trim()
    });

    console.log('[PhotoPage] Meal record saved:', { mealType, tags: selectedTags, hasNote: !!note });

    Taro.showToast({ title: '记录成功！', icon: 'success' });
    setImageUrl('');
    setSelectedTags([]);
    setNote('');
    setMealType(getDefaultMealType());
  };

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 连续打卡区域 */}
      <View className={styles.streakCard}>
        <View className={styles.streakHeader}>
          <View className={styles.greeting}>
            <Text className={styles.greetingText}>{greetingText}，今天也要健康饮食哦 💪</Text>
            <Text className={styles.dateText}>{formatFullDateCN(new Date())}</Text>
          </View>
        </View>
        <View className={styles.streakMain}>
          <Text className={styles.streakNumber}>{consecutiveDays}</Text>
          <Text className={styles.streakUnit}>天连续达标</Text>
        </View>
        <Text className={styles.streakTip}>保持健康饮食习惯，慢性病管理需要长期坚持！</Text>
      </View>

      {/* 快速记录区域 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>快速记录</Text>

        {/* 餐次选择 */}
        <View className={styles.mealSelector}>
          {MEAL_ORDER.map(type => (
            <View
              key={type}
              className={classnames(styles.mealOption, {
                [styles.mealOptionActive]: mealType === type
              })}
              onClick={() => setMealType(type)}
            >
              <Text className={styles.mealOptionText}>{MEAL_TYPE_LABELS[type]}</Text>
            </View>
          ))}
        </View>

        {/* 拍照区域 */}
        <View
          className={classnames(styles.photoArea, {
            [styles.photoAreaFilled]: !!imageUrl
          })}
          onClick={handleChooseImage}
        >
          {imageUrl ? (
            <Image className={styles.previewImage} src={imageUrl} mode="aspectFill" />
          ) : (
            <View className={styles.photoPlaceholder}>
              <Text className={styles.photoIcon}>📷</Text>
              <Text className={styles.photoHint}>点击拍照或从相册选择</Text>
              <Text className={styles.photoSmallHint}>记录你的每一餐</Text>
            </View>
          )}
        </View>

        {/* 食物标签 */}
        <View className={styles.tagsSection}>
          <Text className={styles.sectionTitle} style={{ marginBottom: '16rpx' }}>食物标签（可多选）</Text>
          <ScrollView scrollX className={styles.tagsScroll} enhanced showScrollbar={false}>
            <View className={styles.tagsInner}>
              {FOOD_TAGS.map(tag => (
                <TagChip
                  key={tag.key}
                  tagKey={tag.key}
                  size="md"
                  selected={selectedTags.includes(tag.key)}
                  onClick={() => toggleTag(tag.key)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 备注输入 */}
        <Textarea
          className={styles.noteInput}
          placeholder="添加备注，如：食物分量、特殊做法等..."
          placeholderClass={styles.photoSmallHint}
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={200}
          autoHeight
        />

        {/* 保存按钮 */}
        <Button
          className={styles.saveButton}
          onClick={handleSave}
        >
          <Text className={styles.saveButtonText}>保存记录</Text>
        </Button>
      </View>

      {/* 今日记录列表 */}
      <View className={styles.listSection}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>今日饮食记录</Text>
          <Text className={styles.listCount}>共 {todayRecords.length} 条</Text>
        </View>
        {todayRecords.length > 0 ? (
          <View className={styles.recordList}>
            {todayRecords.map(record => (
              <MealCard key={record.id} record={record} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="今日还没有记录"
            description="开始记录你的第一餐吧，坚持就是胜利！"
          />
        )}
      </View>
    </ScrollView>
  );
};

export default PhotoPage;
