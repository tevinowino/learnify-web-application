import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Custom Zod type for Firestore Timestamp
const firestoreTimestampSchema = z.custom<Timestamp>((data) => data instanceof Timestamp, {
  message: "Expected Firestore Timestamp",
});

// Base User Schemas (can be extended)
export const UserRoleSchema = z.enum(['admin', 'teacher', 'student', 'parent']).nullable();
export const UserStatusSchema = z.enum(['pending_verification', 'active', 'rejected', 'disabled']);

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  role: UserRoleSchema,
  isAdminAlso: z.boolean().optional().default(false),
  schoolId: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
  status: UserStatusSchema.optional(),
  classIds: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(), // Array of subject IDs
  studentAssignments: z.record(z.object({
    status: z.enum(['submitted', 'graded', 'missing', 'late']),
    grade: z.union([z.string(), z.number()]).optional(),
  })).optional(),
  childStudentId: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  emailVerified: z.boolean().optional(),
  createdAt: firestoreTimestampSchema.optional(),
  updatedAt: firestoreTimestampSchema.optional(),
  onboardingStep: z.number().nullable().optional(),
  lastTestimonialSurveyAt: firestoreTimestampSchema.nullable().optional(),
});

export const UserProfileWithIdSchema = UserProfileSchema.extend({
  id: z.string(),
});


export const SchoolSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "School name is required"),
  adminId: z.string(),
  inviteCode: z.string(),
  schoolType: z.string().optional(),
  country: z.string().optional(),
  phoneNumber: z.string().optional(),
  setupComplete: z.boolean().optional().default(false),
  isExamModeActive: z.boolean().optional().default(false),
  createdAt: firestoreTimestampSchema.optional(),
  updatedAt: firestoreTimestampSchema.optional(),
});

export const OnboardingSchoolDataSchema = z.object({
  schoolName: z.string().min(3, "School name must be at least 3 characters."),
  schoolType: z.enum(["Primary", "Secondary", "K-12", "Higher Education", "Vocational", "Other"]),
  country: z.string().min(2, "Country is required."),
  phoneNumber: z.string().optional(),
});

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Subject name is required"),
  schoolId: z.string(),
  isCompulsory: z.boolean().optional().default(false),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});
export const OnboardingSubjectDataSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters."),
  isCompulsory: z.boolean().optional().default(false),
});


export const ClassTypeSchema = z.enum(['main', 'subject_based']);
export const ClassSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Class name is required"),
  schoolId: z.string(),
  teacherId: z.string().optional().nullable(),
  studentIds: z.array(z.string()).optional(),
  classInviteCode: z.string().optional(),
  classType: ClassTypeSchema,
  compulsorySubjectIds: z.array(z.string()).optional(),
  subjectId: z.string().optional().nullable(),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});

export const OnboardingClassDataSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters."),
  type: ClassTypeSchema,
  subjectId: z.string().optional(),
  compulsorySubjectIds: z.array(z.string()).optional(),
});


export const LearningMaterialTypeSchema = z.enum(['text', 'link', 'video_link', 'pdf_link', 'pdf_upload']);
export const LearningMaterialSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  materialType: LearningMaterialTypeSchema,
  schoolId: z.string(),
  teacherId: z.string(),
  classId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  originalFileName: z.string().optional().nullable(),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});


export const SubmissionFormatSchema = z.enum(['text_entry', 'file_link', 'file_upload']);
export const AssignmentSchema = z.object({
  id: z.string(),
  classId: z.string(),
  teacherId: z.string(),
  schoolId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  deadline: firestoreTimestampSchema,
  allowedSubmissionFormats: z.array(SubmissionFormatSchema).min(1),
  subjectId: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  originalFileName: z.string().optional().nullable(),
  totalSubmissions: z.number().optional().default(0),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
  // status field for student's view is not part of the core Assignment model, but derived
});


export const SubmissionStatusSchema = z.enum(['submitted', 'graded', 'late', 'missing']); // Added 'missing'
export const SubmissionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  classId: z.string(),
  studentId: z.string(),
  submittedAt: firestoreTimestampSchema,
  content: z.string(),
  submissionType: SubmissionFormatSchema,
  originalFileName: z.string().optional().nullable(),
  grade: z.union([z.string(), z.number()]).optional().nullable(),
  feedback: z.string().optional().nullable(),
  status: SubmissionStatusSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});


export const ExamPeriodStatusSchema = z.enum(['upcoming', 'active', 'grading', 'completed']);
export const ExamPeriodSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Exam period name must be at least 3 characters."),
  schoolId: z.string(),
  startDate: firestoreTimestampSchema,
  endDate: firestoreTimestampSchema,
  assignedClassIds: z.array(z.string()),
  status: ExamPeriodStatusSchema,
  assignmentScope: z.enum(['specific_classes', 'form_grade', 'entire_school']).optional().default('specific_classes'),
  scopeDetail: z.string().optional().nullable(),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});


export const ExamResultSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  examPeriodId: z.string(),
  classId: z.string(),
  schoolId: z.string(),
  subjectId: z.string(),
  marks: z.union([z.string(), z.number()]),
  remarks: z.string().optional().nullable(),
  teacherId: z.string(),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});


