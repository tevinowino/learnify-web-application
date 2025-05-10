
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
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus, Activity } from '@/types';
import { useRouter } from 'next/navigation';

import * as SchoolService from '@/services/schoolService';
import * as UserService from '@/services/userService';
import * as ClassService from '@/services/classService';
import * as MaterialService from '@/services/learningMaterialService';
import * as AssignmentService from '@/services/assignmentService';
import * as SubmissionService from '@/services/submissionService';
import * as SubjectService from '@/services/subjectService';
import { addActivityService, getActivitiesService } from '@/services/activityService';


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
  completeStudentOnboarding: (userId: string, classId: string, subjectIds: string[]) => Promise<boolean>;

  // Profile Management
  updateUserDisplayName: (userId: string, displayName: string) => Promise<boolean>;
  updateUserEmail: (newEmail: string, currentPassword_not_used: string) => Promise<boolean>; 
  updateUserPassword: (newPassword: string, currentPassword_not_used: string) => Promise<boolean>;

  // Subject Management
  createSubject: (schoolId: string, subjectName: string) => Promise<string | null>;
  getSubjectsBySchool: (schoolId: string) => Promise<LearningMaterial[]>; // Note: Re-using LearningMaterial for Subject type for now as they are similar enough
  updateSubject: (subjectId: string, newName: string) => Promise<boolean>;
  deleteSubject: (subjectId: string) => Promise<boolean>;

  // Activity Log
  getActivities: (schoolId: string, filters?: {classId?: string, userId?: string, type?: Activity['type']}, limitCount?: number) => Promise<Activity[]>;
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
         await addActivityService({
            schoolId: profile.schoolId,
            actorId: profile.uid,
            actorName: profile.displayName,
            type: 'user_registered',
            message: `${profile.displayName} (${profile.role}) registered for ${profile.schoolName}.`,
         });
         if (profile.status === 'pending_verification') {
             await addActivityService({
                schoolId: profile.schoolId,
                type: 'user_approved', // This is misleading, it should be user_pending_approval
                message: `New user ${profile.displayName} (${profile.role}) is awaiting approval for ${profile.schoolName}.`,
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

  // --- User Management ---
  const adminCreateUserInSchool = async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
    setLoading(true);
    try {
       const newUser = await UserService.adminCreateUserService(auth, email, pass, displayName, role, schoolId, currentUser?.schoolName);
       if (newUser && currentUser?.schoolId && currentUser.displayName && currentUser.schoolName) {
            await addActivityService({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'user_registered', // or 'user_created_by_admin'
                message: `${currentUser.displayName} created account for ${displayName} (${role}) in ${currentUser.schoolName}.`,
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
                 await addActivityService({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    type: 'user_approved',
                    message: `${currentUser.displayName} approved ${approvedUser.displayName} (${approvedUser.role}) for the school.`,
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
    try { return await UserService.updateUserRoleAndSchoolService(userId, data); }
    catch (error) { return false; }
    finally { setLoading(false); }
  };


  // --- Class Management ---
  const createClassInSchool = async (className: string, schoolId: string, teacherId?: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return null; // Teachers might not create classes for now, only admin
    setLoading(true);
    try { 
      const newClassId = await ClassService.createClassService(className, schoolId, teacherId || ''); 
      if (newClassId && currentUser?.schoolId && currentUser.displayName && currentUser.schoolName) {
        await addActivityService({
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
          if (currentUser.schoolId && currentUser.displayName && classDetails.name) {
            await addActivityService({
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
    try { 
      const newMaterialId = await MaterialService.addLearningMaterialService({ ...materialData, teacherId: materialData.teacherId || currentUser.uid }); 
       if (newMaterialId && currentUser?.schoolId && currentUser.displayName) {
            const classInfo = materialData.classId ? await ClassService.getClassDetailsService(materialData.classId, UserService.getUserProfileService) : null;
            const className = classInfo ? ` in class "${classInfo.name}"` : " (general material)";
            await addActivityService({
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
    try { 
        const newAssignmentId = await AssignmentService.createAssignmentService({ ...assignmentData, teacherId: currentUser.uid, schoolId: currentUser.schoolId });
        if (newAssignmentId && currentUser?.schoolId && currentUser.displayName) {
            const classInfo = await ClassService.getClassDetailsService(assignmentData.classId, UserService.getUserProfileService);
            const className = classInfo ? classInfo.name : 'Unknown Class';
            await addActivityService({
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
      if (result && result.submissionId && currentUser && currentUser.schoolId && currentUser.displayName) {
         setCurrentUser(prev => prev ? { ...prev, studentAssignments: { ...prev.studentAssignments, [submissionData.assignmentId]: { status: result.newStatus, grade: result.existingGrade }} } : null);
         const classInfo = assignment.className || 'the class';
         await addActivityService({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: submissionData.classId,
            type: 'submission_received',
            message: `${currentUser.displayName} submitted assignment "${assignment.title}" for ${classInfo}.`,
            link: `/teacher/assignments/${submissionData.assignmentId}` // Link for teacher to view
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
                 await addActivityService({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: submission.classId,
                    type: 'submission_graded',
                    message: `${currentUser.displayName} graded ${student.displayName}'s submission for "${assignment.title}". Grade: ${grade}.`,
                    link: `/student/assignments/${submission.assignmentId}` // Link for student to view
                });
            }

            // Update student's local profile if it's the current user (though unlikely for teacher grading)
            if (currentUser.uid === submission.studentId) {
                 setCurrentUser(prev => prev ? {
                    ...prev,
                    studentAssignments: {
                        ...prev.studentAssignments,
                        [submission.assignmentId]: { status: 'graded', grade }
                    }
                } : null);
            }
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
      if (success && currentUser) {
        // Update local currentUser state to reflect onboarding
        setCurrentUser(prev => prev ? { ...prev, classIds: [classId], subjects: subjectIds } : null);
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
        await addActivityService({
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
    completeStudentOnboarding,
    updateUserDisplayName, updateUserEmail, updateUserPassword,
    getClassesByIds,
    createSubject, getSubjectsBySchool: SubjectService.getSubjectsBySchoolService, updateSubject: SubjectService.updateSubjectService, deleteSubject: SubjectService.deleteSubjectService,
    getActivities: getActivitiesService,
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

