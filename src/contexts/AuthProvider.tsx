
"use client";

import type { ReactNode }from 'react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { doc, getDoc, setDoc, Timestamp, updateDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus, Activity, Subject, ExamPeriod, ExamPeriodWithClassNames, ExamResult, ExamResultWithStudentInfo, ClassType, Notification, AttendanceRecord, AttendanceStatus, Testimonial, OnboardingSchoolData, OnboardingSubjectData, OnboardingClassData, OnboardingInvitedUserData } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation'; 

import * as SchoolService from '@/services/schoolService';
import * as UserService from '@/services/userService';
import * as ClassService from '@/services/classService';
import * as MaterialService from '@/services/learningMaterialService';
import * as AssignmentService from '@/services/assignmentService';
import * as SubmissionService from '@/services/submissionService';
import * as SubjectService from '@/services/subjectService';
import * as ActivityService from '@/services/activityService';
import * as ExamService from '@/services/examService';
import * as NotificationService from '@/services/notificationService';
import * as AttendanceService from '@/services/attendanceService';
import * as TestimonialService from '@/services/testimonialService';
import { uploadFileToCloudinaryService } from '@/services/fileUploadService';
import { AuthContext, type AuthContextType } from './AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authProcessLoading, setAuthProcessLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthProcessLoading(true);
      if (user) {
        const userProfile = await UserService.getUserProfileService(user.uid);
        if (userProfile) {
          setCurrentUser({
            ...user, // from Firebase Auth
            ...userProfile, // from Firestore
            uid: user.uid, // Ensure uid is correctly from Firebase Auth user
          });
        } else {
          console.error(`User ${user.uid} authenticated but no Firestore profile. Forcing logout.`);
          await firebaseSignOut(auth); 
        }
      } else {
        setCurrentUser(null);
      }
      setAuthProcessLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addActivity = useCallback(async (activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<string | null> => {
    return ActivityService.addActivityService(activityData);
  }, []);

  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<string | null> => {
    const notificationId = await NotificationService.addNotificationService(notificationData);
    return notificationId;
  }, []);

  const signUp = useCallback(async (
    email: string,
    pass: string,
    role: UserRole,
    displayName: string,
    schoolIdToJoin?: string,
    schoolNameParam?: string,
    childStudentId?: string
  ): Promise<UserProfile | null> => {
    setAuthProcessLoading(true);
    try {
      let finalSchoolId = schoolIdToJoin;
      let finalSchoolName = schoolNameParam;
      let finalStatus: UserStatus = 'active';
      let finalOnboardingStep: number | null = null;

      if (role === 'parent') {
        if (!childStudentId) {
          throw new Error("Child's Student ID is required for parent registration.");
        }
        const childProfile = await UserService.getUserProfileService(childStudentId);
        if (!childProfile || childProfile.role !== 'student' || !childProfile.schoolId) {
          throw new Error("Invalid Child's Student ID or child is not an active student in a school.");
        }
        finalSchoolId = childProfile.schoolId;
        finalSchoolName = childProfile.schoolName;
        finalStatus = 'active'; 
      } else if ((role === 'teacher' || role === 'student') && schoolIdToJoin) {
        finalStatus = 'pending_verification';
      } else if (role === 'admin' && !schoolIdToJoin) {
        finalOnboardingStep = 0; 
        finalSchoolId = undefined; 
        finalSchoolName = undefined; 
      }


      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) {
        setAuthProcessLoading(false);
        return null;
      }

      await updateFirebaseProfile(firebaseUser, { displayName });
      
      // Directly call the service function which now initializes isAdminAlso
      const profileFromDb = await UserService.createUserProfileInFirestore(
        firebaseUser,
        role,
        displayName,
        finalSchoolId, 
        finalSchoolName, 
        finalStatus,
        childStudentId,
        finalOnboardingStep
      );
      
      const completeUserProfile: UserProfile = {
        ...firebaseUser, 
        ...profileFromDb, 
        uid: firebaseUser.uid 
      };
      
      setCurrentUser(completeUserProfile); 

      if (completeUserProfile.displayName && completeUserProfile.email) {
         if (completeUserProfile.schoolId && completeUserProfile.schoolName) {
            await addActivity({
                schoolId: completeUserProfile.schoolId,
                actorId: completeUserProfile.uid,
                actorName: completeUserProfile.displayName,
                type: 'user_registered',
                message: `${completeUserProfile.displayName} (${completeUserProfile.role}) registered for ${completeUserProfile.schoolName}.`,
            });
         }
         if (completeUserProfile.status === 'pending_verification' && completeUserProfile.schoolId && completeUserProfile.schoolName) {
            const schoolAdmins = await UserService.getUsersBySchoolAndRoleService(completeUserProfile.schoolId, 'admin');
            for (const admin of schoolAdmins) {
               await addNotification({ 
                  userId: admin.id,
                  schoolId: completeUserProfile.schoolId!,
                  message: `New user ${completeUserProfile.displayName} (${completeUserProfile.role}) requires approval to join ${completeUserProfile.schoolName}.`,
                  type: 'user_profile_updated',
                  link: '/admin/users',
                  actorName: 'System'
              });
            }
         }
      }
      setAuthProcessLoading(false);
      return completeUserProfile;
    } catch (error) {
      console.error("Error signing up:", error);
      setAuthProcessLoading(false);
      throw error;
    }
  }, [setAuthProcessLoading, setCurrentUser, addActivity, addNotification]);

  const logIn = useCallback(async (email: string, pass: string): Promise<UserProfile | null> => {
    setAuthProcessLoading(true);
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
          setCurrentUser(fullProfile);
          setAuthProcessLoading(false);
          return fullProfile;
        } else {
            await firebaseSignOut(auth);
        }
      }
      setAuthProcessLoading(false);
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      setAuthProcessLoading(false);
      throw error;
    }
  }, [setAuthProcessLoading, setCurrentUser]);

  const logOut = useCallback(async () => {
    setAuthProcessLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setAuthProcessLoading(false);
    }
  }, [setAuthProcessLoading, setCurrentUser, router]);

  const updateUserDisplayName = useCallback(async (userId: string, displayName: string): Promise<boolean> => {
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
    }
  }, [currentUser, setCurrentUser]);

  const updateUserEmail = useCallback(async (newEmail: string, currentPassword_not_used: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setAuthProcessLoading(true);
    try {
      await updateFirebaseAuthEmail(auth.currentUser, newEmail);
      const success = await UserService.updateUserEmailInFirestore(auth.currentUser.uid, newEmail);
      if (success && currentUser) {
        setCurrentUser(prev => prev ? { ...prev, email: newEmail } : null);
      }
      return success;
    } catch (error) {
      console.error("Error updating email:", error);
      throw error;
    } finally {
      setAuthProcessLoading(false);
    }
  }, [currentUser, setCurrentUser, setAuthProcessLoading]);

  const updateUserPassword = useCallback(async (newPassword: string, currentPassword_not_used: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setAuthProcessLoading(true);
    try {
      await updateFirebasePassword(auth.currentUser, newPassword);
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    } finally {
      setAuthProcessLoading(false);
    }
  }, [setAuthProcessLoading]);

  const updateUserLastTestimonialSurveyAt = useCallback(async (userId: string): Promise<boolean> => {
    const success = await UserService.updateUserLastTestimonialSurveyAtService(userId);
    if (success && currentUser?.uid === userId) {
      setCurrentUser(prev => prev ? { ...prev, lastTestimonialSurveyAt: Timestamp.now() } : null);
    }
    return success;
  }, [currentUser, setCurrentUser]);

  const updateAdminOnboardingStep = useCallback(async (userId: string, step: number | null): Promise<boolean> => {
      if (!currentUser || currentUser.uid !== userId || currentUser.role !== 'admin') return false;
      const success = await UserService.updateUserRoleAndSchoolService(userId, { onboardingStep: step });
      if (success) {
        setCurrentUser(prev => prev ? { ...prev, onboardingStep: step } : null);
        if (currentUser.schoolId && currentUser.displayName) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'school_onboarding_step',
                message: `Admin ${currentUser.displayName} completed onboarding step (New step: ${step === null ? 'Finished' : step}).`,
            });
        }
      }
      return success;
  }, [currentUser, setCurrentUser, addActivity]);

  const onboardingCreateSchool = useCallback(async (
    schoolDetails: OnboardingSchoolData,
    adminId: string,
  ): Promise<{ schoolId: string; inviteCode: string } | null> => {
    if (!currentUser || currentUser.uid !== adminId || currentUser.role !== 'admin') return null;
    setAuthProcessLoading(true);
    try {
      const schoolCreationResult = await SchoolService.onboardingCreateSchoolService(adminId, schoolDetails);
      if (!schoolCreationResult) {
          throw new Error("School document creation failed in service.");
      }
      const { schoolId, inviteCode } = schoolCreationResult;

      const userUpdateSuccess = await UserService.updateUserRoleAndSchoolService(adminId, { 
          schoolId: schoolId, 
          schoolName: schoolDetails.schoolName,
          onboardingStep: 1 
      });

      if (!userUpdateSuccess) {
          console.error(`CRITICAL: School ${schoolId} created but failed to link to admin ${adminId} or update onboarding step.`);
          await SchoolService.deleteSchoolService(schoolId); 
          throw new Error("Failed to update admin user profile after school creation. School creation rolled back.");
      }
      
      setCurrentUser(prev => {
        if (!prev) return null;
        return { 
            ...prev, 
            schoolId: schoolId, 
            schoolName: schoolDetails.schoolName, 
            onboardingStep: 1 
        };
      });
            
      if (currentUser.displayName) {
          await addActivity({
              schoolId: schoolId, 
              actorId: adminId,
              actorName: currentUser.displayName,
              type: 'school_onboarding_step',
              message: `Admin ${currentUser.displayName} created school "${schoolDetails.schoolName}" (Step 1 Complete). Invite Code: ${inviteCode}.`,
          });
      }
      return { schoolId, inviteCode };
    } catch (error) {
      console.error("Error in AuthProvider onboardingCreateSchool:", error);
      toast({ title: "Error Creating School", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive"});
      return null;
    } finally {
      setAuthProcessLoading(false);
    }
  }, [currentUser, setCurrentUser, addActivity, toast]);

  const onboardingAddSubjects = useCallback(async (schoolId: string, subjects: OnboardingSubjectData[]): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    const schoolDoc = await SchoolService.getSchoolDetailsService(schoolId);
    if (!schoolDoc || schoolDoc.adminId !== currentUser.uid) return false; 

    const success = await SubjectService.onboardingAddSubjectsService(schoolId, subjects);
    if (success) {
      await updateAdminOnboardingStep(currentUser.uid, 2);
      await addActivity({
        schoolId: schoolId,
        actorId: currentUser.uid,
        actorName: currentUser.displayName || 'Admin',
        type: 'school_onboarding_step',
        message: `Admin added ${subjects.length} subjects to "${schoolDoc.name}" (Step 2 Complete).`,
      });
    }
    return success;
  }, [currentUser, updateAdminOnboardingStep, addActivity]);

  const onboardingCreateClasses = useCallback(async (schoolId: string, classesData: OnboardingClassData[]): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    const schoolDoc = await SchoolService.getSchoolDetailsService(schoolId);
    if (!schoolDoc || schoolDoc.adminId !== currentUser.uid) return false;

    const success = await ClassService.onboardingCreateClassesService(schoolId, classesData);
    if (success) {
      await updateAdminOnboardingStep(currentUser.uid, 3);
      await addActivity({
        schoolId: schoolId,
        actorId: currentUser.uid,
        actorName: currentUser.displayName || 'Admin',
        type: 'school_onboarding_step',
        message: `Admin created ${classesData.length} classes for "${schoolDoc.name}" (Step 3 Complete).`,
      });
    }
    return success;
  }, [currentUser, updateAdminOnboardingStep, addActivity]);

  const onboardingInviteUsers = useCallback(async (schoolId: string, schoolName: string, users: OnboardingInvitedUserData[]): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    const schoolDoc = await SchoolService.getSchoolDetailsService(schoolId);
    if (!schoolDoc || schoolDoc.adminId !== currentUser.uid) return false;

    const success = await UserService.onboardingInviteUsersService(auth, schoolId, schoolName, users);
    if (success) {
      await updateAdminOnboardingStep(currentUser.uid, 4);
      await addActivity({
        schoolId: schoolId,
        actorId: currentUser.uid,
        actorName: currentUser.displayName || 'Admin',
        type: 'school_onboarding_step',
        message: `Admin invited ${users.length} users to "${schoolName}" (Step 4 Complete). Users set to 'pending verification'.`,
      });
    }
    return success;
  }, [currentUser, updateAdminOnboardingStep, addActivity]);

  const onboardingCompleteSchoolSetup = useCallback(async (schoolId: string, isExamModeActive: boolean): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    const schoolDoc = await SchoolService.getSchoolDetailsService(schoolId);
    if (!schoolDoc || schoolDoc.adminId !== currentUser.uid) return false;

    const success = await SchoolService.updateSchoolDetailsService(schoolId, { setupComplete: true, isExamModeActive });
    if (success) {
      await updateAdminOnboardingStep(currentUser.uid, null); 
      await addActivity({
        schoolId: schoolId,
        actorId: currentUser.uid,
        actorName: currentUser.displayName || 'Admin',
        type: 'school_onboarding_step',
        message: `Admin completed school setup for "${schoolDoc.name}". Exam mode: ${isExamModeActive ? 'ON' : 'OFF'}.`,
      });
    }
    return success;
  }, [currentUser, updateAdminOnboardingStep, addActivity]);


  const createSchool = useCallback(async (schoolName: string, adminId: string): Promise<string | null> => {
    try {
      const schoolId = await SchoolService.createSchoolService(schoolName, adminId);
      if (schoolId && currentUser && currentUser.uid === adminId) {
        await UserService.updateUserRoleAndSchoolService(adminId, { schoolId, schoolName, onboardingStep: null, status: 'active' });
        setCurrentUser(prev => prev ? ({ ...prev, schoolId, schoolName, status: 'active', onboardingStep: null }) : null);
      }
      return schoolId;
    } catch (error) { return null; }
  }, [currentUser, setCurrentUser]);

  const joinSchoolWithInviteCode = useCallback(async (inviteCode: string, userId: string): Promise<boolean> => {
    try {
      const schoolData = await SchoolService.joinSchoolWithInviteCodeService(inviteCode, userId);
      if (schoolData && currentUser && currentUser.uid === userId) {
        await UserService.updateUserRoleAndSchoolService(userId, { 
            schoolId: schoolData.id, 
            schoolName: schoolData.name, 
            status: 'active',
            onboardingStep: null 
        });
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolData.id, schoolName: schoolData.name, status: 'active', onboardingStep: null }) : null);
      }
      return !!schoolData;
    } catch (error) { return false; }
  }, [currentUser, setCurrentUser]);

  const checkAdminOnboardingStatus = useCallback(async (): Promise<{ isOnboarded: boolean; schoolId?: string, onboardingStep?: number | null }> => {
    if (!currentUser || currentUser.role !== 'admin') return { isOnboarded: false, onboardingStep: null };
    const isOnboarded = !!currentUser.schoolId && (currentUser.onboardingStep === null || currentUser.onboardingStep === undefined); 
    return { isOnboarded, schoolId: currentUser.schoolId, onboardingStep: currentUser.onboardingStep };
  }, [currentUser]);

  const updateSchoolDetails = useCallback(async (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive' | 'setupComplete' | 'schoolType' | 'country' | 'phoneNumber'>>): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    const school = await SchoolService.getSchoolDetailsService(schoolId);
    if (!school || school.adminId !== currentUser.uid) return false; 

    try {
        const success = await SchoolService.updateSchoolDetailsService(schoolId, data);
        if (success && currentUser?.schoolId && currentUser.displayName && school) {
            let message = `${currentUser.displayName} updated school settings for "${school.name}".`;
            if (data.name && school.name !== data.name) {
                message = `${currentUser.displayName} updated school name to "${data.name}".`;
                if (currentUser.uid === school.adminId) { 
                    setCurrentUser(prev => prev ? { ...prev, schoolName: data.name } : null);
                    await UserService.updateUserRoleAndSchoolService(currentUser.uid, { schoolName: data.name });
                }
            }
            if (data.isExamModeActive !== undefined && school.isExamModeActive !== data.isExamModeActive) {
                 message = `${currentUser.displayName} ${data.isExamModeActive ? 'activated' : 'deactivated'} exam mode for "${school.name}".`
            }
            if (data.setupComplete && school.setupComplete !== data.setupComplete) {
                 message = `${currentUser.displayName} marked school setup as ${data.setupComplete ? 'complete' : 'incomplete'} for "${school.name}".`
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
  }, [currentUser, setCurrentUser, addActivity]);

  const regenerateInviteCode = useCallback(async (schoolId: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return null;
    const school = await SchoolService.getSchoolDetailsService(schoolId);
    if (!school || school.adminId !== currentUser.uid) return null;
    try {
        const newCode = await SchoolService.regenerateInviteCodeService(schoolId);
        if (newCode && currentUser?.schoolId && currentUser.displayName) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'invite_code_regenerated',
                message: `${currentUser.displayName} regenerated the school invite code for "${school.name}".`,
                link: '/admin/settings'
            });
        }
        return newCode;
    } catch(error) { return null; }
  }, [currentUser, addActivity]);

  const adminCreateUserInSchool = useCallback(async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
    try {
       const schoolDoc = await SchoolService.getSchoolDetailsService(schoolId);
       if (!schoolDoc) throw new Error("School not found");
       // Directly call the service function which now initializes isAdminAlso
       const newUser = await UserService.adminCreateUserService(auth, email, pass, displayName, role, schoolId, schoolDoc.name);
       if (newUser && currentUser?.schoolId && currentUser.displayName && schoolDoc.name && newUser.email) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'user_registered',
                message: `${currentUser.displayName} created account for ${displayName} (${role}) in ${schoolDoc.name}.`,
                targetUserId: newUser.id,
                targetUserName: displayName,
                link: `/admin/users/${newUser.id}/edit`
            });
            await addNotification({
                userId: newUser.id,
                schoolId: schoolId,
                message: `Welcome to ${schoolDoc.name}! Your account has been created by an admin.`,
                type: 'user_registered',
                actorName: currentUser.displayName,
            });
        }
       return newUser;
    } catch (error: any) {
      console.error("Error creating user by admin in AuthContext:", error);
      throw error;
    }
  }, [currentUser, addActivity, addNotification]);

  const approveUserForSchool = useCallback(async (userId: string, schoolId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    try {
        const success = await UserService.approveUserService(userId, schoolId);
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const approvedUser = await UserService.getUserProfileService(userId);
            if (approvedUser && approvedUser.email) {
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
                await addNotification({
                    userId: approvedUser.id,
                    schoolId: schoolId,
                    message: `Your account for ${approvedUser.schoolName} has been approved! You can now log in.`,
                    type: 'user_approved',
                    actorName: currentUser.displayName,
                    link: approvedUser.role === 'student' ? '/student/dashboard' : (approvedUser.role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard')
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
  }, [currentUser, addActivity, addNotification]);

  const updateUserRoleAndSchool = useCallback(async (userId: string, data: { role?: UserRole; schoolId?: string, schoolName?: string, classIds?: string[], status?: UserStatus, subjects?: string[], onboardingStep?: number | null, isAdminAlso?: boolean }): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin') return false;
    try {
        const success = await UserService.updateUserRoleAndSchoolService(userId, data);
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const targetUser = await UserService.getUserProfileService(userId);
            if (targetUser && targetUser.email) {
                let activityMessage = `${currentUser.displayName} updated profile for ${targetUser.displayName}.`;
                let emailSubject = "Learnify: Your Account Details Updated";

                if (data.status === 'rejected') {
                    activityMessage = `${currentUser.displayName} rejected user request for ${targetUser.displayName}.`;
                    emailSubject = `Account Request for ${targetUser.schoolName} Rejected`;
                } else if (data.role) {
                    activityMessage = `${currentUser.displayName} updated ${targetUser.displayName}'s role to ${data.role}.`;
                } else if (data.isAdminAlso !== undefined) {
                    activityMessage = `${currentUser.displayName} ${data.isAdminAlso ? 'granted' : 'revoked'} admin privileges for teacher ${targetUser.displayName}.`;
                }
                await addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    type: 'user_profile_updated',
                    message: activityMessage,
                    targetUserId: targetUser.id,
                    targetUserName: targetUser.displayName,
                    link: `/admin/users/${targetUser.id}/edit`
                });
                await addNotification({
                    userId: targetUser.id,
                    schoolId: targetUser.schoolId!,
                    message: emailSubject,
                    type: 'user_profile_updated',
                    actorName: currentUser.displayName
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
  }, [currentUser, addActivity, addNotification]);

  const createClassInSchool = useCallback(async (className: string, schoolId: string, classType: ClassType, teacherId?: string, compulsorySubjectIds?: string[], subjectId?: string | null): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin')) return null;
    const schoolDoc = await SchoolService.getSchoolDetailsService(schoolId);
    if (!schoolDoc || (currentUser.role === 'admin' && schoolDoc.adminId !== currentUser.uid)) return null; 

    try {
      const newClassId = await ClassService.createClassService(className, schoolId, teacherId || '', classType, compulsorySubjectIds, subjectId);
      if (newClassId && currentUser?.schoolId && currentUser.displayName && schoolDoc.name) {
        await addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'class_created',
          message: `${currentUser.displayName} created class "${className}" in ${schoolDoc.name}.`,
          link: `/admin/classes`
        });
      }
      return newClassId;
    }
    catch (error) { return null; }
  }, [currentUser, addActivity]);

  const enrollStudentInClass = useCallback(async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    try {
      const success = await ClassService.enrollStudentInClassService(classId, studentId);
      if (success && currentUser?.schoolId && currentUser.displayName) {
        const student = await UserService.getUserProfileService(studentId);
        const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
        if (student && cls && student.email) {
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
            await addNotification({
                userId: studentId,
                schoolId: currentUser.schoolId,
                message: `You have been enrolled in class "${cls.name}" by ${currentUser.displayName}.`,
                type: 'student_joined_class',
                link: `/student/classes/${classId}`,
                actorName: currentUser.displayName
            });
        }
      }
      return success;
    }
    catch (error) { return false; }
  }, [currentUser, addActivity, addNotification]);

  const removeStudentFromClass = useCallback(async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    try {
        const success = await ClassService.removeStudentFromClassService(classId, studentId);
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const student = await UserService.getUserProfileService(studentId);
            const cls = await ClassService.getClassDetailsService(classId, UserService.getUserProfileService);
            if (student && cls && student.email) {
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
                await addNotification({
                    userId: studentId,
                    schoolId: currentUser.schoolId,
                    message: `You have been removed from class "${cls.name}" by ${currentUser.displayName}.`,
                    type: 'student_removed_from_class',
                    actorName: currentUser.displayName
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
  }, [currentUser, addActivity, addNotification]);

  const deleteClass = useCallback(async (classId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId) return false;
    const schoolDoc = await SchoolService.getSchoolDetailsService(currentUser.schoolId);
    if (!schoolDoc || schoolDoc.adminId !== currentUser.uid) return false; 
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
  }, [currentUser, addActivity]);

  const regenerateClassInviteCode = useCallback(async (classId: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return null;
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
                    link: `/admin/classes` 
                });
            }
        }
        return newCode;
    }
    catch (error) { return null; }
  }, [currentUser, addActivity]);

  const joinClassWithCode = useCallback(async (classCode: string, studentId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'student' || currentUser.uid !== studentId) return false;
    try {
      const success = await ClassService.joinClassWithCodeService(classCode, studentId);
      if (success && currentUser && currentUser.schoolId && currentUser.displayName) {
        const classDetails = await ClassService.getClassByInviteCodeService(classCode);
        if (classDetails) {
          setCurrentUser(prev => prev ? ({ ...prev, classIds: Array.from(new Set([...(prev.classIds || []), classDetails.id])) }) : null);
          await addActivity({
              schoolId: currentUser.schoolId,
              actorId: currentUser.uid,
              actorName: currentUser.displayName,
              classId: classDetails.id,
              type: 'student_joined_class',
              message: `${currentUser.displayName} joined class "${classDetails.name}".`,
              link: `/student/classes/${classDetails.id}`
          });
          if (classDetails.teacherId) {
            await addNotification({
                userId: classDetails.teacherId,
                schoolId: currentUser.schoolId,
                message: `${currentUser.displayName} joined your class "${classDetails.name}" using an invite code.`,
                type: 'student_joined_class',
                link: `/teacher/classes/${classDetails.id}`,
                actorName: currentUser.displayName
            });
          }
        }
      }
      return success;
    } catch (error) { return false; }
  }, [currentUser, setCurrentUser, addActivity, addNotification]);

  const updateClassDetails = useCallback(async (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId' | 'classInviteCode' | 'classType' | 'compulsorySubjectIds' | 'subjectId'>>): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId) return false;
    const schoolDoc = await SchoolService.getSchoolDetailsService(currentUser.schoolId);
    if (!schoolDoc || schoolDoc.adminId !== currentUser.uid) return false; 
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
  }, [currentUser, addActivity]);

  const getClassesBySchool = useCallback(async (schoolId: string) => ClassService.getClassesBySchoolService(schoolId, UserService.getUserProfileService), []);
  const getClassesByIds = useCallback(async (classIds: string[]) => ClassService.getClassesByIdsService(classIds, UserService.getUserProfileService, AssignmentService.getAssignmentsByClassService), []);
  const getClassDetails = useCallback(async (classId: string) => ClassService.getClassDetailsService(classId, UserService.getUserProfileService), []);
  const getStudentsInClass = useCallback(async (classId: string) => ClassService.getStudentsInClassService(classId, UserService.getUserProfileService), []);
  const getStudentsNotInClass = useCallback(async (schoolId: string, classId: string) => ClassService.getStudentsNotInClassService(schoolId, classId, UserService.getUsersBySchoolAndRoleService, ClassService.getStudentsInClassService, UserService.getUserProfileService), []);
  const getClassesByTeacher = useCallback(async (teacherId: string) => ClassService.getClassesByTeacherService(teacherId), []);
  const getStudentsInMultipleClasses = useCallback(async (classIds: string[]) => ClassService.getStudentsInMultipleClassesService(classIds), []);

  const addLearningMaterial = useCallback(async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'originalFileName'>, file?: File | null): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId ) return null;
    let attachmentUrl: string | null = null;
    let finalContent = materialData.content;
    let originalFileNameForMaterial: string | null = null;

    try {
      if (file && materialData.materialType === 'pdf_upload') {
        const uploadResult = await uploadFileToCloudinaryService(file);
        if (!uploadResult.url) {
            throw new Error("Cloudinary file upload failed for material.");
        }
        attachmentUrl = uploadResult.url;
        originalFileNameForMaterial = uploadResult.originalFileName;
        finalContent = `[Uploaded File: ${originalFileNameForMaterial || file.name}]`;
      }

      const dataToSave: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'> = {
        ...materialData,
        content: finalContent,
        attachmentUrl: attachmentUrl,
        originalFileName: originalFileNameForMaterial,
        teacherId: materialData.teacherId || currentUser.uid,
      };

      const newMaterialId = await MaterialService.addLearningMaterialService(dataToSave);
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
            if (materialData.classId && classInfo) {
                const students = await ClassService.getStudentsInClassService(materialData.classId, UserService.getUserProfileService);
                for (const student of students) {
                  await addNotification({
                      userId: student.id,
                      schoolId: currentUser.schoolId!,
                      message: `New material "${materialData.title}" added to class "${classInfo.name}".`,
                      type: 'material_uploaded',
                      link: `/student/classes/${materialData.classId}`,
                      actorName: currentUser.displayName
                  });
                }
            }
        }
      return newMaterialId;
    }
    catch (error) {
        console.error("Error adding learning material (AuthProvider):", error);
        return null;
    }
  }, [currentUser, addActivity, addNotification]);

  const deleteLearningMaterial = useCallback(async (materialId: string, materialTitle: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
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
  }, [currentUser, addActivity]);

  const updateLearningMaterial = useCallback(async (
    materialId: string,
    data: Partial<Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId' | 'attachmentUrl' | 'originalFileName'>>,
    file?: File | null,
    existingAttachmentUrlForLogic?: string | null
  ): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId ) return false;

    let finalAttachmentUrl = existingAttachmentUrlForLogic || null;
    let finalContent = data.content;
    let originalFileNameForUpdate: string | null = null;

    try {
      const materialDocBeforeUpdate = await MaterialService.getLearningMaterialByIdService(materialId);
      if (!materialDocBeforeUpdate) {
        console.error("Material not found for update");
        return false;
      }
      originalFileNameForUpdate = materialDocBeforeUpdate.originalFileName || null; 

      if (file && data.materialType === 'pdf_upload') {
        const uploadResult = await uploadFileToCloudinaryService(file);
        if (uploadResult.url) {
          finalAttachmentUrl = uploadResult.url;
          originalFileNameForUpdate = uploadResult.originalFileName;
          finalContent = `[Uploaded File: ${originalFileNameForUpdate || file.name}]`;
        } else {
          console.error("Cloudinary material attachment upload failed during update.");
          return false;
        }
      } else if (data.materialType && data.materialType !== 'pdf_upload' && materialDocBeforeUpdate.materialType === 'pdf_upload') {
        finalAttachmentUrl = null;
        originalFileNameForUpdate = null;
      }

      const updatePayload: Partial<Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId'>> = {
        ...data,
        content: finalContent,
        attachmentUrl: finalAttachmentUrl,
        originalFileName: originalFileNameForUpdate,
      };

      const success = await MaterialService.updateLearningMaterialService(materialId, updatePayload);
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
    } catch (error) {
        console.error("Error updating learning material in AuthContext:", error);
        return false;
    }
  }, [currentUser, addActivity]);

  const getLearningMaterialsByTeacher = useCallback(async (teacherId: string, classId?: string) => MaterialService.getLearningMaterialsByTeacherService(teacherId, classId), []);
  const getLearningMaterialsBySchool = useCallback(async (schoolId: string) => MaterialService.getLearningMaterialsBySchoolService(schoolId, UserService.getUserProfileService, ClassService.getClassDetailsService), []);
  const getLearningMaterialsByClass = useCallback(async (classId: string) => MaterialService.getLearningMaterialsByClassService(classId), []);
  const getLearningMaterialById = useCallback(async (materialId: string) => MaterialService.getLearningMaterialByIdService(materialId), []);

  const createAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions' | 'attachmentUrl' | 'originalFileName'>, file?: File | null): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId) return null;

    const dataToSave = {
      ...assignmentData,
      teacherId: currentUser.uid,
      schoolId: currentUser.schoolId,
      attachmentUrl: null, 
      originalFileName: null, 
    };

    try {
      const newAssignmentId = await AssignmentService.createAssignmentService(dataToSave);
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
          const students = await ClassService.getStudentsInClassService(assignmentData.classId, UserService.getUserProfileService);
          for (const student of students) {
            await addNotification({
                userId: student.id,
                schoolId: currentUser.schoolId!,
                message: `New assignment "${assignmentData.title}" posted for class "${className}". Deadline: ${format(assignmentData.deadline, 'PP')}`,
                type: 'assignment_created',
                link: `/student/assignments/${newAssignmentId}`,
                actorName: currentUser.displayName
            });
          }
      }
      return newAssignmentId;
    } catch (error) {
        console.error("Error creating assignment in AuthContext:", error);
        return null;
    }
  }, [currentUser, addActivity, addNotification]);

  const getAssignmentById = useCallback(async (assignmentId: string, studentId?: string): Promise<AssignmentWithClassAndSubmissionInfo | null> => {
    try {
      const assignment = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
      if (!assignment) return null;

      if (studentId) {
        const submission = await SubmissionService.getSubmissionByStudentForAssignmentService(assignmentId, studentId);
        if (submission) {
          assignment.submissionStatus = submission.status;
          assignment.submissionGrade = submission.grade;
        } else if (currentUser?.studentAssignments?.[assignment.id]) {
          assignment.submissionStatus = currentUser.studentAssignments[assignmentId].status;
          assignment.submissionGrade = currentUser.studentAssignments[assignmentId].grade;
        } else {
          assignment.submissionStatus = 'missing';
        }
      }
      return assignment;
    } catch (error) { return null; }
  }, [currentUser]);

  const deleteAssignment = useCallback(async (assignmentId: string, assignmentTitle: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId) return false;
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
  }, [currentUser, addActivity]);

  const updateAssignment = useCallback(async (
    assignmentId: string,
    assignmentTitle: string,
    data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions' | 'schoolId' | 'attachmentUrl' | 'originalFileName'>>,
    file?: File | null, 
    existingAttachmentUrlForLogic?: string | null
  ): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId) return false;

    try {
      const assignmentDocBeforeUpdate = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
      if (!assignmentDocBeforeUpdate) {
        console.error("Assignment not found for update in AuthProvider");
        return false;
      }
      
      const updatePayload: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId'>> = {
        ...data,
        attachmentUrl: null, 
        originalFileName: null, 
      };

      const success = await AssignmentService.updateAssignmentService(assignmentId, updatePayload);

      if (success && currentUser?.schoolId && currentUser.displayName) {
        const updatedAssignmentDoc = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
        if (updatedAssignmentDoc) {
          await addActivity({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: updatedAssignmentDoc.classId,
            type: 'assignment_updated',
            message: `${currentUser.displayName} updated assignment "${data.title || assignmentTitle}".`,
            link: `/teacher/assignments/${assignmentId}`
          });
          const students = await ClassService.getStudentsInClassService(updatedAssignmentDoc.classId, UserService.getUserProfileService);
          for (const student of students) {
             await addNotification({
                userId: student.id,
                schoolId: currentUser.schoolId!,
                message: `Assignment "${data.title || assignmentTitle}" in class "${updatedAssignmentDoc.className}" has been updated.`,
                type: 'assignment_updated',
                link: `/student/assignments/${assignmentId}`,
                actorName: currentUser.displayName
            });
          }
        }
      }
      return success;
    } catch (error) {
      console.error("Error updating assignment in AuthContext:", error);
      return false;
    }
  }, [currentUser, addActivity, addNotification]);

  const getAssignmentsByTeacher = useCallback(async (teacherId: string, classId?: string) => AssignmentService.getAssignmentsByTeacherService(teacherId, ClassService.getClassDetailsService, classId), []);
  const getAssignmentsByClass = useCallback(async (classId: string) => AssignmentService.getAssignmentsByClassService(classId), []);

  const fetchSubmissionsForAssignment = useCallback(async (assignmentId: string): Promise<SubmissionWithStudentName[]> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return [];
    return SubmissionService.getSubmissionsForAssignmentService(assignmentId, UserService.getUserProfileService);
  }, [currentUser]);

  const gradeSubmission = useCallback(async (submissionId: string, grade: string | number, feedback?: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId) return false;
    try {
      const success = await SubmissionService.gradeSubmissionService(submissionId, grade, feedback);
      if (success && currentUser && currentUser.schoolId && currentUser.displayName) {
        const submission = await SubmissionService.getSubmissionByIdService(submissionId);
        if (submission) {
            const assignment = await AssignmentService.getAssignmentByIdService(submission.assignmentId, ClassService.getClassDetailsService);
            const student = await UserService.getUserProfileService(submission.studentId);
            if (assignment && student && student.email) {
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
                await addNotification({
                    userId: student.id,
                    schoolId: currentUser.schoolId,
                    message: `Your submission for assignment "${assignment.title}" has been graded. Grade: ${grade}.`,
                    type: 'submission_graded',
                    link: `/student/assignments/${submission.assignmentId}`,
                    actorName: currentUser.displayName
                });
            }
        }
      }
      return success;
    } catch (error) { return false; }
  }, [currentUser, addActivity, addNotification]);

  const addSubmission = useCallback(async (
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status' | 'updatedAt' | 'originalFileName'>,
    file?: File | null
  ): Promise<{ submissionId: string, newStatus: Submission['status'], existingGrade?: string | number } | null> => {
    if (!currentUser?.uid || !currentUser.schoolId) return null;

    let finalContent = submissionData.content;
    let submissionOriginalFileName: string | null = null;

    try {
      if (file && submissionData.submissionType === 'file_upload') {
        const uploadResult = await uploadFileToCloudinaryService(file);
        if (!uploadResult.url) {
          throw new Error("Cloudinary submission file upload failed.");
        }
        finalContent = uploadResult.url;
        submissionOriginalFileName = uploadResult.originalFileName;
      }

      const assignment = await AssignmentService.getAssignmentByIdService(submissionData.assignmentId, ClassService.getClassDetailsService);
      if (!assignment) throw new Error("Assignment not found for submission.");

      const submissionPayload = {
        ...submissionData,
        content: finalContent,
        originalFileName: submissionOriginalFileName || undefined,
      };

      const result = await SubmissionService.addSubmissionService(submissionPayload, currentUser.uid, assignment.deadline);

      if (result && currentUser.displayName) {
        await addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          classId: submissionData.classId,
          type: 'submission_received',
          message: `${currentUser.displayName} submitted work for assignment "${assignment.title}".`,
          link: `/teacher/assignments/${submissionData.assignmentId}`
        });
        setCurrentUser(prev => {
            if (!prev) return null;
            const updatedAssignments = {
                ...(prev.studentAssignments || {}),
                [submissionData.assignmentId]: {
                    status: result.newStatus,
                    grade: result.existingGrade,
                }
            };
            return {...prev, studentAssignments: updatedAssignments };
        });
        if (assignment.teacherId) {
            await addNotification({
                userId: assignment.teacherId,
                schoolId: currentUser.schoolId,
                message: `${currentUser.displayName} submitted work for your assignment "${assignment.title}".`,
                type: 'submission_received',
                link: `/teacher/assignments/${submissionData.assignmentId}`,
                actorName: currentUser.displayName
            });
        }
      }
      return result?.submissionId ? { submissionId: result.submissionId, newStatus: result.newStatus, existingGrade: result.existingGrade } : null;
    } catch (error) {
      console.error("Error in AuthContext addSubmission:", error);
      return null;
    }
  }, [currentUser, addActivity, setCurrentUser, addNotification]);

  const getAssignmentsForStudentByClass = useCallback(async (classId: string, studentId: string): Promise<AssignmentWithClassAndSubmissionInfo[]> => {
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'teacher' && currentUser.role !== 'admin' && currentUser.role !== 'parent')) return [];
    if ((currentUser.role === 'student' && currentUser.uid !== studentId) || (currentUser.role === 'parent' && currentUser.childStudentId !== studentId)) return [];
    try {
        const studentProfile = await UserService.getUserProfileService(studentId);
        return await AssignmentService.getAssignmentsForStudentByClassService(classId, studentId, SubmissionService.getSubmissionByStudentForAssignmentService, ClassService.getClassDetailsService, studentProfile);
    } catch (error) { return []; }
  }, [currentUser]);

  const completeStudentOnboarding = useCallback(async (userId: string, classIds: string[], subjectIds: string[]): Promise<boolean> => {
    if (!currentUser || currentUser.uid !== userId || currentUser.role !== 'student') return false;
    try {
      const success = await UserService.completeStudentOnboardingService(userId, classIds, subjectIds);
      if (success && currentUser?.schoolId && currentUser.displayName) {
        setCurrentUser(prev => prev ? ({ ...prev, classIds, subjects: subjectIds }) : null);
         const mainClassId = classIds[0]; 
         const cls = await ClassService.getClassDetailsService(mainClassId, UserService.getUserProfileService);
         await addActivity({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: mainClassId,
            type: 'student_onboarded',
            message: `${currentUser.displayName} completed onboarding and joined class "${cls?.name || 'N/A'}".`,
            link: `/student/dashboard`
        });
        if (cls?.teacherId) {
            await addNotification({
                userId: cls.teacherId,
                schoolId: currentUser.schoolId,
                message: `${currentUser.displayName} completed onboarding for your class "${cls.name}".`,
                type: 'student_onboarded',
                link: `/teacher/classes/${cls.id}`,
                actorName: currentUser.displayName
            });
        }
      }
      return success;
    } catch (error) {
      console.error("Error completing student onboarding in AuthContext:", error);
      return false;
    }
  }, [currentUser, setCurrentUser, addActivity, addNotification]);

  const createSubject = useCallback(async (schoolId: string, subjectName: string, isCompulsory?: boolean): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return null;
    const school = await SchoolService.getSchoolDetailsService(schoolId);
    if (!school || school.adminId !== currentUser.uid) return null;
    try {
      const newSubjectId = await SubjectService.createSubjectService(schoolId, subjectName, isCompulsory);
      if (newSubjectId && currentUser?.schoolId && currentUser.displayName && school.name) {
        await addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'subject_created',
          message: `${currentUser.displayName} created subject "${subjectName}" for ${school.name}.`,
          link: `/admin/school-settings/subjects`
        });
      }
      return newSubjectId;
    }
    catch (error) { return null; }
  }, [currentUser, addActivity]);

  const updateSubject = useCallback(async (subjectId: string, newName: string, isCompulsory?: boolean): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId) return false;
    const subject = await SubjectService.getSubjectByIdService(subjectId);
    if (!subject || subject.schoolId !== currentUser.schoolId) return false;
    const school = await SchoolService.getSchoolDetailsService(currentUser.schoolId);
    if (!school || school.adminId !== currentUser.uid) return false;

    try {
        const success = await SubjectService.updateSubjectService(subjectId, newName, isCompulsory);
        if (success && currentUser?.schoolId && currentUser.displayName && subject) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'subject_updated',
                message: `${currentUser.displayName} updated subject "${subject.name}" to "${newName}".`,
                link: `/admin/school-settings/subjects`
            });
        }
        return success;
    } catch (error) { return false; }
  }, [currentUser, addActivity]);

  const deleteSubject = useCallback(async (subjectId: string, subjectName: string): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId) return false;
     const subject = await SubjectService.getSubjectByIdService(subjectId);
     if (!subject || subject.schoolId !== currentUser.schoolId) return false;
     const school = await SchoolService.getSchoolDetailsService(currentUser.schoolId);
     if (!school || school.adminId !== currentUser.uid) return false;

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
  }, [currentUser, addActivity]);

  const linkChildAccount = useCallback(async (studentIdToLink: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'parent') {
      toast({ title: "Unauthorized", description: "Only parents can link child accounts.", variant: "destructive" });
      return false;
    }
    if (!studentIdToLink.trim()) {
        toast({ title: "Student ID Required", description: "Please enter your child's Student ID.", variant: "destructive" });
        return false;
    }
    setAuthProcessLoading(true);
    try {
      const studentProfile = await UserService.getUserProfileService(studentIdToLink);
      if (!studentProfile) {
        toast({ title: "Student Not Found", description: "No student found with that ID. Please check the ID and try again.", variant: "destructive" });
        return false;
      }
      if (studentProfile.role !== 'student') {
        toast({ title: "Not a Student Account", description: "The ID provided does not belong to a student account.", variant: "destructive" });
        return false;
      }
      if (!studentProfile.schoolId) {
        toast({ title: "Student Not Enrolled", description: "This student is not yet fully enrolled in a school.", variant: "destructive" });
        return false;
      }

      const parentRef = doc(db, "users", currentUser.uid);
      await updateDoc(parentRef, {
        childStudentId: studentIdToLink,
        schoolId: studentProfile.schoolId,
        schoolName: studentProfile.schoolName,
        updatedAt: Timestamp.now()
      });

      setCurrentUser(prev => prev ? ({
        ...prev,
        childStudentId: studentIdToLink,
        schoolId: studentProfile.schoolId,
        schoolName: studentProfile.schoolName
      }) : null);

      if (studentProfile.schoolId && currentUser.displayName && studentProfile.displayName) {
        await ActivityService.addActivityService({
            schoolId: studentProfile.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            targetUserId: studentIdToLink,
            targetUserName: studentProfile.displayName,
            type: 'parent_linked_child',
            message: `${currentUser.displayName} linked their account to student ${studentProfile.displayName}.`
        });
      }
      return true;
    } catch (error) {
      console.error("Error linking child account:", error);
      toast({ title: "Linking Failed", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      return false;
    } finally {
      setAuthProcessLoading(false);
    }
  }, [currentUser, setCurrentUser, toast, setAuthProcessLoading]);

  const getExamPeriodsBySchool = useCallback(async (schoolId: string) => ExamService.getExamPeriodsBySchoolService(schoolId, ClassService.getClassDetailsService), []);
  const getExamPeriodById = useCallback(async (examPeriodId: string) => ExamService.getExamPeriodByIdService(examPeriodId, ClassService.getClassDetailsService), []);
  const getExamResultsForStudent = useCallback(async (studentId: string, schoolId: string) => ExamService.getExamResultsByStudentService(studentId, schoolId, SubjectService.getSubjectByIdService, (examPeriodId: string) => ExamService.getExamPeriodByIdService(examPeriodId, ClassService.getClassDetailsService)), []);
  const getExamResultsForTeacher = useCallback(async (examPeriodId: string, classId: string, subjectId: string, schoolId: string) => ExamService.getExamResultsForTeacherService(examPeriodId, classId, subjectId, schoolId, UserService.getUserProfileService), []);
  const getExamResultsByPeriodAndClass = useCallback(async (examPeriodId: string, classId: string, schoolId: string, subjectId: string) => ExamService.getExamResultsByPeriodAndClassService(examPeriodId, classId, schoolId, subjectId, SubjectService.getSubjectByIdService),[]);
  const createExamPeriod = useCallback(async (examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => ExamService.createExamPeriodService(examPeriodData), []);
  const updateExamPeriod = useCallback(async (examPeriodId: string, data: Partial<ExamPeriod>) => ExamService.updateExamPeriodService(examPeriodId, data), []);
  const addOrUpdateExamResult = useCallback(async (resultData: Omit<ExamResult, 'id' | 'createdAt' | 'updatedAt'>) => ExamService.addOrUpdateExamResultService(resultData), []);

  const saveAttendanceRecords = useCallback(async (records: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'teacher') return false;
    const recordsWithTeacherInfo = records.map(r => ({
        ...r,
        markedBy: currentUser.uid,
        markedByName: currentUser.displayName || 'Teacher',
        schoolId: currentUser.schoolId!,
    }));
    const success = await AttendanceService.saveMultipleAttendanceRecordsService(recordsWithTeacherInfo);
    if (success && records.length > 0 && currentUser?.schoolId && currentUser.displayName) {
        const firstRecord = records[0];
        const classInfo = await ClassService.getClassDetailsService(firstRecord.classId, UserService.getUserProfileService);
        await addActivity({
            schoolId: currentUser.schoolId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            classId: firstRecord.classId,
            type: 'attendance_marked',
            message: `${currentUser.displayName} marked attendance for class "${classInfo?.name || 'N/A'}" on ${format(firstRecord.date.toDate(), 'PPP')}.`,
            link: `/teacher/attendance`
        });
    }
    return success;
  }, [currentUser, addActivity]);

  const getAttendanceForClassDate = useCallback(async (classId: string, date: Timestamp, schoolId: string): Promise<AttendanceRecord[]> => {
    return AttendanceService.getAttendanceForClassByDateService(classId, date, schoolId);
  }, []);

  const getAttendanceForStudent = useCallback(async (studentId: string, schoolId: string, startDate: Timestamp, endDate: Timestamp): Promise<AttendanceRecord[]> => {
    return AttendanceService.getAttendanceForStudentByDateRangeService(studentId, schoolId, startDate, endDate);
  }, []);

  const getAttendanceForSchoolClassRange = useCallback(async (classId: string, schoolId: string, startDate: Timestamp, endDate: Timestamp): Promise<AttendanceRecord[]> => {
    return AttendanceService.getAttendanceForClassByDateRangeService(classId, schoolId, startDate, endDate);
  }, []);

  const getAttendanceForSchoolRange = useCallback(async (schoolId: string, startDate: Timestamp, endDate: Timestamp): Promise<AttendanceRecord[]> => {
    return AttendanceService.getAttendanceForSchoolByDateRangeService(schoolId, startDate, endDate);
  }, []);

  const addTestimonial = useCallback(async (testimonialData: Omit<Testimonial, 'id' | 'submittedAt' | 'isApprovedForDisplay'>): Promise<string | null> => {
    if (!currentUser) return null;
    const result = await TestimonialService.addTestimonialService(testimonialData);
    if (result && currentUser.schoolId && currentUser.displayName) {
      await addActivity({
        schoolId: currentUser.schoolId, 
        actorId: currentUser.uid,
        actorName: currentUser.displayName,
        type: 'testimonial_submitted',
        message: `${currentUser.displayName} submitted a testimonial.`,
        link: '/admin/testimonials' 
      });
      await UserService.updateUserLastTestimonialSurveyAtService(currentUser.uid);
    }
    return result;
  }, [currentUser, addActivity]);

  const getApprovedTestimonials = useCallback(async (limitCount?: number) => TestimonialService.getApprovedTestimonialsService(limitCount), []);
  const getAllTestimonialsForAdmin = useCallback(async () => {
    if (currentUser?.email !== 'learnifyke@gmail.com') return [];
    return TestimonialService.getAllTestimonialsService();
  }, [currentUser]);
  const updateTestimonialApproval = useCallback(async (testimonialId: string, isApproved: boolean) => {
    if (currentUser?.email !== 'learnifyke@gmail.com') return false;
    return TestimonialService.updateTestimonialApprovalService(testimonialId, isApproved);
  }, [currentUser]);
  const getLinkedParentForStudent = useCallback(async (studentId: string) => UserService.getLinkedParentForStudentService(studentId), []);


  const value: AuthContextType = useMemo(() => ({
    currentUser,
    loading: authProcessLoading,
    signUp, logIn, logOut,
    onboardingCreateSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus, getSchoolDetails: SchoolService.getSchoolDetailsService, updateSchoolDetails, regenerateInviteCode, updateAdminOnboardingStep, onboardingAddSubjects, onboardingCreateClasses, onboardingInviteUsers, onboardingCompleteSchoolSetup, createSchool,
    getUsersBySchool: UserService.getUsersBySchoolService, getUsersBySchoolAndRole: UserService.getUsersBySchoolAndRoleService, adminCreateUserInSchool, updateUserRoleAndSchool, getUserProfile: UserService.getUserProfileService, approveUserForSchool, getLinkedParentForStudent,
    createClassInSchool, getClassesBySchool, getClassDetails, updateClassDetails, enrollStudentInClass, removeStudentFromClass, getStudentsInClass, getStudentsNotInClass, deleteClass, regenerateClassInviteCode, joinClassWithCode,
    getClassesByTeacher, getStudentsInMultipleClasses,
    addLearningMaterial, getLearningMaterialsByTeacher, getLearningMaterialsBySchool, getLearningMaterialsByClass, deleteLearningMaterial, updateLearningMaterial, getLearningMaterialById: MaterialService.getLearningMaterialByIdService,
    createAssignment, getAssignmentsByTeacher, getAssignmentsByClass, getAssignmentById, updateAssignment, deleteAssignment,
    fetchSubmissionsForAssignment,
    gradeSubmission,
    getSubmissionByStudentForAssignment: SubmissionService.getSubmissionByStudentForAssignmentService,
    addSubmission,
    getAssignmentsForStudentByClass,
    completeStudentOnboarding,
    updateUserDisplayName, updateUserEmail, updateUserPassword, updateUserLastTestimonialSurveyAt,
    getClassesByIds,
    createSubject, getSubjectsBySchool: SubjectService.getSubjectsBySchoolService, updateSubject, deleteSubject, getSubjectById: SubjectService.getSubjectByIdService,
    createExamPeriod,
    getExamPeriodsBySchool,
    getExamPeriodById,
    updateExamPeriod,
    addOrUpdateExamResult,
    getExamResultsForTeacher,
    getExamResultsForStudent,
    getExamResultsByPeriodAndClass,
    getActivities: ActivityService.getActivitiesService, addActivity,
    addNotification,
    linkChildAccount,
    saveAttendanceRecords,
    getAttendanceForClassDate,
    getAttendanceForStudent,
    getAttendanceForSchoolClassRange,
    getAttendanceForSchoolRange,
    addTestimonial,
    getApprovedTestimonials,
    getAllTestimonialsForAdmin,
    updateTestimonialApproval,
  }), [
    currentUser, authProcessLoading, signUp, logIn, logOut,
    onboardingCreateSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus, updateSchoolDetails, regenerateInviteCode, updateAdminOnboardingStep, onboardingAddSubjects, onboardingCreateClasses, onboardingInviteUsers, onboardingCompleteSchoolSetup, createSchool,
    adminCreateUserInSchool, updateUserRoleAndSchool, approveUserForSchool, getLinkedParentForStudent,
    createClassInSchool, getClassesBySchool, getClassDetails, updateClassDetails, enrollStudentInClass, removeStudentFromClass, getStudentsInClass, getStudentsNotInClass, deleteClass, regenerateClassInviteCode, joinClassWithCode,
    getClassesByTeacher, getStudentsInMultipleClasses,
    addLearningMaterial, getLearningMaterialsByTeacher, getLearningMaterialsBySchool, getLearningMaterialsByClass, deleteLearningMaterial, updateLearningMaterial,
    createAssignment, getAssignmentsByTeacher, getAssignmentsByClass, getAssignmentById, updateAssignment, deleteAssignment,
    fetchSubmissionsForAssignment,
    gradeSubmission,
    addSubmission,
    getAssignmentsForStudentByClass,
    completeStudentOnboarding,
    updateUserDisplayName, updateUserEmail, updateUserPassword, updateUserLastTestimonialSurveyAt,
    getClassesByIds,
    createSubject, updateSubject, deleteSubject,
    createExamPeriod, getExamPeriodsBySchool, getExamPeriodById, updateExamPeriod, addOrUpdateExamResult, getExamResultsForTeacher, getExamResultsForStudent, getExamResultsByPeriodAndClass,
    addActivity, addNotification, linkChildAccount,
    saveAttendanceRecords, getAttendanceForClassDate, getAttendanceForStudent, getAttendanceForSchoolClassRange, getAttendanceForSchoolRange,
    addTestimonial, getApprovedTestimonials, getAllTestimonialsForAdmin, updateTestimonialApproval
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
