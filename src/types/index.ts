import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

export interface UserProfile extends FirebaseUser {
  role: UserRole;
  schoolId?: string;
  // Add other profile fields as needed
}

// Useful for when fetching users from collection and needing their Firestore document ID
export interface UserProfileWithId extends UserProfile {
  id: string;
}

export interface School {
  id:string;
  name: string;
  adminId: string;
  inviteCode: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  content: string; // Could be text, markdown, or a URL to a resource
  schoolId: string;
  teacherId: string; // UID of the teacher who uploaded it
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // contentType: 'text' | 'url' | 'file_ref'; // Optional: to specify content type
  // subject?: string; // Optional: for categorization
}
