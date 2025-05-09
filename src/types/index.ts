import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

export interface UserProfile extends FirebaseUser {
  role: UserRole;
  schoolId?: string;
  classIds?: string[]; // For students, classes they are enrolled in
}

// Useful for when fetching users from collection and needing their Firestore document ID
export interface UserProfileWithId extends UserProfile {
  id: string;
}

export interface School {
  id:string;
  name: string;
  adminId: string; // UID of the admin who created the school
  inviteCode: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LearningMaterial {
  id: string;
  title: string;
  content: string; // Could be text, markdown, or a URL to a resource
  schoolId: string;
  teacherId: string; // UID of the teacher who uploaded it
  classId?: string; // Optional: if material is specific to a class
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface LearningMaterialWithTeacherInfo extends LearningMaterial {
  teacherDisplayName?: string;
}


export interface Class {
  id: string;
  name: string;
  schoolId: string;
  teacherId?: string; // UID of the assigned teacher
  studentIds?: string[]; // Array of student UIDs enrolled in the class
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClassWithTeacherInfo extends Class {
  teacherDisplayName?: string;
}
