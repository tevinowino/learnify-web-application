import type { User as FirebaseUserType } from 'firebase/auth';
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { z } from 'zod';
import type {
  UserProfileSchema,
  UserRoleSchema,
  UserStatusSchema,
  UserProfileWithIdSchema,
  SchoolSchema,
  OnboardingSchoolDataSchema,
  SubjectSchema,
  OnboardingSubjectDataSchema,
  ClassSchema,
  ClassTypeSchema,
  OnboardingClassDataSchema,
  LearningMaterialSchema,
  LearningMaterialTypeSchema,
  AssignmentSchema,
  SubmissionFormatSchema,
  SubmissionSchema,
  SubmissionStatusSchema,
  ExamPeriodSchema,
  ExamPeriodStatusSchema,
  ExamResultSchema,
  ActivitySchema,
  ActivityTypeSchema,
  AttendanceRecordSchema,
  AttendanceStatusSchema,
  NotificationSchema,
  TestimonialSchema,
  OnboardingInvitedUserDataSchema,
  AnalyzeStudentPerformanceInputSchema,
  AnalyzeStudentPerformanceOutputSchema,
  AkiliChatInputSchema,
  AkiliChatOutputSchema,
  MwalimuChatInputSchema,
  MwalimuChatOutputSchema,
  GenerateLearningPathInputSchema,
  GenerateLearningPathOutputSchema,
  SummarizeLearningMaterialInputSchema,
  SummarizeLearningMaterialOutputSchema,
  ReportCardAnalysisInputSchema, // Added
  ReportCardAnalysisOutputSchema, // Added
} from './schemas';


// Re-export Timestamp for convenience if needed elsewhere, though schemas handle it
export type Timestamp = FirestoreTimestamp;

// Base User Types
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;

// We combine FirebaseUser with our Firestore profile data for the currentUser object
export type UserProfile = Omit<FirebaseUserType, 'photoURL' | 'emailVerified' | 'displayName' | 'email'> & z.infer<typeof UserProfileSchema>;
export type UserProfileWithId = z.infer<typeof UserProfileWithIdSchema>;

// School
export type School = z.infer<typeof SchoolSchema>;
export type OnboardingSchoolData = z.infer<typeof OnboardingSchoolDataSchema>;


// Subject
export type Subject = z.infer<typeof SubjectSchema>;
export type OnboardingSubjectData = z.infer<typeof OnboardingSubjectDataSchema>;


// Class
export type ClassType = z.infer<typeof ClassTypeSchema>;
export type Class = z.infer<typeof ClassSchema>;
export interface ClassWithTeacherInfo extends Class { // Keep interface for now if it has methods or complex derived types
  teacherDisplayName?: string;
  submittedAssignmentsCount?: number;
  totalAssignmentsCount?: number;
  compulsorySubjectNames?: string[];
  subjectName?: string;
}
export type OnboardingClassData = z.infer<typeof OnboardingClassDataSchema>;

// Learning Material
export type LearningMaterialType = z.infer<typeof LearningMaterialTypeSchema>;
export type LearningMaterial = z.infer<typeof LearningMaterialSchema>;
export interface LearningMaterialWithTeacherInfo extends LearningMaterial { // Keep interface
  teacherDisplayName?: string;
  className?: string;
  subjectName?: string;
}

// Assignment
export type SubmissionFormat = z.infer<typeof SubmissionFormatSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export interface AssignmentWithClassInfo extends Assignment { // Keep interface
  className?: string;
  subjectName?: string;
}
export interface AssignmentWithClassAndSubmissionInfo extends AssignmentWithClassInfo { // Keep interface
  submissionStatus?: 'submitted' | 'graded' | 'missing' | 'late'; // Derived, not directly in AssignmentSchema
  submissionGrade?: string | number; // Derived
}

// Submission
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export interface SubmissionWithStudentName extends Submission { // Keep interface
  studentDisplayName?: string;
  studentEmail?: string;
}

// Exam Period
export type ExamPeriodStatus = z.infer<typeof ExamPeriodStatusSchema>;
export type ExamPeriod = z.infer<typeof ExamPeriodSchema>;
export interface ExamPeriodWithClassNames extends ExamPeriod { // Keep interface
    assignedClassNames?: string[];
}

// Exam Result
export type ExamResult = z.infer<typeof ExamResultSchema>;
export interface ExamResultWithStudentInfo extends ExamResult { // Keep interface
    studentName?: string;
    studentEmail?: string;
    subjectName?: string; // Now derived and added
    examPeriodName?: string; // Now derived and added
}

// Activity
export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type Activity = z.infer<typeof ActivitySchema>;

// Attendance
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

// Notification
export type Notification = z.infer<typeof NotificationSchema>;

// Testimonial
export type Testimonial = z.infer<typeof TestimonialSchema>;
export type OnboardingInvitedUserData = z.infer<typeof OnboardingInvitedUserDataSchema>;


// AI Flow Types (inferred from schemas)
export type AnalyzeStudentPerformanceInput = z.infer<typeof AnalyzeStudentPerformanceInputSchema>;
export type AnalyzeStudentPerformanceOutput = z.infer<typeof AnalyzeStudentPerformanceOutputSchema>;
export type AkiliChatInput = z.infer<typeof AkiliChatInputSchema>;
export type AkiliChatOutput = z.infer<typeof AkiliChatOutputSchema>;
export type MwalimuChatInput = z.infer<typeof MwalimuChatInputSchema>;
export type MwalimuChatOutput = z.infer<typeof MwalimuChatOutputSchema>;
export type GenerateLearningPathInput = z.infer<typeof GenerateLearningPathInputSchema>;
export type GenerateLearningPathOutput = z.infer<typeof GenerateLearningPathOutputSchema>;
export type SummarizeLearningMaterialInput = z.infer<typeof SummarizeLearningMaterialInputSchema>;
export type SummarizeLearningMaterialOutput = z.infer<typeof SummarizeLearningMaterialOutputSchema>;
export type ReportCardAnalysisInput = z.infer<typeof ReportCardAnalysisInputSchema>;
export type ReportCardAnalysisOutput = z.infer<typeof ReportCardAnalysisOutputSchema>;
