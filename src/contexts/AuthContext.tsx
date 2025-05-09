
"use client";

import type { ReactNode }from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  updateEmail as updateFirebaseAuthEmail, 
  updatePassword as updateFirebasePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus, Activity, Subject, ExamPeriod, ExamPeriodWithClassNames, ExamResult, ExamResultWithStudentInfo } from '@/types';
import { useRouter } from 'next/navigation';

import * as SchoolService from '@/services/schoolService';
import * as UserService from '@/services/userService';
import * as ClassService from '@/services/classService';
import * as MaterialService from '@/services/learningMaterialService';
import * as AssignmentService from '@/services/assignmentService';
import * as SubmissionService from '@/services/submissionService';
import * as SubjectService from '@/services/subjectService';
import * as ActivityService from '@/services/activityService';
import * as ExamService from '@/services/examService';


interface AuthContextType {
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
  addLearningMaterial: (material: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  getLearningMaterialsByTeacher: (teacherId: string, classId?: string) => Promise<LearningMaterial[]>;
  getLearningMaterialsBySchool: (schoolId: string) => Promise<LearningMaterialWithTeacherInfo[]>; 
  getLearningMaterialsByClass: (classId: string) => Promise<LearningMaterial[]>;
  deleteLearningMaterial: (materialId: string, materialTitle: string) => Promise<boolean>;
  updateLearningMaterial: (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId' | 'materialType'>>) => Promise<boolean>;
  getLearningMaterialById: (materialId: string) => Promise<LearningMaterial | null>;

  // Teacher Assignment Management
  createAssignment: (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>) => Promise<string | null>;
  getAssignmentsByTeacher: (teacherId: string, classId?: string) => Promise<AssignmentWithClassInfo[]>;
  getAssignmentsByClass: (classId: string) => Promise<Assignment[]>;
  getAssignmentById: (assignmentId: string, studentId?: string) => Promise<AssignmentWithClassAndSubmissionInfo | null>;
  updateAssignment: (assignmentId: string, assignmentTitle: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>) => Promise<boolean>;
  deleteAssignment: (assignmentId: string, assignmentTitle: string) => Promise<boolean>;

  // Teacher Submission Management
  getSubmissionsForAssignment: (assignmentId: string) => Promise<SubmissionWithStudentName[]>;
  gradeSubmission: (submissionId: string, grade: string | number, feedback?: string) => Promise<boolean>;

  // Student specific functions
  getSubmissionByStudentForAssignment: (assignmentId: string, studentId: string) => Promise<Submission | null>;
  addSubmission: (submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'>) => Promise<string | null>;
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
  updateSubject: (subjectId: string, oldName: string, newName: string) => Promise<boolean>;
  deleteSubject: (subjectId: string, subjectName: string) => Promise<boolean>;
  getSubjectById: (subjectId: string) => Promise<Subject | null>;

  // Exam Management
  createExamPeriod: (examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string | null>;
  getExamPeriodsBySchool: (schoolId: string, getClassDetailsFn: typeof ClassService.getClassDetailsService) => Promise<ExamPeriodWithClassNames[]>;
  getExamPeriodById: (examPeriodId: string, getClassDetailsFn?: typeof ClassService.getClassDetailsService) => Promise<ExamPeriodWithClassNames | null>;
  updateExamPeriod: (examPeriodId: string, data: Partial<ExamPeriod>) => Promise<boolean>;
  addOrUpdateExamResult: (resultData: Omit<ExamResult, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  getExamResultsForTeacher: (examPeriodId: string, classId: string, subjectId: string, schoolId: string) => Promise<ExamResultWithStudentInfo[]>;
  getExamResultsForStudent: (studentId: string, schoolId: string, getSubjectByIdFn?: typeof SubjectService.getSubjectByIdService, getExamPeriodByIdFn?: (examPeriodId: string, getClassDetailsFn: typeof ClassService.getClassDetailsService) => Promise<ExamPeriodWithClassNames | null>) => Promise<ExamResultWithStudentInfo[]>;
  getExamResultsByPeriodAndClass: (examPeriodId: string, classId: string, schoolId: string, subjectId: string) => Promise<ExamResult[]>;


  // Activity Log
  getActivities: (schoolId: string, filters?: {classId?: string, userId?: string, type?: Activity['type']}, limitCount?: number) => Promise<Activity[]>;
  addActivity: (activityData: Omit<Activity, 'id' | 'timestamp'>) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName || user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: user.isAnonymous,
            metadata: user.metadata,
            providerData: user.providerData,
            providerId: user.providerId,
            tenantId: user.tenantId,
            refreshToken: user.refreshToken,
            delete: user.delete,
            getIdToken: user.getIdToken,
            getIdTokenResult: user.getIdTokenResult,
            reload: user.reload,
            toJSON: user.toJSON,
            role: userData.role as UserRole,
            schoolId: userData.schoolId,
            schoolName: userData.schoolName,
            status: userData.status as UserStatus || 'active',
            classIds: userData.classIds || [],
            subjects: userData.subjects || [],
            studentAssignments: userData.studentAssignments || {},
            childStudentId: userData.childStudentId
          });
        } else {
          console.warn(`User ${user.uid} exists in Firebase Auth but not in Firestore. This might be an incomplete signup or an admin-created user pending Firestore record.`);
          setCurrentUser({ 
            uid: user.uid, email: user.email, displayName: user.displayName, role: null, status: 'pending_verification',
            photoURL: user.photoURL, emailVerified: user.emailVerified, isAnonymous: user.isAnonymous, metadata: user.metadata, providerData: user.providerData, providerId: user.providerId, tenantId: user.tenantId, refreshToken: user.refreshToken, delete: user.delete, getIdToken: user.getIdToken, getIdTokenResult: user.getIdTokenResult, reload: user.reload, toJSON: user.toJSON,
            studentAssignments: {},
            classIds: [],
            subjects: [],
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addActivity = async (activityData: Omit<Activity, 'id' | 'timestamp'>) => {
    return ActivityService.addActivityService(activityData);
  };

  // --- Core Authentication ---
  const signUp = async (email: string, pass: string, role: UserRole, displayName: string, schoolIdToJoin?: string, schoolName?: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) return null;

      await updateFirebaseProfile(firebaseUser, { displayName });
      const profile = await UserService.createUserProfileInFirestore(firebaseUser, role, displayName, schoolIdToJoin, schoolName);
      if (profile && profile.schoolId && profile.displayName && profile.schoolName) {
         await addActivity({
            schoolId: profile.schoolId,
            actorId: profile.uid,
            actorName: profile.displayName,
            type: 'user_registered',
            message: `${profile.displayName} (${profile.role}) registered for ${profile.schoolName}.`,
         });
         if (profile.status === 'pending_verification') {
             await addActivity({
                schoolId: profile.schoolId,
                type: 'user_profile_updated', // generic, but implies pending
                message: `New user ${profile.displayName} (${profile.role}) is awaiting approval for ${profile.schoolName}.`,
                targetUserId: profile.uid,
                targetUserName: profile.displayName,
                link: '/admin/users'
            });
         }
      }
      return profile;
    } catch (error) {
      console.error("Error signing up:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const profile = await UserService.getUserProfileService(firebaseUser.uid);
        if (profile) {
           const fullProfile: UserProfile = {
                ...firebaseUser, 
                ...profile, 
                uid: firebaseUser.uid, 
            };
          return fullProfile;
        }
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/'); 
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Profile Management ---
  const updateUserDisplayName = async (userId: string, displayName: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await updateFirebaseProfile(auth.currentUser, { displayName });
      }
      const success = await UserService.updateUserDisplayNameService(userId, displayName);
      if (success && currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? { ...prev, displayName } : null);
      }
      return success;
    } catch (error) {
      console.error("Error updating display name:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserEmail = async (newEmail: string, currentPassword_not_used: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setLoading(true);
    try {
      await updateFirebaseAuthEmail(auth.currentUser, newEmail); 
      const success = await UserService.updateUserEmailInFirestore(auth.currentUser.uid, newEmail);
      if (success && currentUser) {
        setCurrentUser(prev => prev ? { ...prev, email: newEmail } : null);
      }
      return success;
    } catch (error) {
      console.error("Error updating email:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserPassword = async (newPassword: string, currentPassword_not_used: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setLoading(true);
    try {
      await updateFirebasePassword(auth.currentUser, newPassword);
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- School Management ---
  const createSchool = async (schoolName: string, adminId: string): Promise<string | null> => {
    setLoading(true);
    try {
      const schoolId = await SchoolService.createSchoolService(schoolName, adminId);
      if (schoolId && currentUser && currentUser.uid === adminId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId, schoolName, status: 'active' }) : null);
      }
      return schoolId;
    } catch (error) { return null; } 
    finally { setLoading(false); }
  };

  const joinSchoolWithInviteCode = async (inviteCode: string, userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const schoolData = await SchoolService.joinSchoolWithInviteCodeService(inviteCode, userId);
      if (schoolData && currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolData.id, schoolName: schoolData.name, status: 'active' }) : null);
      }
      return !!schoolData;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };

  const checkAdminOnboardingStatus = async (): Promise<{ isOnboarded: boolean; schoolId?: string }> => {
    if (!currentUser || currentUser.role !== 'admin') return { isOnboarded: false };
    return { isOnboarded: !!currentUser.schoolId, schoolId: currentUser.schoolId };
  };
  
  const updateSchoolDetails = async (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive'>>): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    setLoading(true);
    try {
        const school = await SchoolService.getSchoolDetailsService(schoolId); // Get current details for comparison
        const success = await SchoolService.updateSchoolDetailsService(schoolId, data);
        if (success && currentUser?.schoolId && currentUser.displayName && school) {
            let message = "Admin updated school settings.";
            if (data.name && school.name !== data.name) message = `Admin updated school name to "${data.name}".`;
            if (data.isExamModeActive !== undefined && school.isExamModeActive !== data.isExamModeActive) {
                 message = `Admin ${data.isExamModeActive ? 'activated' : 'deactivated'} exam mode for the school.`
            }
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'school_settings_updated',
                message: message,
                link: '/admin/settings'
            });
        }
        return success;
    } catch(error) { return false; }
    finally { setLoading(false); }
  };

  const regenerateInviteCode = async (schoolId: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return null;
    setLoading(true);
    try {
        const newCode = await SchoolService.regenerateInviteCodeService(schoolId);
        if (newCode && currentUser?.schoolId && currentUser.displayName) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'invite_code_regenerated',
                message: `Admin regenerated the school invite code.`,
                link: '/admin/settings'
            });
        }
        return newCode;
    } catch(error) { return null; }
    finally { setLoading(false); }
  };

  // --- User Management ---
  const adminCreateUserInSchool = async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
    setLoading(true);
    try {
       const newUser = await UserService.adminCreateUserService(auth, email, pass, displayName, role, schoolId, currentUser?.schoolName);
       if (newUser && currentUser?.schoolId && currentUser.displayName && currentUser.schoolName) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'user_registered',
                message: `${currentUser.displayName} created account for ${displayName} (${role}) in ${currentUser.schoolName}.`,
                targetUserId: newUser.id,
                targetUserName: displayName,
                link: `/admin/users/${newUser.id}/edit`
            });
        }
       return newUser;
    } catch (error: any) {
      console.error("Error creating user by admin in AuthContext:", error);
      return null;
    } finally {
        setLoading(false);
    }
  };

  const approveUserForSchool = async (userId: string, schoolId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    setLoading(true);
    try { 
        const success = await UserService.approveUserService(userId, schoolId); 
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const approvedUser = await UserService.getUserProfileService(userId);
            if (approvedUser) {
                 await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    type: 'user_approved',
                    message: `${currentUser.displayName} approved ${approvedUser.displayName} (${approvedUser.role}) for the school.`,
                    targetUserId: approvedUser.id,
                    targetUserName: approvedUser.displayName,
                    link: `/admin/users`
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };
  
  const updateUserRoleAndSchool = async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus }): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try { 
        const success = await UserService.updateUserRoleAndSchoolService(userId, data); 
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const targetUser = await UserService.getUserProfileService(userId);
            if (targetUser) {
                let message = `${currentUser.displayName} updated profile for ${targetUser.displayName}.`;
                if (data.status === 'rejected') {
                    message = `${currentUser.displayName} rejected user request for ${targetUser.displayName}.`;
                } else if (data.role) {
                    message = `${currentUser.displayName} updated ${targetUser.displayName}'s role to ${data.role}.`;
                }
                await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    type: 'user_profile_updated',
                    message: message,
                    targetUserId: targetUser.id,
                    targetUserName: targetUser.displayName,
                    link: `/admin/users/${targetUser.id}/edit`
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };


  // --- Class Management ---
  const createClassInSchool = async (className: string, schoolId: string, teacherId?: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin')) return null;
    setLoading(true);
    try { 
      const newClassId = await ClassService.createClassService(className, schoolId, teacherId || ''); 
      if (newClassId && currentUser?.schoolId && currentUser.displayName && currentUser.schoolName) {
        await addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'class_created',
          message: `${currentUser.displayName} created class "${className}" in ${currentUser.schoolName}.`,
          link: `/admin/classes` 
        });
      }
      return newClassId;
    }
    catch (error) { return null; }
    finally { setLoading(false); }
  };
  
  const enrollStudentInClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try { 
      const success = await ClassService.enrollStudentInClassService(classId, studentId); 
      if (success && currentUser?.schoolId && currentUser.displayName) {
        const student = await UserService.getUserProfileService(studentId);
        const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
        if (student && cls) {
             await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                classId: classId,
                targetUserId: studentId,
                targetUserName: student.displayName,
                type: 'student_joined_class',
                message: `${currentUser.displayName} enrolled ${student.displayName} in class "${cls.name}".`,
                link: `/admin/classes`
            });
        }
      }
      return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };

  const removeStudentFromClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try { 
        const success = await ClassService.removeStudentFromClassService(classId, studentId); 
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const student = await UserService.getUserProfileService(studentId);
            const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
            if (student && cls) {
                await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: classId,
                    targetUserId: studentId,
                    targetUserName: student.displayName,
                    type: 'student_removed_from_class',
                    message: `${currentUser.displayName} removed ${student.displayName} from class "${cls.name}".`,
                    link: `/admin/classes`
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };

  const deleteClass = async (classId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try { 
        const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
        const success = await ClassService.deleteClassService(classId); 
        if (success && cls && currentUser?.schoolId && currentUser.displayName) {
             await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                classId: classId,
                type: 'class_deleted',
                message: `${currentUser.displayName} deleted class "${cls.name}".`,
                link: `/admin/classes`
            });
        }
        return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };

  const regenerateClassInviteCode = async (classId: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return null;
    setLoading(true);
    try { 
        const newCode = await ClassService.regenerateClassInviteCodeService(classId); 
        if (newCode && currentUser?.schoolId && currentUser.displayName) {
            const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
            if (cls) {
                 await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: classId,
                    type: 'invite_code_regenerated',
                    message: `${currentUser.displayName} regenerated invite code for class "${cls.name}".`,
                    link: `/admin/classes` // Or teacher view if applicable
                });
            }
        }
        return newCode;
    }
    catch (error) { return null; }
    finally { setLoading(false); }
  };
  
  const joinClassWithCode = async (classCode: string, studentId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'student' || currentUser.uid !== studentId) return false;
    setLoading(true);
    try {
      const success = await ClassService.joinClassWithCodeService(classCode, studentId);
      if (success && currentUser) {
        const classDetails = await ClassService.getClassByInviteCodeService(classCode);
        if (classDetails) {
          setCurrentUser(prev => prev ? ({ ...prev, classIds: Array.from(new Set([...(prev.classIds || []), classDetails.id])) }) : null);
          if (currentUser.schoolId && currentUser.displayName && classDetails.name) {
            await addActivity({
              schoolId: currentUser.schoolId,
              actorId: currentUser.uid,
              actorName: currentUser.displayName,
              classId: classDetails.id,
              type: 'student_joined_class',
              message: `${currentUser.displayName} joined class "${classDetails.name}".`,
              link: `/student/classes/${classDetails.id}`
            });
          }
        }
      }
      return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };
  
  const updateClassDetails = async (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId' | 'classInviteCode'>>): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
        const success = await ClassService.updateClassDetailsService(classId, data);
        if (success && currentUser?.schoolId && currentUser.displayName) {
             const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
             if (cls) {
                await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: classId,
                    type: 'class_updated',
                    message: `${currentUser.displayName} updated details for class "${cls.name}".`,
                    link: `/admin/classes`
                });
             }
        }
        return success;
    } catch(error) { return false; }
    finally { setLoading(false); }
  };
  
  const getClassesBySchool = async (schoolId: string) => ClassService.getClassesBySchoolService(schoolId, UserService.getUserProfileService);
  const getClassesByIds = async (classIds: string[]) => ClassService.getClassesByIdsService(classIds, UserService.getUserProfileService, AssignmentService.getAssignmentsByClassService);
  const getClassDetails = async (classId: string) => ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
  const getStudentsInClass = async (classId: string) => ClassService.getStudentsInClassService(classId, UserService.getUserProfileService);
  const getStudentsNotInClass = async (schoolId: string, classId: string) => ClassService.getStudentsNotInClassService(schoolId, classId, UserService.getUsersBySchoolAndRoleService, ClassService.getStudentsInClassService, UserService.getUserProfileService);
  const getClassesByTeacher = async (teacherId: string) => ClassService.getClassesByTeacherService(teacherId);
  const getStudentsInMultipleClasses = async (classIds: string[]) => ClassService.getStudentsInMultipleClassesService(classIds);


  // --- Learning Material Management ---
  const addLearningMaterial = async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return null;
    setLoading(true);
    try { 
      const newMaterialId = await MaterialService.addLearningMaterialService({ ...materialData, teacherId: materialData.teacherId || currentUser.uid }); 
       if (newMaterialId && currentUser?.schoolId && currentUser.displayName) {
            const classInfo = materialData.classId ? await ClassService.getClassDetailsService(materialData.classId, UserService.getUserProfileService) : null;
            const className = classInfo ? ` in class "${classInfo.name}"` : " (general material)";
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                classId: materialData.classId,
                type: 'material_uploaded',
                message: `${currentUser.displayName} uploaded material "${materialData.title}"${className}.`,
                link: materialData.classId ? `/teacher/classes/${materialData.classId}` : `/teacher/materials`
            });
        }
      return newMaterialId;
    }
    catch (error) { return null; }
    finally { setLoading(false); }
  };
  
  const deleteLearningMaterial = async (materialId: string, materialTitle: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try { 
        const success = await MaterialService.deleteLearningMaterialService(materialId); 
        if (success && currentUser?.schoolId && currentUser.displayName) {
             await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'material_deleted',
                message: `${currentUser.displayName} deleted material "${materialTitle}".`,
                link: `/teacher/materials`
            });
        }
        return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };
  const updateLearningMaterial = async (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId' | 'materialType'>>): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try { 
        const success = await MaterialService.updateLearningMaterialService(materialId, data); 
        if (success && currentUser?.schoolId && currentUser.displayName && data.title) {
             await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'material_updated',
                message: `${currentUser.displayName} updated material "${data.title}".`,
                link: `/teacher/materials`
            });
        }
        return success;
    }
    catch (error) { return false; }
    finally { setLoading(false); }
  };
  
  const getLearningMaterialsByTeacher = async (teacherId: string, classId?: string) => MaterialService.getLearningMaterialsByTeacherService(teacherId, classId);
  const getLearningMaterialsBySchool = async (schoolId: string) => MaterialService.getLearningMaterialsBySchoolService(schoolId, UserService.getUserProfileService, ClassService.getClassDetailsService);
  const getLearningMaterialsByClass = async (classId: string) => MaterialService.getLearningMaterialsByClassService(classId);
  const getLearningMaterialById = async (materialId: string) => MaterialService.getLearningMaterialByIdService(materialId);


  // --- Assignment Management ---
  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'teacher' || !currentUser.schoolId) return null;
    setLoading(true);
    try { 
        const newAssignmentId = await AssignmentService.createAssignmentService({ ...assignmentData, teacherId: currentUser.uid, schoolId: currentUser.schoolId });
        if (newAssignmentId && currentUser?.schoolId && currentUser.displayName) {
            const classInfo = await ClassService.getClassDetailsService(assignmentData.classId, UserService.getUserProfileService);
            const className = classInfo ? classInfo.name : 'Unknown Class';
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                classId: assignmentData.classId,
                type: 'assignment_created',
                message: `${currentUser.displayName} created assignment "${assignmentData.title}" for class "${className}".`,
                link: `/teacher/assignments/${newAssignmentId}` 
            });
        }
        return newAssignmentId;
    }
    catch (error) { return null; }
    finally { setLoading(false); }
  };

  const getAssignmentById = async (assignmentId: string, studentId?: string): Promise<AssignmentWithClassAndSubmissionInfo | null> => {
    setLoading(true);
    try {
      const assignment = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
      if (!assignment) return null;

      if (studentId) {
        const submission = await SubmissionService.getSubmissionByStudentForAssignmentService(assignmentId, studentId);
        if (submission) {
          assignment.submissionStatus = submission.status;
          assignment.submissionGrade = submission.grade;
        } else if (currentUser?.studentAssignments?.[assignmentId]) { 
          assignment.submissionStatus = currentUser.studentAssignments[assignmentId].status;
          assignment.submissionGrade = currentUser.studentAssignments[assignmentId].grade;
        } else {
          assignment.submissionStatus = 'missing';
        }
      }
      return assignment;
    } catch (error) { return null; }
    finally { setLoading(false); }
  };

  const deleteAssignment = async (assignmentId: string, assignmentTitle: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try {
      const assignmentDoc = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
      if (!assignmentDoc || (currentUser.role === 'teacher' && assignmentDoc.teacherId !== currentUser.uid)) {
        return false;
      }
      const success = await AssignmentService.deleteAssignmentService(assignmentId);
      if (success && currentUser?.schoolId && currentUser.displayName) {
         await addActivity({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: assignmentDoc.classId,
            type: 'assignment_deleted',
            message: `${currentUser.displayName} deleted assignment "${assignmentTitle}".`,
            link: `/teacher/assignments`
        });
      }
      return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };

  const updateAssignment = async (assignmentId: string, assignmentTitle: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try {
        const success = await AssignmentService.updateAssignmentService(assignmentId, data);
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const assignmentDoc = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
            if (assignmentDoc) {
                 await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: assignmentDoc.classId,
                    type: 'assignment_updated',
                    message: `${currentUser.displayName} updated assignment "${data.title || assignmentTitle}".`,
                    link: `/teacher/assignments/${assignmentId}`
                });
            }
        }
        return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };

  const getAssignmentsByTeacher = async (teacherId: string, classId?: string) => AssignmentService.getAssignmentsByTeacherService(teacherId, ClassService.getClassDetailsService, classId);
  const getAssignmentsByClass = async (classId: string) => AssignmentService.getAssignmentsByClassService(classId);


  // --- Submission Management ---
  const addSubmission = async (submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'>): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'student') return null;
    setLoading(true);
    try {
      const assignment = await AssignmentService.getAssignmentByIdService(submissionData.assignmentId, ClassService.getClassDetailsService); 
      if (!assignment) throw new Error("Assignment not found");

      const result = await SubmissionService.addSubmissionService(submissionData, currentUser.uid, assignment.deadline);
      if (result && result.submissionId && currentUser && currentUser.schoolId && currentUser.displayName) {
         setCurrentUser(prev => prev ? { ...prev, studentAssignments: { ...prev.studentAssignments, [submissionData.assignmentId]: { status: result.newStatus, grade: result.existingGrade }} } : null);
         const classInfo = assignment.className || 'the class';
         await addActivity({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: submissionData.classId,
            type: 'submission_received',
            message: `${currentUser.displayName} submitted assignment "${assignment.title}" for ${classInfo}.`,
            link: `/teacher/assignments/${submissionData.assignmentId}` 
         });
      }
      return result?.submissionId || null;
    } catch (error) { return null; }
    finally { setLoading(false); }
  };

  const gradeSubmission = async (submissionId: string, grade: string | number, feedback?: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'teacher') return false;
    setLoading(true);
    try {
      const success = await SubmissionService.gradeSubmissionService(submissionId, grade, feedback);
      if (success && currentUser && currentUser.schoolId && currentUser.displayName) { 
        const submission = await SubmissionService.getSubmissionByIdService(submissionId); 
        if (submission) {
            const assignment = await AssignmentService.getAssignmentByIdService(submission.assignmentId, ClassService.getClassDetailsService);
            const student = await UserService.getUserProfileService(submission.studentId);
            if (assignment && student) {
                 await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: submission.classId,
                    targetUserId: student.id,
                    targetUserName: student.displayName,
                    type: 'submission_graded',
                    message: `${currentUser.displayName} graded ${student.displayName}'s submission for "${assignment.title}". Grade: ${grade}.`,
                    link: `/student/assignments/${submission.assignmentId}`
                });
            }
            // No need to update current user's studentAssignments here, as teacher is grading.
        }
      }
      return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };

  const getAssignmentsForStudentByClass = async (classId: string, studentId: string): Promise<AssignmentWithClassAndSubmissionInfo[]> => {
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return [];
    if (currentUser.role === 'student' && currentUser.uid !== studentId) return [];
    setLoading(true);
    try {
        const studentProfile = await UserService.getUserProfileService(studentId);
        return await AssignmentService.getAssignmentsForStudentByClassService(classId, studentId, SubmissionService.getSubmissionByStudentForAssignmentService, ClassService.getClassDetailsService, studentProfile);
    } catch (error) { return []; }
    finally { setLoading(false); }
  };

  const completeStudentOnboarding = async (userId: string, classId: string, subjectIds: string[]): Promise<boolean> => {
    if (!currentUser || currentUser.uid !== userId || currentUser.role !== 'student') return false;
    setLoading(true);
    try {
      const success = await UserService.completeStudentOnboardingService(userId, classId, subjectIds);
      if (success && currentUser?.schoolId && currentUser.displayName) {
        setCurrentUser(prev => prev ? { ...prev, classIds: [classId], subjects: subjectIds } : null);
         const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
         await addActivity({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: classId,
            type: 'student_onboarded',
            message: `${currentUser.displayName} completed onboarding and joined class "${cls?.name || 'N/A'}".`,
            link: `/student/dashboard`
        });
      }
      return success;
    } catch (error) {
      console.error("Error completing student onboarding in AuthContext:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Subject Management ---
  const createSubject = async (schoolId: string, subjectName: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return null;
    setLoading(true);
    try { 
      const newSubjectId = await SubjectService.createSubjectService(schoolId, subjectName); 
      if (newSubjectId && currentUser?.schoolId && currentUser.displayName && currentUser.schoolName) {
        await addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'subject_created',
          message: `${currentUser.displayName} created subject "${subjectName}" for ${currentUser.schoolName}.`,
          link: `/admin/school-settings/subjects`
        });
      }
      return newSubjectId;
    }
    catch (error) { return null; }
    finally { setLoading(false); }
  };
  
  const updateSubject = async (subjectId: string, oldName: string, newName: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
        const success = await SubjectService.updateSubjectService(subjectId, newName);
        if (success && currentUser?.schoolId && currentUser.displayName) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'subject_updated',
                message: `${currentUser.displayName} updated subject "${oldName}" to "${newName}".`,
                link: `/admin/school-settings/subjects`
            });
        }
        return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };

  const deleteSubject = async (subjectId: string, subjectName: string): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
        const success = await SubjectService.deleteSubjectService(subjectId);
        if (success && currentUser?.schoolId && currentUser.displayName) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'subject_deleted',
                message: `${currentUser.displayName} deleted subject "${subjectName}".`,
                link: `/admin/school-settings/subjects`
            });
        }
        return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };


  const value = {
    currentUser, loading, signUp, logIn, logOut,
    createSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus, getSchoolDetails: SchoolService.getSchoolDetailsService, updateSchoolDetails, regenerateInviteCode,
    getUsersBySchool: UserService.getUsersBySchoolService, getUsersBySchoolAndRole: UserService.getUsersBySchoolAndRoleService, adminCreateUserInSchool, updateUserRoleAndSchool, getUserProfile: UserService.getUserProfileService, approveUserForSchool,
    createClassInSchool, getClassesBySchool, getClassDetails, updateClassDetails, enrollStudentInClass, removeStudentFromClass, getStudentsInClass, getStudentsNotInClass, deleteClass, regenerateClassInviteCode, joinClassWithCode,
    getClassesByTeacher, getStudentsInMultipleClasses,
    addLearningMaterial, getLearningMaterialsByTeacher, getLearningMaterialsBySchool, getLearningMaterialsByClass, deleteLearningMaterial, updateLearningMaterial, getLearningMaterialById,
    createAssignment, getAssignmentsByTeacher, getAssignmentsByClass, getAssignmentById, updateAssignment, deleteAssignment,
    getSubmissionsForAssignment: (assignmentId: string) => SubmissionService.getSubmissionsForAssignmentService(assignmentId, UserService.getUserProfileService),
    gradeSubmission,
    getSubmissionByStudentForAssignment: SubmissionService.getSubmissionByStudentForAssignmentService, addSubmission, getAssignmentsForStudentByClass,
    completeStudentOnboarding,
    updateUserDisplayName, updateUserEmail, updateUserPassword,
    getClassesByIds,
    createSubject, getSubjectsBySchool: SubjectService.getSubjectsBySchoolService, updateSubject, deleteSubject, getSubjectById: SubjectService.getSubjectByIdService,
    // Exam Functions (from ExamService)
    createExamPeriod: ExamService.createExamPeriodService, 
    getExamPeriodsBySchool: (schoolId: string) => ExamService.getExamPeriodsBySchoolService(schoolId, ClassService.getClassDetailsService),
    getExamPeriodById: (examPeriodId: string) => ExamService.getExamPeriodByIdService(examPeriodId, ClassService.getClassDetailsService),
    updateExamPeriod: ExamService.updateExamPeriodService,
    addOrUpdateExamResult: ExamService.addOrUpdateExamResultService,
    getExamResultsForTeacher: (examPeriodId: string, classId: string, subjectId: string, schoolId: string) => ExamService.getExamResultsForTeacherService(examPeriodId, classId, subjectId, schoolId, UserService.getUserProfileService),
    getExamResultsForStudent: (studentId: string, schoolId: string) => ExamService.getExamResultsByStudentService(studentId, schoolId, SubjectService.getSubjectByIdService, (examPeriodId) => ExamService.getExamPeriodByIdService(examPeriodId, ClassService.getClassDetailsService)),
    getExamResultsByPeriodAndClass: (examPeriodId: string, classId: string, schoolId: string, subjectId: string) => ExamService.getExamResultsByPeriodAndClassService(examPeriodId, classId, schoolId, subjectId, SubjectService.getSubjectByIdService),
    // Activity Log
    getActivities: ActivityService.getActivitiesService, addActivity
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
