import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import type { ReminderSetting } from '@/types';
import { addMinutes, isValidTime } from '@/utils';

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

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState<string>('');

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

  const handleTimeClick = (index: number, currentTime: string) => {
    setEditingIdx(index);
    setEditingTime(currentTime);
  };

  const closeEditModal = () => {
    setEditingIdx(null);
    setEditingTime('');
  };

  const handleQuickSet = (minutes: number) => {
    if (editingIdx === null) return;
    const baseTime = editingTime || reminderSettings[editingIdx].time;
    setEditingTime(addMinutes(baseTime, minutes));
  };

  const handleHourChange = (val: string) => {
    let h = parseInt(val) || 0;
    if (h < 0) h = 0;
    if (h > 23) h = 23;
    const [, m] = editingTime.split(':');
    setEditingTime(`${String(h).padStart(2, '0')}:${m || '00'}`);
  };

  const handleMinuteChange = (val: string) => {
    let mi = parseInt(val) || 0;
    if (mi < 0) mi = 0;
    if (mi > 59) mi = 59;
    const [h] = editingTime.split(':');
    setEditingTime(`${h || '00'}:${String(mi).padStart(2, '0')}`);
  };

  const confirmTimeEdit = () => {
    if (editingIdx === null) return;
    if (!isValidTime(editingTime)) {
      Taro.showToast({ title: '请输入正确的时间格式', icon: 'none' });
      return;
    }
    updateReminderSetting(editingIdx, { time: editingTime });
    console.log('[ReminderPage] Time updated:', {
      index: editingIdx,
      label: reminderSettings[editingIdx].label,
      newTime: editingTime
    });
    Taro.showToast({ title: `已更新为 ${editingTime}`, icon: 'success' });
    closeEditModal();
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
            onClick={() => handleTimeClick(realIndex, item.time)}
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
            />
          </View>
        );
      })}
    </View>
  );

  const editingItem = editingIdx !== null ? reminderSettings[editingIdx] : null;
  const [editH, editM] = editingTime ? editingTime.split(':') : ['00', '00'];

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
            const isCurrent = !isReached && day === (MILESTONES.find(m => m > consecutiveDays) || MILESTONES[MILESTONES.length - 1]);
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
            • 提醒时间可点击任意自定义修改{'\n'}
            • 坚持按时记录，养成健康生活习惯
          </Text>
        </View>
      </View>

      {/* 时间编辑弹窗 */}
      {editingIdx !== null && editingItem && (
        <View className={styles.modalMask} onClick={closeEditModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation?.()}>
            <Text className={styles.modalTitle}>
              ⏰ 修改{editingItem.label}时间
            </Text>

            {/* 时间输入 */}
            <View className={styles.timeEditWrap}>
              <View className={styles.timeInputGroup}>
                <Text className={styles.timeInputLabel}>时</Text>
                <Input
                  className={styles.timeInput}
                  type="number"
                  value={editH}
                  onInput={(e) => handleHourChange(e.detail.value)}
                  maxlength={2}
                />
              </View>
              <Text className={styles.timeColon}>:</Text>
              <View className={styles.timeInputGroup}>
                <Text className={styles.timeInputLabel}>分</Text>
                <Input
                  className={styles.timeInput}
                  type="number"
                  value={editM}
                  onInput={(e) => handleMinuteChange(e.detail.value)}
                  maxlength={2}
                />
              </View>
            </View>

            {/* 快速调节 */}
            <View className={styles.quickSetWrap}>
              <Text className={styles.quickSetLabel}>快速调节</Text>
              <View className={styles.quickSetBtns}>
                <View className={styles.quickBtn} onClick={() => handleQuickSet(-60)}>
                  <Text>-1小时</Text>
                </View>
                <View className={styles.quickBtn} onClick={() => handleQuickSet(-30)}>
                  <Text>-30分</Text>
                </View>
                <View className={styles.quickBtn} onClick={() => handleQuickSet(-10)}>
                  <Text>-10分</Text>
                </View>
                <View className={classnames(styles.quickBtn, styles.quickBtnPrimary)} onClick={() => handleQuickSet(10)}>
                  <Text>+10分</Text>
                </View>
                <View className={classnames(styles.quickBtn, styles.quickBtnPrimary)} onClick={() => handleQuickSet(30)}>
                  <Text>+30分</Text>
                </View>
                <View className={classnames(styles.quickBtn, styles.quickBtnPrimary)} onClick={() => handleQuickSet(60)}>
                  <Text>+1小时</Text>
                </View>
              </View>
            </View>

            {/* 常用时间 */}
            <View className={styles.quickSetWrap}>
              <Text className={styles.quickSetLabel}>常用时间</Text>
              <View className={styles.presetBtns}>
                {['06:00', '07:00', '07:30', '08:00', '09:00', '12:00', '12:30', '13:00', '18:00', '18:30', '19:00', '21:00'].map(t => (
                  <View
                    key={t}
                    className={classnames(styles.presetBtn, { [styles.presetBtnActive]: editingTime === t })}
                    onClick={() => setEditingTime(t)}
                  >
                    <Text>{t}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalActions}>
              <View className={styles.modalBtnCancel} onClick={closeEditModal}>
                取消
              </View>
              <View className={styles.modalBtnConfirm} onClick={confirmTimeEdit}>
                确认修改
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReminderPage;
