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
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus } from '@/types';
import { useRouter } from 'next/navigation';

import * as SchoolService from '@/services/schoolService';
import * as UserService from '@/services/userService';
import * as ClassService from '@/services/classService';
import * as MaterialService from '@/services/learningMaterialService';
import * as AssignmentService from '@/services/assignmentService';
import * as SubmissionService from '@/services/submissionService';

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
  updateSchoolDetails: (schoolId: string, data: Partial<Pick<School, 'name'>>) => Promise<boolean>;
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
  deleteLearningMaterial: (materialId: string) => Promise<boolean>;
  updateLearningMaterial: (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId' | 'materialType'>>) => Promise<boolean>;
  getLearningMaterialById: (materialId: string) => Promise<LearningMaterial | null>;

  // Teacher Assignment Management
  createAssignment: (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>) => Promise<string | null>;
  getAssignmentsByTeacher: (teacherId: string, classId?: string) => Promise<AssignmentWithClassInfo[]>;
  getAssignmentsByClass: (classId: string) => Promise<Assignment[]>;
  getAssignmentById: (assignmentId: string, studentId?: string) => Promise<AssignmentWithClassAndSubmissionInfo | null>;
  updateAssignment: (assignmentId: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>) => Promise<boolean>;
  deleteAssignment: (assignmentId: string) => Promise<boolean>;

  // Teacher Submission Management
  getSubmissionsForAssignment: (assignmentId: string) => Promise<SubmissionWithStudentName[]>;
  gradeSubmission: (submissionId: string, grade: string | number, feedback?: string) => Promise<boolean>;

  // Student specific functions
  getSubmissionByStudentForAssignment: (assignmentId: string, studentId: string) => Promise<Submission | null>;
  addSubmission: (submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'>) => Promise<string | null>;
  getAssignmentsForStudentByClass: (classId: string, studentId: string) => Promise<AssignmentWithClassAndSubmissionInfo[]>;
  getClassesByIds: (classIds: string[]) => Promise<ClassWithTeacherInfo[]>;
  joinClassWithCode: (classCode: string, studentId: string) => Promise<boolean>;

  // Profile Management
  updateUserDisplayName: (userId: string, displayName: string) => Promise<boolean>;
  updateUserEmail: (newEmail: string, currentPassword_not_used: string) => Promise<boolean>; 
  updateUserPassword: (newPassword: string, currentPassword_not_used: string) => Promise<boolean>;
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
            studentAssignments: userData.studentAssignments || {},
          });
        } else {
          console.warn(`User ${user.uid} exists in Firebase Auth but not in Firestore. This might be an incomplete signup or an admin-created user pending Firestore record.`);
          setCurrentUser({ 
            uid: user.uid, email: user.email, displayName: user.displayName, role: null, status: 'pending_verification',
            photoURL: user.photoURL, emailVerified: user.emailVerified, isAnonymous: user.isAnonymous, metadata: user.metadata, providerData: user.providerData, providerId: user.providerId, tenantId: user.tenantId, refreshToken: user.refreshToken, delete: user.delete, getIdToken: user.getIdToken, getIdTokenResult: user.getIdTokenResult, reload: user.reload, toJSON: user.toJSON,
            studentAssignments: {},
            classIds: [],
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Core Authentication ---
  const signUp = async (email: string, pass: string, role: UserRole, displayName: string, schoolIdToJoin?: string, schoolName?: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) return null;

      await updateFirebaseProfile(firebaseUser, { displayName });
      const profile = await UserService.createUserProfileInFirestore(firebaseUser, role, displayName, schoolIdToJoin, schoolName);
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

  // --- User Management ---
  const adminCreateUserInSchool = async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
    setLoading(true);
    try {
       return await UserService.adminCreateUserService(auth, email, pass, displayName, role, schoolId, currentUser?.schoolName);
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
    try { return await UserService.approveUserService(userId, schoolId); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };
  
  const updateUserRoleAndSchool = async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus }): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try { return await UserService.updateUserRoleAndSchoolService(userId, data); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };


  // --- Class Management ---
  const createClassInSchool = async (className: string, schoolId: string, teacherId?: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return null;
    setLoading(true);
    try { return await ClassService.createClassService(className, schoolId, teacherId || ''); }
    catch (error) { return null; }
    finally { setLoading(false); }
  };
  
  const enrollStudentInClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try { return await ClassService.enrollStudentInClassService(classId, studentId); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };

  const removeStudentFromClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try { return await ClassService.removeStudentFromClassService(classId, studentId); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };

  const deleteClass = async (classId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try { return await ClassService.deleteClassService(classId); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };

  const regenerateClassInviteCode = async (classId: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return null;
    setLoading(true);
    try { return await ClassService.regenerateClassInviteCodeService(classId); }
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
        }
      }
      return success;
    } catch (error) { return false; }
    finally { setLoading(false); }
  };
  
  const getClassesBySchool = async (schoolId: string) => ClassService.getClassesBySchoolService(schoolId, UserService.getUserProfileService);
  const getClassesByIds = async (classIds: string[]) => ClassService.getClassesByIdsService(classIds, UserService.getUserProfileService, AssignmentService.getAssignmentsByClassService);
  const getClassDetails = async (classId: string) => ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
  const updateClassDetails = async (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId' | 'classInviteCode'>>) => ClassService.updateClassDetailsService(classId, data);
  const getStudentsInClass = async (classId: string) => ClassService.getStudentsInClassService(classId, UserService.getUserProfileService);
  const getStudentsNotInClass = async (schoolId: string, classId: string) => ClassService.getStudentsNotInClassService(schoolId, classId, UserService.getUsersBySchoolAndRoleService, ClassService.getStudentsInClassService, UserService.getUserProfileService);
  const getClassesByTeacher = async (teacherId: string) => ClassService.getClassesByTeacherService(teacherId);
  const getStudentsInMultipleClasses = async (classIds: string[]) => ClassService.getStudentsInMultipleClassesService(classIds);


  // --- Learning Material Management ---
  const addLearningMaterial = async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return null;
    setLoading(true);
    try { return await MaterialService.addLearningMaterialService({ ...materialData, teacherId: materialData.teacherId || currentUser.uid }); }
    catch (error) { return null; }
    finally { setLoading(false); }
  };
  
  const deleteLearningMaterial = async (materialId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try { return await MaterialService.deleteLearningMaterialService(materialId); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };
  const updateLearningMaterial = async (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId' | 'materialType'>>): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try { return await MaterialService.updateLearningMaterialService(materialId, data); }
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
    try { return await AssignmentService.createAssignmentService({ ...assignmentData, teacherId: currentUser.uid, schoolId: currentUser.schoolId });}
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

  const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try {
      const assignmentDoc = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
      if (!assignmentDoc || (currentUser.role === 'teacher' && assignmentDoc.teacherId !== currentUser.uid)) {
        return false;
      }
      return await AssignmentService.deleteAssignmentService(assignmentId);
    } catch (error) { return false; }
    finally { setLoading(false); }
  };

  const getAssignmentsByTeacher = async (teacherId: string, classId?: string) => AssignmentService.getAssignmentsByTeacherService(teacherId, ClassService.getClassDetailsService, classId);
  const getAssignmentsByClass = async (classId: string) => AssignmentService.getAssignmentsByClassService(classId);
  const updateAssignment = async (assignmentId: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>) => AssignmentService.updateAssignmentService(assignmentId, data);


  // --- Submission Management ---
  const addSubmission = async (submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'>): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'student') return null;
    setLoading(true);
    try {
      const assignment = await AssignmentService.getAssignmentByIdService(submissionData.assignmentId, ClassService.getClassDetailsService); 
      if (!assignment) throw new Error("Assignment not found");

      const result = await SubmissionService.addSubmissionService(submissionData, currentUser.uid, assignment.deadline);
      if (result && result.submissionId && currentUser) {
         setCurrentUser(prev => prev ? { ...prev, studentAssignments: { ...prev.studentAssignments, [submissionData.assignmentId]: { status: result.newStatus, grade: result.existingGrade }} } : null);
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
      if (success && currentUser) { 
        const submission = await SubmissionService.getSubmissionByIdService(submissionId); 
        if (submission && currentUser.uid === submission.studentId) {
            setCurrentUser(prev => prev ? {
                ...prev,
                studentAssignments: {
                    ...prev.studentAssignments,
                    [submission.assignmentId]: { status: 'graded', grade }
                }
            } : null);
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


  const value = {
    currentUser, loading, signUp, logIn, logOut,
    createSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus, getSchoolDetails: SchoolService.getSchoolDetailsService, updateSchoolDetails: SchoolService.updateSchoolDetailsService, regenerateInviteCode: SchoolService.regenerateInviteCodeService,
    getUsersBySchool: UserService.getUsersBySchoolService, getUsersBySchoolAndRole: UserService.getUsersBySchoolAndRoleService, adminCreateUserInSchool, updateUserRoleAndSchool, getUserProfile: UserService.getUserProfileService, approveUserForSchool,
    createClassInSchool, getClassesBySchool, getClassDetails, updateClassDetails, enrollStudentInClass, removeStudentFromClass, getStudentsInClass, getStudentsNotInClass, deleteClass, regenerateClassInviteCode, joinClassWithCode,
    getClassesByTeacher, getStudentsInMultipleClasses,
    addLearningMaterial, getLearningMaterialsByTeacher, getLearningMaterialsBySchool, getLearningMaterialsByClass, deleteLearningMaterial, updateLearningMaterial, getLearningMaterialById,
    createAssignment, getAssignmentsByTeacher, getAssignmentsByClass, getAssignmentById, updateAssignment, deleteAssignment,
    getSubmissionsForAssignment: (assignmentId: string) => SubmissionService.getSubmissionsForAssignmentService(assignmentId, UserService.getUserProfileService),
    gradeSubmission,
    getSubmissionByStudentForAssignment: SubmissionService.getSubmissionByStudentForAssignmentService, addSubmission, getAssignmentsForStudentByClass,
    updateUserDisplayName, updateUserEmail, updateUserPassword,
    getClassesByIds
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
