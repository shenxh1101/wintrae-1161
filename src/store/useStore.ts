import { create } from 'zustand';
import type { MealRecord, DailyRecord, ReminderSetting, FamilyMember, WeeklyReport } from '@/types';
import {
  mockMealRecords,
  mockDailyRecords,
  mockReminderSettings,
  mockFamilyMembers,
  mockWeeklyReport,
  mockConsecutiveDays
} from '@/data/mockData';
import {
  generateId,
  getToday,
  getWeekDates,
  getWeekStart,
  getWeekEnd,
  isDateInWeek,
  formatDate,
  maskPhone,
  getRandomAvatarForRelation
} from '@/utils';
import dayjs from 'dayjs';

interface AppState {
  mealRecords: MealRecord[];
  dailyRecords: DailyRecord[];
  reminderSettings: ReminderSetting[];
  familyMembers: FamilyMember[];
  weeklyReport: WeeklyReport;
  consecutiveDays: number;
  currentDate: string;
  familySharingEnabled: boolean;

  addMealRecord: (record: Omit<MealRecord, 'id' | 'createdAt'>) => void;
  updateDailyRecord: (date: string, updates: Partial<DailyRecord>) => void;
  updateReminderSetting: (index: number, updates: Partial<ReminderSetting>) => void;

  toggleFamilySharing: () => void;
  addFamilyMember: (data: { name: string; relation: string; phone: string; canView?: boolean; canEdit?: boolean }) => void;
  removeFamilyMember: (id: string) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;

  setCurrentDate: (date: string) => void;
  computeWeeklyReport: (weekOffset?: number) => WeeklyReport;
  computeConsecutiveDays: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  mealRecords: mockMealRecords,
  dailyRecords: mockDailyRecords,
  reminderSettings: mockReminderSettings,
  familyMembers: mockFamilyMembers,
  weeklyReport: mockWeeklyReport,
  consecutiveDays: mockConsecutiveDays,
  currentDate: getToday(),
  familySharingEnabled: true,

  addMealRecord: (record) => set((state) => {
    const newRecord: MealRecord = {
      ...record,
      id: generateId(),
      createdAt: `${record.date} ${new Date().toTimeString().slice(0, 5)}`
    };

    const dateRecord = state.dailyRecords.find(d => d.date === record.date);
    const hasBadTag = record.tags.includes('high-salt') || record.tags.includes('high-sugar');
    let newConsecutive = state.consecutiveDays;

    if (dateRecord) {
      const allRecords = [...state.mealRecords, newRecord].filter(r => r.date === record.date);
      const stillQualified = !allRecords.some(r =>
        r.tags.includes('high-salt') || r.tags.includes('high-sugar')
      );

      const updatedDaily = state.dailyRecords.map(r =>
        r.date === record.date
          ? { ...r, isQualified: stillQualified }
          : r
      );

      const today = getToday();
      if (record.date === today) {
        const sorted = [...updatedDaily].sort((a, b) => b.date.localeCompare(a.date));
        let count = 0;
        for (let i = 0; i < sorted.length; i++) {
          const expectedDate = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
          if (sorted[i].date === expectedDate && sorted[i].isQualified) {
            count++;
          } else {
            break;
          }
        }
        newConsecutive = count > 0 ? count : newConsecutive;
      }

      return {
        mealRecords: [newRecord, ...state.mealRecords],
        dailyRecords: updatedDaily,
        consecutiveDays: newConsecutive
      };
    }

    return {
      mealRecords: [newRecord, ...state.mealRecords],
      dailyRecords: [
        {
          date: record.date,
          weight: null,
          waterCups: 0,
          symptoms: [],
          symptomNote: '',
          isQualified: !hasBadTag
        },
        ...state.dailyRecords
      ]
    };
  }),

  updateDailyRecord: (date, updates) => set((state) => {
    const existing = state.dailyRecords.find(r => r.date === date);
    if (existing) {
      return {
        dailyRecords: state.dailyRecords.map(r =>
          r.date === date ? { ...r, ...updates } : r
        )
      };
    }
    return {
      dailyRecords: [
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
      ]
    };
  }),

  updateReminderSetting: (index, updates) => set((state) => ({
    reminderSettings: state.reminderSettings.map((r, i) =>
      i === index ? { ...r, ...updates } : r
    )
  })),

  toggleFamilySharing: () => set((state) => ({
    familySharingEnabled: !state.familySharingEnabled
  })),

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
    return {
      familyMembers: [...state.familyMembers, newMember]
    };
  }),

  removeFamilyMember: (id) => set((state) => ({
    familyMembers: state.familyMembers.filter(m => m.id !== id)
  })),

  updateFamilyMember: (id, updates) => set((state) => ({
    familyMembers: state.familyMembers.map(m =>
      m.id === id ? { ...m, ...updates } : m
    )
  })),

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

    let qualifiedDays = 0;
    weekDates.forEach(d => {
      const dr = state.dailyRecords.find(r => r.date === d);
      const mealsOfDay = weekMeals.filter(m => m.date === d);
      const hasMealsBad = mealsOfDay.some(m =>
        m.tags.includes('high-salt') || m.tags.includes('high-sugar')
      );
      if ((dr && dr.isQualified) || (!dr && !hasMealsBad && mealsOfDay.length > 0)) {
        qualifiedDays++;
      }
    });

    const weights = weekDailies.map(d => d.weight).filter((w): w is number => w !== null);
    const avgWeight = weights.length > 0
      ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
      : 67.5;

    const waters = weekDailies.map(d => d.waterCups).filter(w => w > 0);
    const avgWaterCups = waters.length > 0
      ? +(waters.reduce((a, b) => a + b, 0) / waters.length).toFixed(1)
      : 6;

    const trend: number[] = weekDates.map(d => {
      const dr = state.dailyRecords.find(r => r.date === d);
      if (dr && dr.weight) return dr.weight;
      const idx = weekDates.indexOf(d);
      return avgWeight + (idx - 3) * 0.1;
    }).map(v => +v.toFixed(1));

    const suggestions: string[] = [];
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

  computeConsecutiveDays: () => {
    const state = get();
    const sorted = [...state.dailyRecords].sort((a, b) => b.date.localeCompare(a.date));
    const today = getToday();
    let count = 0;
    for (let i = 0; i < sorted.length; i++) {
      const expectedDate = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      if (sorted[i].date === expectedDate && sorted[i].isQualified) {
        count++;
      } else if (sorted[i].date === today && sorted[i].isQualified) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}));
