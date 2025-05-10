
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | null;

export type UserStatus = 'pending_verification' | 'active' | 'rejected' | 'disabled';

export interface UserProfile extends FirebaseUser {
  role: UserRole;
  schoolId?: string;
  schoolName?: string; 
  status?: UserStatus; 
  classIds?: string[]; 
  subjects?: string[]; 
  studentAssignments?: Record<string, { status: 'submitted' | 'graded' | 'missing' | 'late'; grade?: string | number }>;
  childStudentId?: string; // For parent role to link to a student
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
  isExamModeActive?: boolean; 
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

export type ExamPeriodStatus = 'upcoming' | 'active' | 'grading' | 'completed';

export interface ExamPeriod {
  id: string;
  name: string; 
  schoolId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  assignedClassIds: string[];
  status: ExamPeriodStatus; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExamPeriodWithClassNames extends ExamPeriod {
    assignedClassNames?: string[]; // For display purposes
}


export interface ExamResult {
  id: string;
  studentId: string;
  examPeriodId: string;
  classId: string;
  schoolId: string;
  subjectId: string; 
  marks: string | number; 
  remarks?: string;
  teacherId: string; 
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExamResultWithStudentInfo extends ExamResult {
    studentName?: string;
    studentEmail?: string;
    subjectName?: string; // if subjects are fetched
}


export interface Activity {
  id: string;
  schoolId: string;
  classId?: string; 
  actorId?: string; 
  actorName?: string; 
  type:
    | 'assignment_created'
    | 'material_uploaded'
    | 'submission_received'
    | 'submission_graded'
    | 'student_joined_class'
    | 'class_created'
    | 'subject_created'
    | 'user_registered'
    | 'user_approved'
    | 'attendance_marked'
    | 'exam_period_created'
    | 'exam_results_entered'
    | 'exam_period_finalized'; // New type
  message: string; 
  link?: string; 
  timestamp: Timestamp;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  date: Timestamp; 
  status: AttendanceStatus;
  markedBy: string; 
  createdAt: Timestamp;
}
