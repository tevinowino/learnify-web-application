
"use client";
import type { ReactNode }from 'react';
import { createContext } from 'react';
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus, Activity, Subject, ExamPeriod, ExamPeriodWithClassNames, ExamResult, ExamResultWithStudentInfo } from '@/types';

// This will be the full type provided by the AuthProvider
export interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signUp: (email: string, pass: string, role: UserRole, displayName: string, schoolIdToJoin?: string, schoolName?: string) => Promise<UserProfile | null>;
  logIn: (email: string, pass: string) => Promise<UserProfile | null>;
  logOut: () => Promise<void>;
  
  // Admin School Management
  createSchool: (schoolName: string, adminId: string) => Promise<string | null>; 
  joinSchoolWithInviteCode: (inviteCode: string, userId: string) => Promise<boolean>;
  checkAdminOnboardingStatus: () => Promise<{ isOnboarded: boolean; schoolId?: string }>;
  getSchoolDetails: (schoolId: string) => Promise<School | null>;
  updateSchoolDetails: (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive'>>) => Promise<boolean>;
  regenerateInviteCode: (schoolId: string) => Promise<string | null>;

  // Admin User Management
  getUsersBySchool: (schoolId: string) => Promise<UserProfileWithId[]>;
  getUsersBySchoolAndRole: (schoolId: string, role: UserRole) => Promise<UserProfileWithId[]>;
  adminCreateUserInSchool: (email: string, pass: string, displayName: string, role: UserRole, schoolId: string) => Promise<UserProfileWithId | null>;
  updateUserRoleAndSchool: (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus }) => Promise<boolean>;
  getUserProfile: (userId: string) => Promise<UserProfileWithId | null>;
  approveUserForSchool: (userId: string, schoolId: string) => Promise<boolean>;

  // Admin & Teacher Class Management
  createClassInSchool: (className: string, schoolId: string, teacherId?: string) => Promise<string | null>;
  getClassesBySchool: (schoolId: string) => Promise<ClassWithTeacherInfo[]>;
  getClassDetails: (classId: string) => Promise<ClassWithTeacherInfo | null>;
  updateClassDetails: (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId' | 'classInviteCode'>>) => Promise<boolean>;
  enrollStudentInClass: (classId: string, studentId: string) => Promise<boolean>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<boolean>;
  getStudentsInClass: (classId: string) => Promise<UserProfileWithId[]>;
  getStudentsNotInClass: (schoolId: string, classId: string) => Promise<UserProfileWithId[]>;
  deleteClass: (classId: string) => Promise<boolean>;
  regenerateClassInviteCode: (classId: string) => Promise<string | null>;

  // Teacher specific class functions
  getClassesByTeacher: (teacherId: string) => Promise<ClassWithTeacherInfo[]>;
  getStudentsInMultipleClasses: (classIds: string[]) => Promise<UserProfileWithId[]>;

  // Teacher Material Management
  addLearningMaterial: (material: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>, file?: File | null) => Promise<string | null>;
  getLearningMaterialsByTeacher: (teacherId: string, classId?: string) => Promise<LearningMaterial[]>;
  getLearningMaterialsBySchool: (schoolId: string) => Promise<LearningMaterialWithTeacherInfo[]>; 
  getLearningMaterialsByClass: (classId: string) => Promise<LearningMaterial[]>;
  deleteLearningMaterial: (materialId: string, materialTitle: string) => Promise<boolean>;
  updateLearningMaterial: (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId' | 'materialType' | 'subjectId' | 'attachmentUrl'>>, file?: File | null) => Promise<boolean>;
  getLearningMaterialById: (materialId: string) => Promise<LearningMaterial | null>;

  // Teacher Assignment Management
  createAssignment: (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>, file?: File | null) => Promise<string | null>;
  getAssignmentsByTeacher: (teacherId: string, classId?: string) => Promise<AssignmentWithClassInfo[]>;
  getAssignmentsByClass: (classId: string) => Promise<Assignment[]>;
  getAssignmentById: (assignmentId: string, studentId?: string) => Promise<AssignmentWithClassAndSubmissionInfo | null>;
  updateAssignment: (assignmentId: string, assignmentTitle: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>, file?: File | null) => Promise<boolean>;
  deleteAssignment: (assignmentId: string, assignmentTitle: string) => Promise<boolean>;

  // Teacher Submission Management
  fetchSubmissionsForAssignment: (assignmentId: string) => Promise<SubmissionWithStudentName[]>;
  gradeSubmission: (submissionId: string, grade: string | number, feedback?: string) => Promise<boolean>;

  // Student specific functions
  getSubmissionByStudentForAssignment: (assignmentId: string, studentId: string) => Promise<Submission | null>;
  addSubmission: (submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status' | 'originalFileName'>, file?: File | null) => Promise<string | null>;
  getAssignmentsForStudentByClass: (classId: string, studentId: string) => Promise<AssignmentWithClassAndSubmissionInfo[]>;
  getClassesByIds: (classIds: string[]) => Promise<ClassWithTeacherInfo[]>;
  joinClassWithCode: (classCode: string, studentId: string) => Promise<boolean>;
  completeStudentOnboarding: (userId: string, classId: string, subjectIds: string[]) => Promise<boolean>;

  // Profile Management
  updateUserDisplayName: (userId: string, displayName: string) => Promise<boolean>;
  updateUserEmail: (newEmail: string, currentPassword_not_used: string) => Promise<boolean>; 
  updateUserPassword: (newPassword: string, currentPassword_not_used: string) => Promise<boolean>;

  // Subject Management
  createSubject: (schoolId: string, subjectName: string) => Promise<string | null>;
  getSubjectsBySchool: (schoolId: string) => Promise<Subject[]>; 
  updateSubject: (subjectId: string, newName: string) => Promise<boolean>;
  deleteSubject: (subjectId: string, subjectName: string) => Promise<boolean>;
  getSubjectById: (subjectId: string) => Promise<Subject | null>;

  // Exam Management
  createExamPeriod: (examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string | null>;
  getExamPeriodsBySchool: (schoolId: string) => Promise<ExamPeriodWithClassNames[]>;
  getExamPeriodById: (examPeriodId: string) => Promise<ExamPeriodWithClassNames | null>;
  updateExamPeriod: (examPeriodId: string, data: Partial<ExamPeriod>) => Promise<boolean>;
  addOrUpdateExamResult: (resultData: Omit<ExamResult, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  getExamResultsForTeacher: (examPeriodId: string, classId: string, subjectId: string, schoolId: string) => Promise<ExamResultWithStudentInfo[]>;
  getExamResultsForStudent: (studentId: string, schoolId: string) => Promise<ExamResultWithStudentInfo[]>;
  getExamResultsByPeriodAndClass: (examPeriodId: string, classId: string, schoolId: string, subjectId: string) => Promise<ExamResult[]>;


  // Activity Log
  getActivities: (schoolId: string, filters?: {classId?: string, userId?: string, type?: Activity['type']}, limitCount?: number) => Promise<Activity[]>;
  addActivity: (activityData: Omit<Activity, 'id' | 'timestamp'>) => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
