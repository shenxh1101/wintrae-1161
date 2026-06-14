import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { MealRecord, DailyRecord, ReminderSetting, FamilyMember, WeeklyReport } from '@/types';
import {
  mockMealRecords,
  mockDailyRecords,
  mockReminderSettings,
  mockFamilyMembers,
  mockConsecutiveDays
} from '@/data/mockData';
import {
  generateId,
  getToday,
  getWeekDates,
  getWeekStart,
  getWeekEnd,
  isDateInWeek,
  maskPhone,
  getRandomAvatarForRelation
} from '@/utils';
import dayjs from 'dayjs';

const STORAGE_KEY = 'chronic_diet_app_state_v1';

interface AppState {
  mealRecords: MealRecord[];
  dailyRecords: DailyRecord[];
  reminderSettings: ReminderSetting[];
  familyMembers: FamilyMember[];
  weeklyReport: WeeklyReport;
  consecutiveDays: number;
  currentDate: string;
  familySharingEnabled: boolean;
  _hydrated: boolean;

  hydrate: () => void;
  persist: () => void;

  addMealRecord: (record: Omit<MealRecord, 'id' | 'createdAt'>) => void;
  updateMealRecord: (id: string, updates: Partial<MealRecord>) => void;
  removeMealRecord: (id: string) => void;
  updateDailyRecord: (date: string, updates: Partial<DailyRecord>) => void;
  updateReminderSetting: (index: number, updates: Partial<ReminderSetting>) => void;

  toggleFamilySharing: () => void;
  addFamilyMember: (data: { name: string; relation: string; phone: string; canView?: boolean; canEdit?: boolean }) => void;
  removeFamilyMember: (id: string) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;

  setCurrentDate: (date: string) => void;
  computeWeeklyReport: (weekOffset?: number) => WeeklyReport;
  recomputeConsecutiveDays: () => number;
  recomputeDailyQualified: (date: string) => void;
  resetAll: () => void;
}

const defaultWeeklyReport: WeeklyReport = {
  weekStart: getWeekStart(),
  weekEnd: getWeekEnd(),
  highSaltCount: 0,
  highSugarCount: 0,
  qualifiedDays: 0,
  totalDays: 7,
  avgWeight: 67.5,
  avgWaterCups: 6,
  trend: [67.5, 67.5, 67.5, 67.5, 67.5, 67.5, 67.5],
  suggestions: ['暂无数据，开始记录您的饮食吧']
};

function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const v = Taro.getStorageSync(key);
    if (v === '' || v === null || v === undefined) return fallback;
    return v as T;
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage(key: string, value: unknown): void {
  try {
    Taro.setStorageSync(key, value);
  } catch (e) {
    // ignore storage errors
  }
}