export const ActivityTypeSchema = z.enum([
  'assignment_created', 'assignment_updated', 'assignment_deleted',
  'material_uploaded', 'material_updated', 'material_deleted',
  'submission_received', 'submission_graded',
  'student_joined_class', 'student_removed_from_class', 'student_onboarded',
  'class_created', 'class_updated', 'class_deleted',
  'subject_created', 'subject_updated', 'subject_deleted',
  'user_registered', 'user_approved', 'user_rejected', 'user_profile_updated',
  'attendance_marked',
  'exam_period_created', 'exam_period_updated', 'exam_period_finalized', 'exam_results_entered',
  'school_settings_updated', 'school_onboarding_step', 'invite_code_regenerated', 'parent_linked_child',
  'testimonial_submitted', 'general_announcement'
]);
export const ActivitySchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  classId: z.string().optional().nullable(),
  actorId: z.string().optional().nullable(),
  actorName: z.string().optional().nullable(),
  targetUserId: z.string().optional().nullable(),
  targetUserName: z.string().optional().nullable(),
  type: ActivityTypeSchema,
  message: z.string(),
  link: z.string().url().optional().nullable(),
  timestamp: firestoreTimestampSchema,
});


export const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);
export const AttendanceRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string().optional().nullable(),
  classId: z.string(),
  className: z.string().optional().nullable(),
  schoolId: z.string(),
  date: firestoreTimestampSchema,
  status: AttendanceStatusSchema,
  markedBy: z.string(),
  markedByName: z.string().optional().nullable(),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema.optional(),
});


export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  schoolId: z.string(),
  message: z.string(),
  link: z.string().url().optional().nullable(),
  isRead: z.boolean(),
  createdAt: firestoreTimestampSchema,
  type: ActivityTypeSchema, // Can reuse ActivityTypeSchema if appropriate
  actorName: z.string().optional().nullable(),
});

export const TestimonialSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: UserRoleSchema,
  schoolId: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
  rating: z.number().min(1).max(5),
  feedbackText: z.string().min(10, "Feedback must be at least 10 characters."),
  isApprovedForDisplay: z.boolean(),
  submittedAt: firestoreTimestampSchema,
});

export const OnboardingInvitedUserDataSchema = z.object({
  email: z.string().email("Invalid email address."),
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  role: z.enum(["teacher", "student"]),
});


// AI Flow Schemas
export const AnalyzeStudentPerformanceInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  examResultsSummary: z.string().describe("A summary of the student's recent exam performance, including subjects and scores/grades. For example: 'Math: 85% (Mid-Term), Science: 72% (Mid-Term), English: 92% (Mid-Term)'."),
  assignmentSummary: z.string().describe("A summary of the student's assignment completion and quality. For example: 'Average assignment score: 80%. Completes 90% of assignments on time. Shows good understanding in practical tasks but struggles with analytical essay questions.'"),
  attendanceSummary: z.string().optional().describe("A summary of the student's attendance record. For example: '95% attendance rate over the last term, with 2 instances of lateness.'"),
});

export const AnalyzeStudentPerformanceOutputSchema = z.object({
  strengths: z.string().describe("A paragraph identifying the student's key academic strengths based on the provided data. Be specific and positive."),
  weaknesses: z.string().describe("A paragraph identifying areas where the student could improve, based on the provided data. Be constructive and suggest general areas of focus."),
  recommendations: z.string().describe("Actionable recommendations for the student, parents, or teachers to help the student improve. These should be practical suggestions."),
  overallSummary: z.string().describe("A concise overall summary of the student's performance and potential."),
});


export const AkiliChatInputSchema = z.object({
  studentMessage: z.string().describe('The message from the student to Akili.'),
});
export const AkiliChatOutputSchema = z.object({
  akiliResponse: z.string().describe("Akili's response to the student."),
});


export const MwalimuChatInputSchema = z.object({
  teacherMessage: z.string().describe('The message from the teacher to Mwalimu.'),
});
export const MwalimuChatOutputSchema = z.object({
  mwalimuResponse: z.string().describe("Mwalimu's response to the teacher."),
});


export const GenerateLearningPathInputSchema = z.object({
  selectedSubject: z.string().describe('The subject the student wants a learning path for.'),
  currentUnderstanding: z
    .string()
    .describe("A description of the student's current understanding, strengths, or challenges in the subject."),
  studentGoals: z.string().describe('The specific learning goals of the student for this subject.'),
  teacherContent: z.string().optional().describe('Optional: Any specific content, curriculum overview, or topics provided by the teacher, if available. This can help tailor the path further.'),
});
export const GenerateLearningPathOutputSchema = z.object({
  learningPath: z
    .string()
    .describe('The generated personalized learning path for the student. This should be a step-by-step guide with suggested topics, resources, and activities. Format it clearly, possibly using markdown-like structures (e.g., headings, bullet points).'),
});


export const SummarizeLearningMaterialInputSchema = z.object({
  learningMaterial: z
    .string()
    .describe('The learning material to be summarized. This could be text, a URL, or any other form of content.'),
});
export const SummarizeLearningMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the learning material.'),
});

// Schemas for Report Card Analysis AI Flow
export const SubjectResultSchema = z.object({
  subjectName: z.string().describe("The name of the subject."),
  marks: z.string().describe("The marks or grade obtained by the student in the subject. E.g., '85%', 'A+'."),
  remarks: z.string().optional().describe("Teacher's remarks for the subject, if any."),
});

export const ReportCardAnalysisInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  examPeriodName: z.string().describe("The name of the exam period. E.g., 'Mid-Term Exams Fall 2024'."),
  results: z.array(SubjectResultSchema).min(1, "At least one subject result is required.")
    .describe("An array of the student's results for this exam period."),
});
export const ReportCardAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A concise, positive, and constructive AI-generated overview of the student's performance based on the provided results. Highlight strengths and suggest general areas for focus. Maximum 2-3 sentences."),
});
