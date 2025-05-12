"use client";

import type { ReactNode } from 'react';
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
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus, Activity, Subject, ExamPeriod, ExamPeriodWithClassNames, ExamResult, ExamResultWithStudentInfo, Notification } from '@/types'; // Added Notification type
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
import * as NotificationService from '@/services/notificationService'; 
import { uploadFileToStorageService } from '@/services/fileUploadService';
import { AuthContext, type AuthContextType } from './AuthContext';
import { sendEmail } from '@/actions/emailActions'; // Import email utility
import { format } from 'date-fns';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authProcessLoading, setAuthProcessLoading] = useState(true);
  const router = useRouter(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthProcessLoading(true);
      if (user) {
        const userProfile = await UserService.getUserProfileService(user.uid);
        if (userProfile) {
          setCurrentUser({
            ...user, 
            ...userProfile, 
            uid: user.uid, 
          });
        } else {
          console.warn(`User ${user.uid} exists in Firebase Auth but not in Firestore. Logging out.`);
          await firebaseSignOut(auth);
          setCurrentUser(null);
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
    if (notificationId && notificationData.userId) {
      const recipient = await UserService.getUserProfileService(notificationData.userId);
      if (recipient?.email) {
        await sendEmail({
          to: recipient.email,
          subject: `Learnify Notification: ${notificationData.type.replace(/_/g, ' ')}`,
          html: `<p>${notificationData.message}</p>${notificationData.link ? `<p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}${notificationData.link}">View Details</a></p>` : ''}<p>From: ${notificationData.actorName || 'Learnify System'}</p>`,
        });
      }
    }
    return notificationId;
  }, []);

  const signUp = useCallback(async (email: string, pass: string, role: UserRole, displayName: string, schoolIdToJoin?: string, schoolName?: string): Promise<UserProfile | null> => {
    setAuthProcessLoading(true);
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
                type: 'user_profile_updated', 
                message: `New user ${profile.displayName} (${profile.role}) is awaiting approval for ${profile.schoolName}.`,
                targetUserId: profile.uid,
                targetUserName: profile.displayName,
                link: '/admin/users'
            });
            const schoolAdmins = await UserService.getUsersBySchoolAndRoleService(profile.schoolId, 'admin');
            for (const admin of schoolAdmins) {
              if (admin.email) {
                await sendEmail({
                  to: admin.email,
                  subject: `Learnify: New User Awaiting Approval - ${profile.displayName}`,
                  html: `<p>A new user, <strong>${profile.displayName}</strong> (${profile.role}), has registered for <strong>${profile.schoolName}</strong> and is awaiting your approval.</p><p>Please log in to your admin dashboard to review their request.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/admin/users">Go to User Management</a></p>`,
                });
              }
               await addNotification({
                  userId: admin.id,
                  schoolId: profile.schoolId!,
                  message: `New user ${profile.displayName} (${profile.role}) requires approval to join ${profile.schoolName}.`,
                  type: 'user_profile_updated', 
                  link: '/admin/users',
                  actorName: 'System'
              });
            }
         }
      }
      const fullProfile = await UserService.getUserProfileService(firebaseUser.uid);
      if (fullProfile) {
         setCurrentUser({ ...firebaseUser, ...fullProfile, uid: firebaseUser.uid});
         return { ...firebaseUser, ...fullProfile, uid: firebaseUser.uid};
      }
      return null;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error; 
    } finally {
      setAuthProcessLoading(false);
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
          return fullProfile;
        }
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error; 
    } finally {
      setAuthProcessLoading(false);
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
  }, [currentUser, setCurrentUser]);
  
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
  }, []);

  const createSchool = useCallback(async (schoolName: string, adminId: string): Promise<string | null> => {
    try {
      const schoolId = await SchoolService.createSchoolService(schoolName, adminId);
      if (schoolId && currentUser && currentUser.uid === adminId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId, schoolName, status: 'active' }) : null);
      }
      return schoolId;
    } catch (error) { return null; } 
  }, [currentUser, setCurrentUser]);

  const joinSchoolWithInviteCode = useCallback(async (inviteCode: string, userId: string): Promise<boolean> => {
    try {
      const schoolData = await SchoolService.joinSchoolWithInviteCodeService(inviteCode, userId);
      if (schoolData && currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolData.id, schoolName: schoolData.name, status: 'active' }) : null);
      }
      return !!schoolData;
    } catch (error) { return false; }
  }, [currentUser, setCurrentUser]);

  const checkAdminOnboardingStatus = useCallback(async (): Promise<{ isOnboarded: boolean; schoolId?: string }> => {
    if (!currentUser || currentUser.role !== 'admin') return { isOnboarded: false };
    return { isOnboarded: !!currentUser.schoolId, schoolId: currentUser.schoolId };
  }, [currentUser]);
  
  const updateSchoolDetails = useCallback(async (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive'>>): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return false;
    try {
        const school = await SchoolService.getSchoolDetailsService(schoolId); 
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
  }, [currentUser, addActivity]);

  const regenerateInviteCode = useCallback(async (schoolId: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return null;
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
  }, [currentUser, addActivity]);

  const adminCreateUserInSchool = useCallback(async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
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
            await addNotification({
                userId: newUser.id,
                schoolId: schoolId,
                message: `Welcome to ${currentUser.schoolName}! Your account has been created by an admin. Your initial password is the one set during creation. Please change it upon first login.`,
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
                await sendEmail({
                  to: approvedUser.email,
                  subject: `Learnify: Your Account for ${approvedUser.schoolName} is Approved!`,
                  html: `<p>Hi ${approvedUser.displayName},</p><p>Your account to join <strong>${approvedUser.schoolName}</strong> on Learnify has been approved! You can now log in and access your dashboard.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/auth/login">Log in to Learnify</a></p>`
                });
                await addNotification({
                    userId: approvedUser.id,
                    schoolId: schoolId,
                    message: `Your account for ${approvedUser.schoolName} has been approved! You can now log in.`,
                    type: 'user_approved',
                    actorName: currentUser.displayName,
                    link: approvedUser.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'
                });
            }
        }
        return success;
    }
    catch (error) { return false; }
  }, [currentUser, addActivity, addNotification]);
  
  const updateUserRoleAndSchool = useCallback(async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus, subjects?: string[] }): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin') return false;
    try { 
        const success = await UserService.updateUserRoleAndSchoolService(userId, data); 
        if (success && currentUser?.schoolId && currentUser.displayName) {
            const targetUser = await UserService.getUserProfileService(userId);
            if (targetUser && targetUser.email) {
                let activityMessage = `${currentUser.displayName} updated profile for ${targetUser.displayName}.`;
                let emailSubject = "Learnify: Your Account Details Updated";
                let emailHtml = `<p>Hi ${targetUser.displayName},</p><p>Your Learnify account details have been updated by an administrator at ${targetUser.schoolName}.</p>`;

                if (data.status === 'rejected') {
                    activityMessage = `${currentUser.displayName} rejected user request for ${targetUser.displayName}.`;
                    emailSubject = `Learnify: Account Request for ${targetUser.schoolName} Rejected`;
                    emailHtml = `<p>Hi ${targetUser.displayName},</p><p>Your request to join ${targetUser.schoolName} on Learnify has been rejected. Please contact your school administrator for more information.</p>`;
                } else if (data.role) {
                    activityMessage = `${currentUser.displayName} updated ${targetUser.displayName}'s role to ${data.role}.`;
                    emailHtml += `<p>Your role has been changed to: ${data.role}.</p>`;
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
                await sendEmail({ to: targetUser.email, subject: emailSubject, html: emailHtml });
                await addNotification({
                    userId: targetUser.id,
                    schoolId: targetUser.schoolId!,
                    message: emailSubject, // Using subject as a concise notification message
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
    try { 
      const newClassId = await ClassService.createClassService(className, schoolId, teacherId || '', classType, compulsorySubjectIds, subjectId); 
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
            await sendEmail({
              to: student.email,
              subject: `Learnify: You've been enrolled in ${cls.name}!`,
              html: `<p>Hi ${student.displayName},</p><p>You have been enrolled in the class "<strong>${cls.name}</strong>" by ${currentUser.displayName}.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/student/classes/${classId}">View Class</a></p>`,
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
                await sendEmail({
                  to: student.email,
                  subject: `Learnify: Removed from class ${cls.name}`,
                  html: `<p>Hi ${student.displayName},</p><p>You have been removed from the class "<strong>${cls.name}</strong>" by ${currentUser.displayName}.</p>`,
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
    if (!currentUser || currentUser.role !== 'admin') return false;
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
            const teacher = await UserService.getUserProfileService(classDetails.teacherId);
            if (teacher?.email) {
              await sendEmail({
                to: teacher.email,
                subject: `Learnify: ${currentUser.displayName} joined your class ${classDetails.name}`,
                html: `<p>Hi ${teacher.displayName || 'Teacher'},</p><p>Student <strong>${currentUser.displayName}</strong> has joined your class "<strong>${classDetails.name}</strong>".</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/teacher/classes/${classDetails.id}">View Class Roster</a></p>`,
              });
            }
            await addNotification({
                userId: classDetails.teacherId,
                schoolId: currentUser.schoolId,
                message: `${currentUser.displayName} has joined your class "${classDetails.name}".`,
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
    if (!currentUser || currentUser.role !== 'admin') return false;
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

  const addLearningMaterial = useCallback(async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>, file?: File | null): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId ) return null;
    let attachmentUrl: string | null = null;
    let finalContent = materialData.content;

    try {
      if (file && materialData.materialType === 'pdf_upload') {
        const path = `schools/${currentUser.schoolId}/materials/${materialData.classId || 'general'}`;
        attachmentUrl = await uploadFileToStorageService(file, path);
        if (!attachmentUrl) throw new Error("File upload failed.");
        finalContent = `[Uploaded File: ${file.name}]`; 
      }

      const dataToSave: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'> = {
        ...materialData,
        content: finalContent,
        attachmentUrl: attachmentUrl,
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
                  if (student.email) {
                    await sendEmail({
                      to: student.email,
                      subject: `Learnify: New Material "${materialData.title}" for ${classInfo.name}`,
                      html: `<p>Hi ${student.displayName},</p><p>A new learning material, "<strong>${materialData.title}</strong>", has been added to your class "<strong>${classInfo.name}</strong>" by ${currentUser.displayName}.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/student/classes/${materialData.classId}">View Material</a></p>`,
                    });
                  }
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
    catch (error) { return null; }
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
    data: Partial<Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId' | 'attachmentUrl'>>,
    file?: File | null,
    existingAttachmentUrlForLogic?: string | null
  ): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId ) return false;

    let finalAttachmentUrl = existingAttachmentUrlForLogic || null;
    let finalContent = data.content; 

    try {
      const materialDocBeforeUpdate = await MaterialService.getLearningMaterialByIdService(materialId);
      if (!materialDocBeforeUpdate) {
        console.error("Material not found for update");
        return false;
      }

      if (file && data.materialType === 'pdf_upload') {
        const path = `schools/${currentUser.schoolId}/materials/${data.classId || materialDocBeforeUpdate.classId || 'general'}`;
        const uploadedUrl = await uploadFileToStorageService(file, path);
        if (uploadedUrl) {
          finalAttachmentUrl = uploadedUrl;
          finalContent = `[Uploaded File: ${file.name}]`; 
        } else {
          console.error("Material attachment upload failed during update.");
          return false;
        }
      } else if (data.materialType && data.materialType !== 'pdf_upload') {
        // If type changed away from PDF_UPLOAD and no new file, clear attachment URL.
        // Content would be the new URL or text.
        finalAttachmentUrl = null;
      }


      const updatePayload: Partial<Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId'>> = {
        ...data,
        content: finalContent,
        attachmentUrl: finalAttachmentUrl,
      };
      
      const success = await MaterialService.updateLearningMaterialService(materialId, updatePayload); 
      if (success && currentUser?.schoolId && currentUser.displayName && data.title) {
           await addActivity({
              schoolId: currentUser.schoolId,
              actorId: currentUser.uid,
              actorName: currentUser.displayName,
              type: 'material_updated',
              message: `${currentUser.displayName} updated material "${data.title}".`,
              link: `/teacher/materials` // or link to specific material/class page
          });
      }
      return success;
    } catch (error) { 
        console.error("Error updating learning material in AuthContext:", error);
        return false; 
    }
  }, [currentUser, addActivity, addNotification]);
  
  const getLearningMaterialsByTeacher = useCallback(async (teacherId: string, classId?: string) => MaterialService.getLearningMaterialsByTeacherService(teacherId, classId), []);
  const getLearningMaterialsBySchool = useCallback(async (schoolId: string) => MaterialService.getLearningMaterialsBySchoolService(schoolId, UserService.getUserProfileService, ClassService.getClassDetailsService), []);
  const getLearningMaterialsByClass = useCallback(async (classId: string) => MaterialService.getLearningMaterialsByClassService(classId), []);
  const getLearningMaterialById = useCallback(async (materialId: string) => MaterialService.getLearningMaterialByIdService(materialId), []);

  const createAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>, file?: File | null): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId) return null;
    let attachmentUrl: string | null = null;

    try {
      if (file) {
        const path = `schools/${currentUser.schoolId}/assignments/${assignmentData.classId}`;
        attachmentUrl = await uploadFileToStorageService(file, path);
        if (!attachmentUrl) throw new Error("Assignment attachment upload failed.");
      }

      const dataToSave = { ...assignmentData, teacherId: currentUser.uid, schoolId: currentUser.schoolId, attachmentUrl };
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
            if (student.email) {
              await sendEmail({
                to: student.email,
                subject: `Learnify: New Assignment "${assignmentData.title}" for ${className}`,
                html: `<p>Hi ${student.displayName},</p><p>A new assignment, "<strong>${assignmentData.title}</strong>", has been posted for your class "<strong>${className}</strong>" by ${currentUser.displayName}.</p><p>Deadline: ${format(assignmentData.deadline, 'PPpp')}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/student/assignments/${newAssignmentId}">View Assignment</a></p>`,
              });
            }
            await addNotification({
                userId: student.id,
                schoolId: currentUser.schoolId!,
                message: `New assignment "${assignmentData.title}" posted for class "${className}".`,
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
        } else if (currentUser?.studentAssignments?.[assignmentId]) { 
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
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
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
    assignmentTitle: string, // For activity log consistency
    data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions' | 'attachmentUrl' | 'schoolId'>>,
    file?: File | null,
    existingAttachmentUrlForLogic?: string | null
  ): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin') || !currentUser.schoolId) return false;
  
    let finalAttachmentUrl = existingAttachmentUrlForLogic || null;
  
    try {
      const assignmentDocBeforeUpdate = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService);
      if (!assignmentDocBeforeUpdate) {
        console.error("Assignment not found for update in AuthProvider");
        return false;
      }
  
      if (file) {
        const path = `schools/${currentUser.schoolId}/assignments/${data.classId || assignmentDocBeforeUpdate.classId}`;
        const uploadedUrl = await uploadFileToStorageService(file, path);
        if (uploadedUrl) {
          finalAttachmentUrl = uploadedUrl;
        } else {
          console.error("Assignment attachment upload failed during update in AuthProvider.");
          return false;
        }
      }
  
      const updatePayload: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId'>> = {
        ...data,
        attachmentUrl: finalAttachmentUrl,
      };
      
      const success = await AssignmentService.updateAssignmentService(assignmentId, updatePayload);
  
      if (success && currentUser?.schoolId && currentUser.displayName) {
        const updatedAssignmentDoc = await AssignmentService.getAssignmentByIdService(assignmentId, ClassService.getClassDetailsService); // Fetch again to get potentially updated className
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
            if (student.email) {
              await sendEmail({
                to: student.email,
                subject: `Learnify: Assignment Updated - "${data.title || assignmentTitle}" for ${updatedAssignmentDoc.className}`,
                html: `<p>Hi ${student.displayName},</p><p>The assignment "<strong>${data.title || assignmentTitle}</strong>" for your class "<strong>${updatedAssignmentDoc.className}</strong>" has been updated by ${currentUser.displayName}.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/student/assignments/${assignmentId}">View Updated Assignment</a></p>`,
              });
            }
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
                 await sendEmail({
                  to: student.email,
                  subject: `Learnify: Your Assignment "${assignment.title}" Has Been Graded!`,
                  html: `<p>Hi ${student.displayName},</p><p>Your submission for the assignment "<strong>${assignment.title}</strong>" has been graded.</p><p>Grade: <strong>${grade}</strong></p>${feedback ? `<p>Feedback: <em>${feedback.replace(/\n/g, "<br>")}</em></p>` : ''}<p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/student/assignments/${submission.assignmentId}">View Submission Details</a></p>`,
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
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status' | 'originalFileName'>,
    file?: File | null
  ): Promise<{ submissionId: string, newStatus: Submission['status'], existingGrade?: string | number } | null> => {
    if (!currentUser?.uid || !currentUser.schoolId) return null;
    let attachmentUrl: string | null = null;
    let originalFileName: string | undefined = undefined;

    try {
      if (file && submissionData.submissionType === 'file_upload') {
        const path = `schools/${currentUser.schoolId}/submissions/${submissionData.assignmentId}/${currentUser.uid}`;
        attachmentUrl = await uploadFileToStorageService(file, path);
        if (!attachmentUrl) throw new Error("Submission file upload failed.");
        originalFileName = file.name;
      }
      
      const assignment = await AssignmentService.getAssignmentByIdService(submissionData.assignmentId, ClassService.getClassDetailsService);
      if (!assignment) throw new Error("Assignment not found");

      const submissionPayload = {
        ...submissionData,
        content: submissionData.submissionType === 'file_upload' ? attachmentUrl || '' : submissionData.content,
        originalFileName: submissionData.submissionType === 'file_upload' ? originalFileName : undefined,
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
            const teacher = await UserService.getUserProfileService(assignment.teacherId);
            if (teacher?.email) {
              await sendEmail({
                to: teacher.email,
                subject: `Learnify: New Submission for "${assignment.title}" by ${currentUser.displayName}`,
                html: `<p>Hi ${teacher.displayName || 'Teacher'},</p><p>Student <strong>${currentUser.displayName}</strong> has submitted their work for the assignment "<strong>${assignment.title}</strong>" in class "<strong>${assignment.className}</strong>".</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/teacher/assignments/${submissionData.assignmentId}">View Submission</a></p>`,
              });
            }
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
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return [];
    if (currentUser.role === 'student' && currentUser.uid !== studentId) return [];
    try {
        const studentProfile = await UserService.getUserProfileService(studentId);
        return await AssignmentService.getAssignmentsForStudentByClassService(classId, studentId, SubmissionService.getSubmissionByStudentForAssignmentService, ClassService.getClassDetailsService, studentProfile);
    } catch (error) { return []; }
  }, [currentUser]);

  const completeStudentOnboarding = useCallback(async (userId: string, classIds: string[], subjectIds: string[]): Promise<boolean> => {
    if (!currentUser || currentUser.uid !== userId || currentUser.role !== 'student') return false;
    try {
      const success = await UserService.completeStudentOnboardingService(userId, classIds, subjectIds); // Pass classIds as array
      if (success && currentUser?.schoolId && currentUser.displayName) {
        setCurrentUser(prev => prev ? ({ ...prev, classIds, subjects: subjectIds }) : null);
         // Assuming only one main class selected during onboarding for this activity log
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
          const teacher = await UserService.getUserProfileService(cls.teacherId);
          if (teacher?.email) {
             await sendEmail({
                to: teacher.email,
                subject: `Learnify: ${currentUser.displayName} completed onboarding for your class ${cls.name}`,
                html: `<p>Hi ${teacher.displayName || 'Teacher'},</p><p>Student <strong>${currentUser.displayName}</strong> has completed onboarding and joined your class "<strong>${cls.name}</strong>".</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/teacher/classes/${cls.id}">View Class Roster</a></p>`,
              });
          }
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

  const createSubject = useCallback(async (schoolId: string, subjectName: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) return null;
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
  }, [currentUser, addActivity]);
  
  const updateSubject = useCallback(async (subjectId: string, newName: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    try {
        const oldSubject = await SubjectService.getSubjectByIdService(subjectId);
        const success = await SubjectService.updateSubjectService(subjectId, newName);
        if (success && currentUser?.schoolId && currentUser.displayName && oldSubject) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'subject_updated',
                message: `${currentUser.displayName} updated subject "${oldSubject.name}" to "${newName}".`,
                link: `/admin/school-settings/subjects`
            });
        }
        return success;
    } catch (error) { return false; }
  }, [currentUser, addActivity]);

  const deleteSubject = useCallback(async (subjectId: string, subjectName: string): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'admin') return false;
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
  
  const getExamPeriodsBySchool = useCallback(async (schoolId: string) => ExamService.getExamPeriodsBySchoolService(schoolId, ClassService.getClassDetailsService), []);
  const getExamPeriodById = useCallback(async (examPeriodId: string) => ExamService.getExamPeriodByIdService(examPeriodId, ClassService.getClassDetailsService), []);
  const getExamResultsForStudent = useCallback(async (studentId: string, schoolId: string) => ExamService.getExamResultsByStudentService(studentId, schoolId, SubjectService.getSubjectByIdService, (examPeriodId: string) => ExamService.getExamPeriodByIdService(examPeriodId, ClassService.getClassDetailsService)), []);
  const getExamResultsForTeacher = useCallback(async (examPeriodId: string, classId: string, subjectId: string, schoolId: string) => ExamService.getExamResultsForTeacherService(examPeriodId, classId, subjectId, schoolId, UserService.getUserProfileService), []);
  const getExamResultsByPeriodAndClass = useCallback(async (examPeriodId: string, classId: string, schoolId: string, subjectId: string) => ExamService.getExamResultsByPeriodAndClassService(examPeriodId, classId, schoolId, subjectId, SubjectService.getSubjectByIdService),[]);
  const createExamPeriod = useCallback(async (examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => ExamService.createExamPeriodService(examPeriodData), []);
  const updateExamPeriod = useCallback(async (examPeriodId: string, data: Partial<ExamPeriod>) => ExamService.updateExamPeriodService(examPeriodId, data), []);
  const addOrUpdateExamResult = useCallback(async (resultData: Omit<ExamResult, 'id' | 'createdAt' | 'updatedAt'>) => ExamService.addOrUpdateExamResultService(resultData), []);


  const value: AuthContextType = useMemo(() => ({
    currentUser, 
    loading: authProcessLoading,
    signUp, logIn, logOut,
    createSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus, getSchoolDetails: SchoolService.getSchoolDetailsService, updateSchoolDetails, regenerateInviteCode,
    getUsersBySchool: UserService.getUsersBySchoolService, getUsersBySchoolAndRole: UserService.getUsersBySchoolAndRoleService, adminCreateUserInSchool, updateUserRoleAndSchool, getUserProfile: UserService.getUserProfileService, approveUserForSchool,
    createClassInSchool, getClassesBySchool, getClassDetails, updateClassDetails, enrollStudentInClass, removeStudentFromClass, getStudentsInClass, getStudentsNotInClass, deleteClass, regenerateClassInviteCode, joinClassWithCode,
    getClassesByTeacher, getStudentsInMultipleClasses,
    addLearningMaterial, getLearningMaterialsByTeacher, getLearningMaterialsBySchool, getLearningMaterialsByClass, deleteLearningMaterial, updateLearningMaterial, getLearningMaterialById: MaterialService.getLearningMaterialByIdService,
    createAssignment, getAssignmentsByTeacher, getAssignmentsByClass, getAssignmentById, updateAssignment, deleteAssignment,
    fetchSubmissionsForAssignment,
    gradeSubmission,
    getSubmissionByStudentForAssignment: SubmissionService.getSubmissionByStudentForAssignmentService, 
    addSubmission, 
    getAssignmentsForStudentByClass,
    completeStudentOnboarding, // Corrected reference
    updateUserDisplayName, updateUserEmail, updateUserPassword,
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
    addNotification
  }), [
    currentUser, authProcessLoading, signUp, logIn, logOut, 
    createSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus, updateSchoolDetails, regenerateInviteCode,
    adminCreateUserInSchool, updateUserRoleAndSchool, approveUserForSchool,
    createClassInSchool, getClassesBySchool, getClassDetails, updateClassDetails, enrollStudentInClass, removeStudentFromClass, getStudentsInClass, getStudentsNotInClass, deleteClass, regenerateClassInviteCode, joinClassWithCode,
    getClassesByTeacher, getStudentsInMultipleClasses,
    addLearningMaterial, getLearningMaterialsByTeacher, getLearningMaterialsBySchool, getLearningMaterialsByClass, deleteLearningMaterial, updateLearningMaterial,
    createAssignment, getAssignmentsByTeacher, getAssignmentsByClass, getAssignmentById, updateAssignment, deleteAssignment,
    fetchSubmissionsForAssignment,
    gradeSubmission,
    addSubmission, 
    getAssignmentsForStudentByClass,
    completeStudentOnboarding, // Corrected reference
    updateUserDisplayName, updateUserEmail, updateUserPassword,
    getClassesByIds,
    createSubject, updateSubject, deleteSubject,
    createExamPeriod, getExamPeriodsBySchool, getExamPeriodById, updateExamPeriod, addOrUpdateExamResult, getExamResultsForTeacher, getExamResultsForStudent, getExamResultsByPeriodAndClass,
    addActivity, addNotification
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