export const useStore = create<AppState>((set, get) => ({
  mealRecords: mockMealRecords,
  dailyRecords: mockDailyRecords,
  reminderSettings: mockReminderSettings,
  familyMembers: mockFamilyMembers,
  weeklyReport: defaultWeeklyReport,
  consecutiveDays: mockConsecutiveDays,
  currentDate: getToday(),
  familySharingEnabled: true,
  _hydrated: false,

  hydrate: () => {
    if (get()._hydrated) return;
    const saved = safeGetStorage<any>(STORAGE_KEY, null);
    if (saved && typeof saved === 'object') {
      set({
        mealRecords: Array.isArray(saved.mealRecords) ? saved.mealRecords : mockMealRecords,
        dailyRecords: Array.isArray(saved.dailyRecords) ? saved.dailyRecords : mockDailyRecords,
        reminderSettings: Array.isArray(saved.reminderSettings) ? saved.reminderSettings : mockReminderSettings,
        familyMembers: Array.isArray(saved.familyMembers) ? saved.familyMembers : mockFamilyMembers,
        consecutiveDays: typeof saved.consecutiveDays === 'number' ? saved.consecutiveDays : mockConsecutiveDays,
        familySharingEnabled: typeof saved.familySharingEnabled === 'boolean' ? saved.familySharingEnabled : true,
        _hydrated: true
      });
      console.log('[Store] Hydrated from storage');
    } else {
      set({ _hydrated: true });
    }
    setTimeout(() => get().recomputeConsecutiveDays(), 30);
  },

  persist: () => {
    const s = get();
    safeSetStorage(STORAGE_KEY, {
      mealRecords: s.mealRecords,
      dailyRecords: s.dailyRecords,
      reminderSettings: s.reminderSettings,
      familyMembers: s.familyMembers,
      consecutiveDays: s.consecutiveDays,
      familySharingEnabled: s.familySharingEnabled
    });
  },

  recomputeDailyQualified: (date) => {
    const state = get();
    const mealsOfDay = state.mealRecords.filter(m => m.date === date);
    const hasBad = mealsOfDay.some(m =>
      m.tags.includes('high-salt') || m.tags.includes('high-sugar')
    );
    const existing = state.dailyRecords.find(d => d.date === date);

    if (existing) {
      const isEmptyShell =
        mealsOfDay.length === 0 &&
        (existing.weight === null || existing.weight === undefined) &&
        (existing.waterCups === 0 || existing.waterCups === undefined) &&
        (!existing.symptoms || existing.symptoms.length === 0) &&
        !existing.symptomNote;

      if (isEmptyShell) {
        // 餐食删空 + 体重/饮水/症状也都是空 → 这条dailyRecord是多余空壳，移除
        set((s) => ({
          dailyRecords: s.dailyRecords.filter(d => d.date !== date)
        }));
      } else {
        set((s) => ({
          dailyRecords: s.dailyRecords.map(d =>
            d.date === date ? { ...d, isQualified: !hasBad } : d
          )
        }));
      }
    } else if (mealsOfDay.length > 0) {
      set((s) => ({
        dailyRecords: [
          {
            date,
            weight: null,
            waterCups: 0,
            symptoms: [],
            symptomNote: '',
            isQualified: !hasBad
          },
          ...s.dailyRecords
        ]
      }));
    }
  },

  recomputeConsecutiveDays: () => {
    const { dailyRecords, mealRecords } = get();

    // 第一步：构建"真实有记录"的达标状态
    // 真实有记录 = (有 mealRecords) OR (dailyRecord 且不是空壳)
    const dateRecordMap: Record<string, { qualified: boolean; real: boolean }> = {};

    // 1. mealRecords 提供的记录（一定是真实记录）
    mealRecords.forEach(m => {
      const hasBad = m.tags.includes('high-salt') || m.tags.includes('high-sugar');
      if (!dateRecordMap[m.date]) {
        dateRecordMap[m.date] = { qualified: true, real: true };
      }
      if (hasBad) dateRecordMap[m.date].qualified = false;
    });

    // 2. dailyRecords 提供的记录（区分空壳与否）
    dailyRecords.forEach(d => {
      const isEmptyShell =
        !mealRecords.some(m => m.date === d.date) &&
        (d.weight === null || d.weight === undefined) &&
        (d.waterCups === 0 || d.waterCups === undefined) &&
        (!d.symptoms || d.symptoms.length === 0) &&
        !d.symptomNote;

      if (isEmptyShell) return; // 空壳 dailyRecord 不算真实记录

      if (!dateRecordMap[d.date]) {
        dateRecordMap[d.date] = { qualified: d.isQualified, real: true };
      } else {
        // 已有 mealRecord 记录，合并判定（任一不达标则不达标）
        dateRecordMap[d.date].qualified =
          dateRecordMap[d.date].qualified && d.isQualified;
      }
    });

    // 第二步：从今天往前数，严格按真实记录计算连续达标
    let count = 0;
    let hasStarted = false; // 是否遇到了第一天真实记录

    for (let i = 0; i < 365; i++) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const entry = dateRecordMap[date];
      const hasRealRecord = !!entry && entry.real;

      if (!hasRealRecord) {
        // 当天没有任何真实记录
        if (!hasStarted) {
          // 还没开始 → 继续往前（今天没记第一餐时，显示 0）
          continue;
        } else {
          // 已开始但断档了 → 中断（断了几天后重新开始重新算）
          break;
        }
      }

      // 当天有真实记录
      hasStarted = true;
      if (entry.qualified) {
        count++;
      } else {
        // 不达标 → 中断
        break;
      }
    }

    set({ consecutiveDays: count });
    get().persist();
    console.log('[Store] Recomputed consecutiveDays:', count, 'hasStarted:', hasStarted);
    return count;
  },

  addMealRecord: (record) => {
    const newRecord: MealRecord = {
      ...record,
      id: generateId(),
      createdAt: `${record.date} ${new Date().toTimeString().slice(0, 5)}`
    };

    set((state) => ({
      mealRecords: [newRecord, ...state.mealRecords]
    }));

    get().recomputeDailyQualified(record.date);
    setTimeout(() => get().recomputeConsecutiveDays(), 0);
    get().persist();
    console.log('[Store] Added mealRecord:', newRecord.id, newRecord.mealType, 'tags:', newRecord.tags);
  },

  updateMealRecord: (id, updates) => {
    const existing = get().mealRecords.find(m => m.id === id);
    if (!existing) return;

    set((state) => ({
      mealRecords: state.mealRecords.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));

    // 重新计算原日期和新日期的达标状态
    if (updates.date && updates.date !== existing.date) {
      get().recomputeDailyQualified(existing.date);
      get().recomputeDailyQualified(updates.date);
    } else {
      get().recomputeDailyQualified(existing.date);
    }
    setTimeout(() => get().recomputeConsecutiveDays(), 0);
    get().persist();
    console.log('[Store] Updated mealRecord:', id, 'updates:', updates);
  },

  removeMealRecord: (id) => {
    const existing = get().mealRecords.find(m => m.id === id);
    if (!existing) return;

    set((state) => ({
      mealRecords: state.mealRecords.filter(m => m.id !== id)
    }));

    get().recomputeDailyQualified(existing.date);
    setTimeout(() => get().recomputeConsecutiveDays(), 0);
    get().persist();
    console.log('[Store] Removed mealRecord:', id, 'date:', existing.date);
  },

  updateDailyRecord: (date, updates) => set((state) => {
    const existing = state.dailyRecords.find(r => r.date === date);
    let newDailyRecords;
    if (existing) {
      newDailyRecords = state.dailyRecords.map(r =>
        r.date === date ? { ...r, ...updates } : r
      );
    } else {
      newDailyRecords = [
        {
          date,
          weight: null,
          waterCups: 0,
          symptoms: [],
          symptomNote: '',
          isQualified: true,
          ...updates
        },
        ...state.dailyRecords
      ];
    }
    setTimeout(() => {
      get().recomputeConsecutiveDays();
    }, 0);
    return { dailyRecords: newDailyRecords };
  }),

  updateReminderSetting: (index, updates) => set((state) => {
    const newSettings = state.reminderSettings.map((r, i) =>
      i === index ? { ...r, ...updates } : r
    );
    setTimeout(() => get().persist(), 0);
    return { reminderSettings: newSettings };
  }),

  toggleFamilySharing: () => set((state) => {
    setTimeout(() => get().persist(), 0);
    return { familySharingEnabled: !state.familySharingEnabled };
  }),

  addFamilyMember: (data) => set((state) => {
    const newMember: FamilyMember = {
      id: generateId(),
      name: data.name,
      relation: data.relation,
      phone: maskPhone(data.phone || '13800000000'),
      canView: data.canView !== undefined ? data.canView : true,
      canEdit: data.canEdit !== undefined ? data.canEdit : false,
      avatar: getRandomAvatarForRelation(data.relation)
    };
    setTimeout(() => get().persist(), 0);
    return { familyMembers: [...state.familyMembers, newMember] };
  }),

  removeFamilyMember: (id) => set((state) => {
    setTimeout(() => get().persist(), 0);
    return { familyMembers: state.familyMembers.filter(m => m.id !== id) };
  }),

  updateFamilyMember: (id, updates) => set((state) => {
    setTimeout(() => get().persist(), 0);
    return {
      familyMembers: state.familyMembers.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    };
  }),

  setCurrentDate: (date) => set({ currentDate: date }),

  computeWeeklyReport: (weekOffset = 0) => {
    const state = get();
    const weekDates = getWeekDates(weekOffset);
    const weekMeals = state.mealRecords.filter(r => isDateInWeek(r.date, weekOffset));
    const weekDailies = state.dailyRecords.filter(r => weekDates.includes(r.date));

    let highSaltCount = 0;
    let highSugarCount = 0;
    weekMeals.forEach(m => {
      if (m.tags.includes('high-salt')) highSaltCount++;
      if (m.tags.includes('high-sugar')) highSugarCount++;
    });

    // 达标天数：结合 dailyRecords.isQualified 和 meals 是否有不良标签
    let qualifiedDays = 0;
    weekDates.forEach(d => {
      const dr = state.dailyRecords.find(r => r.date === d);
      const mealsOfDay = weekMeals.filter(m => m.date === d);
      const hasBad = mealsOfDay.some(m =>
        m.tags.includes('high-salt') || m.tags.includes('high-sugar')
      );
      let isQual;
      if (dr) {
        isQual = dr.isQualified && !hasBad;
      } else if (mealsOfDay.length > 0) {
        isQual = !hasBad;
      } else {
        isQual = false; // 没记录的天不算达标
      }
      if (isQual) qualifiedDays++;
    });

    const weights = weekDailies.map(d => d.weight).filter((w): w is number => w !== null);
    const avgWeight = weights.length > 0
      ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
      : 67.5;

    const waters = weekDailies.map(d => d.waterCups).filter(w => w > 0);
    const avgWaterCups = waters.length > 0
      ? +(waters.reduce((a, b) => a + b, 0) / waters.length).toFixed(1)
      : 6;

    const trend: number[] = weekDates.map((d, i) => {
      const dr = state.dailyRecords.find(r => r.date === d);
      if (dr && dr.weight) return dr.weight;
      return +(avgWeight + (i - 3) * 0.1).toFixed(1);
    });

    const suggestions: string[] = [];
    if (weekMeals.length === 0) {
      suggestions.push('本周还没有饮食记录，从今天开始记录每一餐吧 🥗');
      suggestions.push('点击「饮食拍照」记录今天的第一餐，家人也能更放心');
      suggestions.push('记录得越完整，周报的健康建议越准确哦');
      suggestions.push('坚持每天记录，连续达标天数会不断累积 🏆');
    } else {
      if (highSaltCount > 2) {
        suggestions.push(`本周高盐食物出现${highSaltCount}次，建议减少腌制食品、外卖和加工肉类摄入`);
      } else {
        suggestions.push('本周盐分控制良好，继续保持清淡饮食 👍');
      }
      if (highSugarCount > 2) {
        suggestions.push(`本周高糖食物出现${highSugarCount}次，建议减少甜品、含糖饮料，可用水果替代`);
      } else {
        suggestions.push('本周糖分控制很棒，继续避免精制糖摄入 🍎');
      }
      const firstW = trend[0], lastW = trend[trend.length - 1];
      if (lastW < firstW) {
        suggestions.push(`体重本周下降 ${(firstW - lastW).toFixed(1)}kg，趋势良好，继续保持！`);
      } else if (lastW > firstW) {
        suggestions.push(`体重本周上升 ${(lastW - firstW).toFixed(1)}kg，注意饮食和运动平衡`);
      } else {
        suggestions.push('本周体重保持稳定，控制得当，继续保持！');
      }
      if (avgWaterCups < 7) {
        suggestions.push(`日均饮水 ${avgWaterCups} 杯，建议上午增加饮水量，目标每日 8 杯约 2000ml 💧`);
      } else {
        suggestions.push('本周饮水量达标，身体补水充足 ✅');
      }
    }

    return {
      weekStart: getWeekStart(dayjs().toDate(), weekOffset),
      weekEnd: getWeekEnd(dayjs().toDate(), weekOffset),
      highSaltCount,
      highSugarCount,
      qualifiedDays,
      totalDays: 7,
      avgWeight,
      avgWaterCups,
      trend,
      suggestions
    };
  },

  resetAll: () => {
    safeSetStorage(STORAGE_KEY, null);
    set({
      mealRecords: mockMealRecords,
      dailyRecords: mockDailyRecords,
      reminderSettings: mockReminderSettings,
      familyMembers: mockFamilyMembers,
      consecutiveDays: mockConsecutiveDays,
      familySharingEnabled: true
    });
    Taro.showToast({ title: '已重置', icon: 'success' });
  }
}));

// App 启动时自动从本地存储恢复
if (typeof Taro !== 'undefined') {
  setTimeout(() => useStore.getState().hydrate(), 50);
}
