import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import TagChip from '@/components/TagChip';
import { MEAL_TYPE_LABELS } from '@/utils';
import type { MealRecord } from '@/types';

interface MealCardProps {
  record: MealRecord;
}

const MealCard: React.FC<MealCardProps> = ({ record }) => {
  return (
    <View className={styles.mealCard}>
      <View className={styles.imageWrap}>
        <Image
          className={styles.mealImage}
          src={record.imageUrl}
          mode="aspectFill"
        />
        <View className={styles.mealBadge}>
          <Text className={styles.badgeText}>{MEAL_TYPE_LABELS[record.mealType]}</Text>
        </View>
      </View>
      <View className={styles.content}>
        <View className={styles.headerRow}>
          <Text className={styles.timeText}>{record.createdAt.slice(11)}</Text>
        </View>
        {record.tags.length > 0 && (
          <View className={styles.tagsWrap}>
            {record.tags.map(tag => (
              <TagChip key={tag} tagKey={tag} size="sm" />
            ))}
          </View>
        )}
        {record.note && (
          <Text className={styles.noteText}>{record.note}</Text>
        )}
      </View>
    </View>
  );
};

export default MealCard;
