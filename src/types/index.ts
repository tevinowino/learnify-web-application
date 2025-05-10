
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

export type UserStatus = 'pending_verification' | 'active' | 'rejected' | 'disabled';

export interface UserProfile extends FirebaseUser {
  role: UserRole;
  schoolId?: string;
  schoolName?: string; 
  status?: UserStatus; 
  classIds?: string[]; 
  subjects?: string[]; // New: Student's chosen subjects
  studentAssignments?: Record<string, { status: 'submitted' | 'graded' | 'missing'; grade?: string | number }>; 
}

export interface UserProfileWithId extends UserProfile {
  id: string;
}

export interface School {
  id:string;
  name: string;
  adminId: string; 
  inviteCode: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Subjects might be stored as a subcollection or directly on the school doc if simple list
  // For now, assuming a separate 'subjects' collection linked by schoolId
}

export interface Subject {
  id: string;
  name: string;
  schoolId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type LearningMaterialType = 'text' | 'link' | 'video_link' | 'pdf_link';

export interface LearningMaterial {
  id: string;
  title: string;
  content: string; 
  materialType: LearningMaterialType;
  schoolId: string;
  teacherId: string; 
  classId?: string; 
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
  teacherId?: string; 
  studentIds?: string[]; 
  classInviteCode?: string; 
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClassWithTeacherInfo extends Class {
  teacherDisplayName?: string;
  submittedAssignmentsCount?: number; 
  totalAssignmentsCount?: number;     
}

export type SubmissionFormat = 'text_entry' | 'file_link';

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  schoolId: string; 
  title: string;
  description: string;
  deadline: Timestamp;
  allowedSubmissionFormats: SubmissionFormat[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  totalSubmissions?: number; 
  status?: 'submitted' | 'graded' | 'missing' | 'late'; 
}

export interface AssignmentWithClassInfo extends Assignment {
  className?: string;
}

export interface AssignmentWithClassAndSubmissionInfo extends AssignmentWithClassInfo {
  submissionStatus?: 'submitted' | 'graded' | 'missing' | 'late';
  submissionGrade?: string | number;
}


export interface Submission {
  id: string;
  assignmentId: string;
  classId: string;
  studentId: string;
  submittedAt: Timestamp;
  content: string; 
  submissionType: SubmissionFormat;
  grade?: string | number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late'; 
}

export interface SubmissionWithStudentName extends Submission {
  studentDisplayName?: string;
  studentEmail?: string;
}

export interface ClassStudentProgress { 
  studentId: string;
  studentName: string;
  completedAssignments: number;
  overallGrade?: string; 
}

export interface Activity {
  id: string;
  schoolId: string;
  classId?: string; // Optional: if activity is class-specific
  actorId?: string; // UID of user who performed the action
  actorName?: string; // Display name of actor
  type:
    | 'assignment_created'
    | 'material_uploaded'
    | 'submission_received'
    | 'submission_graded'
    | 'student_joined_class'
    | 'class_created'
    | 'subject_created'
    | 'user_registered'
    | 'user_approved';
  message: string; // e.g., "New assignment 'Math Homework 1' posted for Algebra 1 by Mr. Smith."
  link?: string; // Optional link to the relevant item, e.g., /teacher/assignments/[assignmentId]
  timestamp: Timestamp;
}

