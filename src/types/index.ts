
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
  subjects?: string[]; // Array of subject IDs
  studentAssignments?: Record<string, { status: 'submitted' | 'graded' | 'missing' | 'late'; grade?: string | number }>;
  childStudentId?: string; // For parent role to link to a student
  onboardingStep?: number | null; // 0 to 5, null when completed
  lastTestimonialSurveyAt?: Timestamp; 
}

export interface UserProfileWithId extends UserProfile {
  id: string;
}

export interface School {
  id:string;
  name: string;
  adminId: string; // The admin who created/manages the school
  inviteCode: string;
  schoolType?: string; // e.g., Primary, Secondary, K-12
  country?: string;
  phoneNumber?: string;
  setupComplete?: boolean; // True once onboarding is finished
  isExamModeActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Subject {
  id: string;
  name: string;
  schoolId: string;
  isCompulsory?: boolean; // Added for onboarding
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type LearningMaterialType = 'text' | 'link' | 'video_link' | 'pdf_link' | 'pdf_upload';

export interface LearningMaterial {
  id: string;
  title: string;
  content: string;
  materialType: LearningMaterialType;
  schoolId: string;
  teacherId: string;
  classId?: string | null;
  subjectId?: string | null;
  attachmentUrl?: string | null;
  originalFileName?: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface LearningMaterialWithTeacherInfo extends LearningMaterial {
  teacherDisplayName?: string;
  className?: string;
  subjectName?: string;
}

export type ClassType = 'main' | 'subject_based';

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  teacherId?: string; // Optional teacher ID
  studentIds?: string[];
  classInviteCode?: string;
  classType: ClassType;
  compulsorySubjectIds?: string[]; // For main classes
  subjectId?: string | null; // For subject-based classes
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClassWithTeacherInfo extends Class {
  teacherDisplayName?: string;
  submittedAssignmentsCount?: number;
  totalAssignmentsCount?: number;
  compulsorySubjectNames?: string[];
  subjectName?: string;
}

export type SubmissionFormat = 'text_entry' | 'file_link' | 'file_upload';

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  schoolId: string;
  title: string;
  description: string;
  deadline: Timestamp;
  allowedSubmissionFormats: SubmissionFormat[];
  subjectId?: string | null;
  attachmentUrl?: string | null;
  originalFileName?: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  totalSubmissions?: number;
  status?: 'submitted' | 'graded' | 'missing' | 'late';
}

export interface AssignmentWithClassInfo extends Assignment {
  className?: string;
  subjectName?: string;
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
  originalFileName?: string;
  grade?: string | number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
  updatedAt?: Timestamp; 
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
    assignedClassNames?: string[];
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
  updatedAt: Timestamp;
}

export interface ExamResultWithStudentInfo extends ExamResult {
    studentName?: string;
    studentEmail?: string;
    subjectName?: string;
    examPeriodName?: string;
}


export interface Activity {
  id: string;
  schoolId: string;
  classId?: string;
  actorId?: string;
  actorName?: string;
  targetUserId?: string;
  targetUserName?: string;
  type:
    | 'assignment_created'
    | 'assignment_updated'
    | 'assignment_deleted'
    | 'material_uploaded'
    | 'material_updated'
    | 'material_deleted'
    | 'submission_received'
    | 'submission_graded'
    | 'student_joined_class'
    | 'student_removed_from_class'
    | 'student_onboarded'
    | 'class_created'
    | 'class_updated'
    | 'class_deleted'
    | 'subject_created'
    | 'subject_updated'
    | 'subject_deleted'
    | 'user_registered'
    | 'user_approved'
    | 'user_rejected'
    | 'user_profile_updated'
    | 'attendance_marked'
    | 'exam_period_created'
    | 'exam_period_updated'
    | 'exam_period_finalized'
    | 'exam_results_entered'
    | 'school_settings_updated'
    | 'school_onboarding_step'
    | 'invite_code_regenerated'
    | 'parent_linked_child'
    | 'testimonial_submitted' 
    | 'general_announcement';
  message: string;
  link?: string;
  timestamp: Timestamp;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string; 
  studentId: string;
  studentName?: string; 
  classId: string;
  className?: string; 
  schoolId: string;
  date: Timestamp; 
  status: AttendanceStatus;
  markedBy: string; 
  markedByName?: string; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  schoolId: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Timestamp;
  type: Activity['type'] | 'general_announcement' | 'system_update';
  actorName?: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  schoolId?: string; 
  schoolName?: string; 
  rating: number; 
  feedbackText: string;
  isApprovedForDisplay: boolean;
  submittedAt: Timestamp;
}

// For Onboarding
export interface OnboardingSchoolData {
  schoolName: string;
  schoolType: string;
  country: string;
  phoneNumber: string;
}

export interface OnboardingSubjectData {
  name: string;
  isCompulsory?: boolean;
}

export interface OnboardingClassData {
  name: string;
  type: ClassType;
  subjectId?: string;
  compulsorySubjectIds?: string[];
  // classTeacherId removed
}

export interface OnboardingInvitedUserData {
  email: string;
  displayName: string;
  role: 'teacher' | 'student';
}

