import dayjs from 'dayjs';
import type { MealType, FoodTagType, SymptomType } from '@/types';

export const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
};

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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

export const RELATION_AVATAR_MAP: Record<string, number[]> = {
  '父亲': [338, 331, 349],
  '母亲': [1027, 1062, 1059],
  '配偶': [64, 1074, 1027],
  '子女': [91, 177, 22],
  '兄弟姐妹': [22, 156, 237],
  '其他': [338, 1027, 64]
};

export const formatDate = (date: Date | string = new Date(), format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateCN = (date: Date | string = new Date()): string => {
  return dayjs(date).format('MM月DD日');
};

export const formatWeekdayCN = (date: Date | string = new Date()): string => {
  const idx = dayjs(date).day();
  return WEEKDAY_CN[idx];
};

export const formatFullDateCN = (date: Date | string = new Date()): string => {
  return `${formatDateCN(date)} ${formatWeekdayCN(date)}`;
};

export const formatDateTime = (date: Date | string = new Date()): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatTime = (date: Date | string = new Date()): string => {
  return dayjs(date).format('HH:mm');
};

export const getToday = (): string => formatDate();

export const getWeekStart = (date: Date | string = new Date(), weekOffset = 0): string => {
  return dayjs(date).add(weekOffset, 'week').startOf('week').format('YYYY-MM-DD');
};

export const getWeekEnd = (date: Date | string = new Date(), weekOffset = 0): string => {
  return dayjs(date).add(weekOffset, 'week').endOf('week').format('YYYY-MM-DD');
};

export const getWeekDates = (weekOffset = 0): string[] => {
  const start = dayjs().add(weekOffset, 'week').startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
};

export const isDateInWeek = (date: string, weekOffset = 0): boolean => {
  const d = dayjs(date);
  const start = dayjs().add(weekOffset, 'week').startOf('week');
  const end = dayjs().add(weekOffset, 'week').endOf('week');
  return d.isSame(start) || d.isSame(end) || (d.isAfter(start) && d.isBefore(end));
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

export const maskPhone = (phone: string): string => {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const getRandomAvatarForRelation = (relation: string): string => {
  const ids = RELATION_AVATAR_MAP[relation] || RELATION_AVATAR_MAP['其他'];
  const id = ids[Math.floor(Math.random() * ids.length)];
  return `https://picsum.photos/id/${id}/200/200`;
};

export const isValidTime = (time: string): boolean => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

export const addMinutes = (timeStr: string, minutes: number): string => {
  const [h, m] = timeStr.split(':').map(Number);
  let totalMin = h * 60 + m + minutes;
  while (totalMin < 0) totalMin += 24 * 60;
  totalMin = totalMin % (24 * 60);
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};
