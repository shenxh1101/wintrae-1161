export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodTagType = 'high-salt' | 'high-sugar' | 'light' | 'protein' | 'low-fat' | 'high-fiber';

export type SymptomType = 'dizziness' | 'chest-pain' | 'blood-sugar' | 'fatigue' | 'nausea' | 'other';

export interface FoodTag {
  key: FoodTagType;
  label: string;
  color: string;
}

export interface MealRecord {
  id: string;
  date: string;
  mealType: MealType;
  imageUrl: string;
  tags: FoodTagType[];
  note: string;
  createdAt: string;
}

export interface DailyRecord {
  date: string;
  weight: number | null;
  waterCups: number;
  symptoms: SymptomType[];
  symptomNote: string;
  isQualified: boolean;
}

export interface SymptomItem {
  key: SymptomType;
  label: string;
}

export interface ReminderSetting {
  enabled: boolean;
  time: string;
  label: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  canView: boolean;
  canEdit: boolean;
  avatar: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  highSaltCount: number;
  highSugarCount: number;
  qualifiedDays: number;
  totalDays: number;
  avgWeight: number;
  avgWaterCups: number;
  trend: number[];
  suggestions: string[];
}
