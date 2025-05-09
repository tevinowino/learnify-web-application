import type { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

export interface UserProfile extends FirebaseUser {
  role: UserRole;
  schoolId?: string;
  // Add other profile fields as needed
}

export interface School {
  id: string;
  name: string;
  adminId: string;
  inviteCode: string;
}
