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

export type WorkoutType = 'dinamikus' | 'progressziv' | 'gerinc' | 'tini';

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
  dinamikus: { label: 'Dinamikus Pilates', color: '#D88C9A' },
  progressziv: { label: 'Progresszív Pilates', color: '#8FA893' },
  gerinc: { label: 'Gerinc Pilates', color: '#9D8EC4' },
  tini: { label: 'Tini Pilates', color: '#D9A07E' },
};