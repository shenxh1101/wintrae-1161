import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  color?: string;
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, highlight, color, children }) => {
  return (
    <View className={classnames(styles.statCard, { [styles.highlight]: highlight })}>
      <Text className={styles.label}>{label}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value} style={{ color }}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>
      </View>
      {children}
    </View>
  );
};

export default StatCard;
