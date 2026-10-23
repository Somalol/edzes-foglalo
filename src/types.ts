export type AgeRange = '-18' | '18-25' | '26-35' | '36-50' | '50+';

export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string;
  ageRange: AgeRange;
  role: UserRole;
}

export interface Participant {
  id: string;
  name: string;
  ageRange: AgeRange;
  isGuest: boolean;
  userId?: string;
}

export type WorkoutType = 'alakformalo' | 'pilates' | 'nyujtas' | 'kardio';

export interface WorkoutEvent {
  id: string;
  title: string;
  baseTitle: string;
  description: string;
  type: WorkoutType;
  start: Date;
  end: Date;
  color: string;
  maxCapacity: number;
  participants: Participant[];
}

export interface BlogComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  comments: BlogComment[];
}


export const WORKOUT_TYPES: Record<WorkoutType, { label: string; color: string }> = {
  alakformalo: { label: 'Alakformáló', color: '#D88C9A' },
  pilates: { label: 'Pilates & Core', color: '#8FA893' },
  nyujtas: { label: 'Nyújtás & Mobilitás', color: '#9D8EC4' },
  kardio: { label: 'Köredzés / Kardió', color: '#D9A07E' },
};