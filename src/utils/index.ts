import dayjs from 'dayjs';
import type { MealType, FoodTagType, SymptomType } from '@/types';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
};

export const FOOD_TAGS: { key: FoodTagType; label: string; bgColor: string; textColor: string }[] = [
  { key: 'high-salt', label: '高盐', bgColor: '#FEE2E2', textColor: '#DC2626' },
  { key: 'high-sugar', label: '高糖', bgColor: '#FEF3C7', textColor: '#D97706' },
  { key: 'light', label: '清淡', bgColor: '#D1FAE5', textColor: '#059669' },
  { key: 'protein', label: '高蛋白', bgColor: '#DBEAFE', textColor: '#2563EB' },
  { key: 'low-fat', label: '低脂', bgColor: '#E0E7FF', textColor: '#4F46E5' },
  { key: 'high-fiber', label: '高纤维', bgColor: '#FCE7F3', textColor: '#DB2777' }
];

export const SYMPTOM_LIST: { key: SymptomType; label: string }[] = [
  { key: 'dizziness', label: '头晕' },
  { key: 'chest-pain', label: '胸闷' },
  { key: 'blood-sugar', label: '血糖异常' },
  { key: 'fatigue', label: '乏力' },
  { key: 'nausea', label: '恶心' },
  { key: 'other', label: '其他' }
];

export const RELATION_LIST = ['父亲', '母亲', '配偶', '子女', '兄弟姐妹', '其他'];

export const formatDate = (date: Date | string = new Date(), format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: Date | string = new Date()): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const getToday = (): string => formatDate();

export const getWeekStart = (date: Date | string = new Date()): string => {
  return dayjs(date).startOf('week').format('YYYY-MM-DD');
};

export const getWeekEnd = (date: Date | string = new Date()): string => {
  return dayjs(date).endOf('week').format('YYYY-MM-DD');
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getTagStyle = (key: FoodTagType): { bgColor: string; textColor: string } => {
  const tag = FOOD_TAGS.find(t => t.key === key);
  return tag ? { bgColor: tag.bgColor, textColor: tag.textColor } : { bgColor: '#F3F4F6', textColor: '#6B7280' };
};

export const getDateList = (days: number): string[] => {
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    list.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return list;
};
