import type { MealRecord, DailyRecord, ReminderSetting, FamilyMember, WeeklyReport } from '@/types';
import { getDateList, formatDate, getWeekStart, getWeekEnd, generateId } from '@/utils';

const FOOD_IMAGE_IDS = [292, 312, 326, 401, 431, 570, 580, 625, 835, 1080];

export const mockMealRecords: MealRecord[] = [
  {
    id: generateId(),
    date: formatDate(),
    mealType: 'breakfast',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[0]}/400/400`,
    tags: ['light', 'protein'],
    note: '蒸蛋 + 燕麦粥，清淡可口',
    createdAt: `${formatDate()} 07:30`
  },
  {
    id: generateId(),
    date: formatDate(),
    mealType: 'lunch',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[1]}/400/400`,
    tags: ['high-fiber', 'low-fat'],
    note: '糙米饭 + 清炒时蔬',
    createdAt: `${formatDate()} 12:15`
  },
  {
    id: generateId(),
    date: formatDate(),
    mealType: 'dinner',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[2]}/400/400`,
    tags: ['light'],
    note: '蔬菜汤 + 全麦面包',
    createdAt: `${formatDate()} 18:30`
  },
  {
    id: generateId(),
    date: formatDate(new Date(Date.now() - 86400000)),
    mealType: 'breakfast',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[3]}/400/400`,
    tags: ['high-sugar'],
    note: '豆浆油条，偶尔解馋',
    createdAt: `${formatDate(new Date(Date.now() - 86400000))} 08:00`
  },
  {
    id: generateId(),
    date: formatDate(new Date(Date.now() - 86400000)),
    mealType: 'lunch',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[4]}/400/400`,
    tags: ['high-salt', 'protein'],
    note: '外卖快餐，注意控制',
    createdAt: `${formatDate(new Date(Date.now() - 86400000))} 12:30`
  },
  {
    id: generateId(),
    date: formatDate(new Date(Date.now() - 86400000 * 2)),
    mealType: 'breakfast',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[5]}/400/400`,
    tags: ['light', 'high-fiber'],
    note: '杂粮粥 + 水煮蛋',
    createdAt: `${formatDate(new Date(Date.now() - 86400000 * 2))} 07:45`
  },
  {
    id: generateId(),
    date: formatDate(new Date(Date.now() - 86400000 * 2)),
    mealType: 'snack',
    imageUrl: `https://picsum.photos/id/${FOOD_IMAGE_IDS[6]}/400/400`,
    tags: ['high-fiber', 'low-fat'],
    note: '下午水果：苹果一个',
    createdAt: `${formatDate(new Date(Date.now() - 86400000 * 2))} 15:00`
  }
];

export const mockDailyRecords: DailyRecord[] = getDateList(14).map((date, index) => {
  const waterBase = [5, 6, 7, 6, 8, 5, 7, 6, 7, 8, 6, 5, 7, 6];
  const weightBase = [68.5, 68.3, 68.4, 68.2, 68.0, 68.1, 67.9, 67.8, 68.0, 67.7, 67.6, 67.8, 67.5, 67.4];
  const qualList = [true, true, false, true, true, true, false, true, true, true, true, false, true, true];
  const symptomMap: Record<number, DailyRecord['symptoms']> = {
    3: ['dizziness'],
    6: ['blood-sugar'],
    11: ['fatigue']
  };
  return {
    date,
    weight: weightBase[index],
    waterCups: waterBase[index],
    symptoms: symptomMap[index] || [],
    symptomNote: symptomMap[index] ? '轻度不适，已自行缓解' : '',
    isQualified: qualList[index]
  };
});

export const mockReminderSettings: ReminderSetting[] = [
  { enabled: true, time: '07:30', label: '早餐提醒' },
  { enabled: true, time: '12:00', label: '午餐提醒' },
  { enabled: true, time: '18:30', label: '晚餐提醒' },
  { enabled: true, time: '09:00', label: '饮水提醒' },
  { enabled: false, time: '15:00', label: '加餐提醒' },
  { enabled: false, time: '21:00', label: '体重记录提醒' }
];

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: generateId(),
    name: '张阿姨',
    relation: '配偶',
    phone: '138****5678',
    canView: true,
    canEdit: false,
    avatar: `https://picsum.photos/id/64/200/200`
  },
  {
    id: generateId(),
    name: '李明',
    relation: '子女',
    phone: '139****1234',
    canView: true,
    canEdit: true,
    avatar: `https://picsum.photos/id/91/200/200`
  }
];

export const mockWeeklyReport: WeeklyReport = {
  weekStart: getWeekStart(),
  weekEnd: getWeekEnd(),
  highSaltCount: 3,
  highSugarCount: 2,
  qualifiedDays: 5,
  totalDays: 7,
  avgWeight: 67.6,
  avgWaterCups: 6.4,
  trend: [68.5, 68.3, 68.4, 68.2, 68.0, 68.1, 67.9],
  suggestions: [
    '本周高盐食物出现3次，建议减少腌制食品和外卖摄入',
    '饮水达标率71%，建议上午增加饮水量，保持每日8杯',
    '体重呈缓慢下降趋势，保持良好！继续坚持',
    '建议增加高纤维蔬菜摄入，如芹菜、西兰花等'
  ]
};

export const mockConsecutiveDays = 12;
