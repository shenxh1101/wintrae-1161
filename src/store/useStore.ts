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
import { generateId, getToday } from '@/utils';

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
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  setCurrentDate: (date: string) => void;
}

export const useStore = create<AppState>((set) => ({
  mealRecords: mockMealRecords,
  dailyRecords: mockDailyRecords,
  reminderSettings: mockReminderSettings,
  familyMembers: mockFamilyMembers,
  weeklyReport: mockWeeklyReport,
  consecutiveDays: mockConsecutiveDays,
  currentDate: getToday(),
  familySharingEnabled: true,

  addMealRecord: (record) => set((state) => ({
    mealRecords: [
      {
        ...record,
        id: generateId(),
        createdAt: `${record.date} ${new Date().toTimeString().slice(0, 5)}`
      },
      ...state.mealRecords
    ]
  })),

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

  updateFamilyMember: (id, updates) => set((state) => ({
    familyMembers: state.familyMembers.map(m =>
      m.id === id ? { ...m, ...updates } : m
    )
  })),

  setCurrentDate: (date) => set({ currentDate: date })
}));
