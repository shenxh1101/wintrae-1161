import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无记录',
  description = '点击开始记录你的第一餐吧'
}) => {
  return (
    <View className={styles.emptyWrap}>
      <View className={styles.iconBox}>
        <Text className={styles.icon}>🍽️</Text>
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.desc}>{description}</Text>
    </View>
  );
};

export default EmptyState;
