import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { FOOD_TAGS } from '@/utils';
import type { FoodTagType } from '@/types';

interface TagChipProps {
  tagKey: FoodTagType;
  size?: 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
}

const TagChip: React.FC<TagChipProps> = ({ tagKey, size = 'md', selected, onClick }) => {
  const tagConfig = FOOD_TAGS.find(t => t.key === tagKey);
  if (!tagConfig) return null;

  const { label, bgColor, textColor } = tagConfig;

  return (
    <View
      className={classnames(styles.tagChip, styles[size], { [styles.selected]: selected })}
      style={{ backgroundColor: bgColor, borderColor: selected ? textColor : 'transparent' }}
      onClick={onClick}
    >
      <Text className={styles.tagText} style={{ color: textColor }}>{label}</Text>
    </View>
  );
};

export default TagChip;
