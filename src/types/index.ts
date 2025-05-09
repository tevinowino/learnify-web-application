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

export type LearningMaterialType = 'text' | 'link' | 'video_link' | 'pdf_link';

export interface LearningMaterial {
  id: string;
  title: string;
  content: string; // Text content or URL for link types
  materialType: LearningMaterialType;
  schoolId: string;
  teacherId: string; // UID of the teacher who uploaded it
  classId?: string; // Optional: if material is specific to a class
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface LearningMaterialWithTeacherInfo extends LearningMaterial {
  teacherDisplayName?: string;
  className?: string;
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

export type SubmissionFormat = 'text_entry' | 'file_link';

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  deadline: Timestamp;
  allowedSubmissionFormats: SubmissionFormat[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  totalSubmissions?: number; // Denormalized count
}

export interface AssignmentWithClassInfo extends Assignment {
  className?: string;
}


export interface Submission {
  id: string;
  assignmentId: string;
  classId: string;
  studentId: string;
  submittedAt: Timestamp;
  content: string; // Text for text_entry, URL for file_link
  submissionType: SubmissionFormat;
  grade?: string | number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late'; // 'late' could be determined at view time
}

export interface SubmissionWithStudentName extends Submission {
  studentDisplayName?: string;
  studentEmail?: string;
}

export interface ClassStudentProgress { // Basic structure for progress tracking
  studentId: string;
  studentName: string;
  completedAssignments: number;
  overallGrade?: string; // Or more detailed metrics
}
