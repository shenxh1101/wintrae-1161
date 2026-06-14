import React, { useState } from 'react';
import { View, Text, Switch, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import type { ReminderSetting } from '@/types';

const ICON_BG_COLORS = [
  'rgba(16, 185, 129, 0.12)',
  'rgba(59, 130, 246, 0.12)',
  'rgba(245, 158, 11, 0.12)',
  'rgba(139, 92, 246, 0.12)',
  'rgba(236, 72, 153, 0.12)',
  'rgba(20, 184, 166, 0.12)'
];

const ITEM_ICONS = ['🌅', '☀️', '🌙', '🥤', '🍎', '⚖️'];

const MILESTONES = [7, 14, 30, 60, 100];

const ReminderPage: React.FC = () => {
  const { reminderSettings, consecutiveDays, updateReminderSetting } = useStore();

  const mealReminders = reminderSettings.slice(0, 3);
  const otherReminders = reminderSettings.slice(3);

  const handleToggle = (index: number, enabled: boolean) => {
    updateReminderSetting(index, { enabled });
    console.log('[ReminderPage] Toggle reminder:', { index, enabled });
    Taro.showToast({
      title: enabled ? '提醒已开启' : '提醒已关闭',
      icon: 'none',
      duration: 1500
    });
  };

  const handleTimeClick = (index: number, currentTime: string, label: string) => {
    Taro.showActionSheet({
      itemList: [
        `提前 30 分钟 (${addMinutes(currentTime, -30)})`,
        `保持原时间 (${currentTime})`,
        `延后 30 分钟 (${addMinutes(currentTime, 30)})`,
        '自定义时间...'
      ],
      success: (res) => {
        let newTime = currentTime;
        if (res.tapIndex === 0) newTime = addMinutes(currentTime, -30);
        else if (res.tapIndex === 2) newTime = addMinutes(currentTime, 30);
        else if (res.tapIndex === 3) {
          Taro.showToast({ title: '自定义功能开发中', icon: 'none' });
          return;
        }
        updateReminderSetting(index, { time: newTime });
        console.log('[ReminderPage] Time updated:', { label, from: currentTime, to: newTime });
        Taro.showToast({ title: '时间已更新', icon: 'success' });
      }
    });
  };

  const addMinutes = (timeStr: string, minutes: number): string => {
    const [h, m] = timeStr.split(':').map(Number);
    let totalMin = h * 60 + m + minutes;
    if (totalMin < 0) totalMin += 24 * 60;
    if (totalMin >= 24 * 60) totalMin -= 24 * 60;
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const getStreakMessage = (days: number): string => {
    if (days >= 100) return '太厉害了！坚持100天，习惯已成自然！🌟';
    if (days >= 60) return '坚持60天！你已经超越了大多数人，继续加油！💪';
    if (days >= 30) return '满月达成！一个月的坚持证明了你的毅力！🎉';
    if (days >= 14) return '两周达成！习惯正在形成，保持这个节奏！🔥';
    if (days >= 7) return '一周打卡成功！身体已经开始感受到变化！✨';
    return `再来${7 - days}天就能达成一周目标，坚持住！🎯`;
  };

  const renderSettingList = (items: ReminderSetting[], startIndex: number) => (
    <View className={styles.settingsCard}>
      {items.map((item, i) => {
        const realIndex = startIndex + i;
        return (
          <View
            key={item.label}
            className={styles.settingItem}
            onClick={() => handleTimeClick(realIndex, item.time, item.label)}
          >
            <View
              className={styles.itemIconWrap}
              style={{ backgroundColor: ICON_BG_COLORS[realIndex % ICON_BG_COLORS.length] }}
            >
              <Text className={styles.itemIcon}>{ITEM_ICONS[realIndex % ITEM_ICONS.length]}</Text>
            </View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemLabel}>{item.label}</Text>
              <View className={styles.itemTime}>
                <Text className={styles.timeBadge}>
                  ⏰ {item.time}
                </Text>
                <Text style={{ marginLeft: '8rpx' }}>点击修改时间</Text>
              </View>
            </View>
            <Switch
              checked={item.enabled}
              color="#10B981"
              onChange={(e) => {
                e.stopPropagation?.();
                handleToggle(realIndex, e.detail.value);
              }}
              onClick={(e) => e.stopPropagation?.()}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 连续达标激励卡片 */}
      <View className={styles.streakCard}>
        <View className={styles.streakInner}>
          <Text className={styles.streakLabel}>🔥 健康习惯连续打卡</Text>
          <View className={styles.streakMainRow}>
            <Text className={styles.streakNumber}>{consecutiveDays}</Text>
            <Text className={styles.streakUnit}>天</Text>
            <Text className={styles.streakEmoji}>
              {consecutiveDays >= 30 ? '🏆' : consecutiveDays >= 7 ? '🎖️' : '💪'}
            </Text>
          </View>
          <Text className={styles.streakMsg}>{getStreakMessage(consecutiveDays)}</Text>
        </View>
      </View>

      {/* 里程碑进度 */}
      <View className={styles.milestoneCard}>
        <View className={styles.milestoneHeader}>
          <Text>🏅</Text>
          <Text className={styles.milestoneTitle}>里程碑进度</Text>
        </View>
        <View className={styles.milestoneList}>
          {MILESTONES.map(day => {
            const isReached = consecutiveDays >= day;
            const isCurrent = !isReached && (day === MILESTONES.find(m => m > consecutiveDays) || MILESTONES[MILESTONES.length - 1]);
            return (
              <View
                key={day}
                className={classnames(styles.milestoneItem, {
                  [styles.milestoneItemActive]: isCurrent,
                  [styles.milestoneItemReached]: isReached
                })}
              >
                <Text className={classnames(styles.milestoneDay, {
                  [styles.milestoneActiveDay]: isCurrent
                })}>
                  {isReached ? '✓' : day}
                </Text>
                <Text className={styles.milestoneLabel}>
                  {isReached ? `${day}天已达成` : `${day}天目标`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 用餐提醒 */}
      <View className={styles.sectionGroup}>
        <View className={styles.groupHeader}>
          <Text className={styles.groupIcon}>🍽️</Text>
          <Text className={styles.groupTitle}>用餐提醒</Text>
        </View>
        {renderSettingList(mealReminders, 0)}
      </View>

      {/* 其他提醒 */}
      <View className={styles.sectionGroup}>
        <View className={styles.groupHeader}>
          <Text className={styles.groupIcon}>⚙️</Text>
          <Text className={styles.groupTitle}>其他提醒</Text>
        </View>
        {renderSettingList(otherReminders, 3)}
      </View>

      {/* 温馨提示 */}
      <View className={styles.tipsCard}>
        <View className={styles.tipsIcon}>
          <Text>💡</Text>
        </View>
        <View className={styles.tipsContent}>
          <Text className={styles.tipsTitle}>关于提醒</Text>
          <Text className={styles.tipsText}>
            • 请允许系统发送通知权限，以便准时提醒{'\n'}
            • 提醒时间可根据个人作息灵活调整{'\n'}
            • 坚持按时记录，养成健康生活习惯
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ReminderPage;
