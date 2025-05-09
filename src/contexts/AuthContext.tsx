

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
  updateEmail as updateFirebaseEmail, // Import for email update
  updatePassword as updateFirebasePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, addDoc, Timestamp, orderBy, deleteDoc, arrayUnion, arrayRemove, documentId } from 'firebase/firestore';
import { auth, db, app as firebaseApp } from '@/lib/firebase'; // Import app for creating temporary auth instance if needed
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo, Assignment, Submission, SubmissionFormat, LearningMaterialType, AssignmentWithClassInfo, SubmissionWithStudentName, AssignmentWithClassAndSubmissionInfo, UserStatus } from '@/types';
import { useRouter } from 'next/navigation';

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
  updateUserRoleAndSchool: (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[] }) => Promise<boolean>;
  getUserProfile: (userId: string) => Promise<UserProfileWithId | null>;
  approveUserForSchool: (userId: string, schoolId: string) => Promise<boolean>; // New for admin verification

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
            schoolName: userData.schoolName, // For pending verification display
            status: userData.status as UserStatus || 'active', // Default to active if status not set
            classIds: userData.classIds || [],
            studentAssignments: userData.studentAssignments || {},
          });
        } else {
          console.warn(`User ${user.uid} exists in Firebase Auth but not in Firestore. This might be an incomplete signup or an admin-created user pending Firestore record.`);
          // This case might happen if a user exists in Auth but not Firestore (e.g., during signup race condition or manual deletion)
           // For a newly signed up user via the app's signUp function, the Firestore doc is created there.
           // If an admin is creating a user, that function should handle Firestore doc creation too.
          console.warn(`User ${user.uid} exists in Firebase Auth but not in Firestore. This might be an incomplete signup or an admin-created user pending Firestore record.`);
          // We'll set a minimal currentUser and let other parts of the app (like onboarding) handle it.
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

  const signUp = async (email: string, pass: string, role: UserRole, displayName: string, schoolIdToJoin?: string, schoolName?: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser) {
        await updateFirebaseProfile(firebaseUser, { displayName });
        
        const userProfileData: Omit<UserProfile, keyof FirebaseUser | 'classIds' | 'studentAssignments'> & { uid: string, createdAt: Timestamp, classIds: string[], studentAssignments: {}, status: UserStatus, schoolId?: string, schoolName?: string } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          role: role,
          createdAt: Timestamp.now(),
          classIds: [],
          studentAssignments: {},
          status: 'active', // Default to active
        };

        if (role === 'teacher' || role === 'student') {
          if (schoolIdToJoin) {
            userProfileData.schoolId = schoolIdToJoin;
            userProfileData.schoolName = schoolName; // Store school name for pending display
            userProfileData.status = 'pending_verification';
          } else {
            // This case should ideally be prevented by form validation ensuring schoolIdToJoin is provided
            // If not, they are active but unattached, which is not the target flow for this change.
            // Consider how to handle this if form doesn't enforce schoolIdToJoin.
            // For now, assuming form makes it mandatory.
          }
        }
        // For admin, schoolId is set during onboarding. Status remains 'active'.

        await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
        
        const profile: UserProfile = {
          ...userProfileData,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata,
          providerData: firebaseUser.providerData,
          providerId: firebaseUser.providerId,
          tenantId: firebaseUser.tenantId,
          refreshToken: firebaseUser.refreshToken,
          delete: firebaseUser.delete,
          getIdToken: firebaseUser.getIdToken,
          getIdTokenResult: firebaseUser.getIdTokenResult,
          reload: firebaseUser.reload,
          toJSON: firebaseUser.toJSON,
        };
        // setCurrentUser(profile); // Let onAuthStateChanged handle setting currentUser for consistency
        return profile; // Return profile so AuthForm can redirect based on status
      }
      return null;
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
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: userData.displayName || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous,
            metadata: firebaseUser.metadata,
            providerData: userCredential.user.providerData,
            providerId: userCredential.user.providerId,
            tenantId: userCredential.user.tenantId,
            refreshToken: userCredential.user.refreshToken,
            delete: userCredential.user.delete,
            getIdToken: userCredential.user.getIdToken,
            getIdTokenResult: userCredential.user.getIdTokenResult,
            reload: userCredential.user.reload,
            toJSON: userCredential.user.toJSON,
            role: userData.role as UserRole,
            schoolId: userData.schoolId,
            schoolName: userData.schoolName,
            status: userData.status as UserStatus || 'active',
            classIds: userData.classIds || [],
            studentAssignments: userData.studentAssignments || {},
          };
          // setCurrentUser(profile); // Let onAuthStateChanged handle this
          return profile;
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

  const approveUserForSchool = async (userId: string, schoolId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.schoolId !== schoolId) {
        console.error("Unauthorized or school mismatch for approving user.");
        return false;
    }
    setLoading(true);
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { status: 'active', updatedAt: Timestamp.now() });
        // Optionally, if schoolName was stored for pending users, you might clear it or ensure schoolId is correct.
        return true;
    } catch (error) {
        console.error("Error approving user for school:", error);
        return false;
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

  const createSchool = async (schoolName: string, adminId: string): Promise<string | null> => {
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const schoolRef = doc(collection(db, "schools"));
      const schoolData: School = {
        id: schoolRef.id,
        name: schoolName,
        adminId: adminId,
        inviteCode: inviteCode,
        createdAt: Timestamp.now(),
      };
      
      const batch = writeBatch(db);
      batch.set(schoolRef, schoolData);
      
      const userRef = doc(db, "users", adminId);
      batch.update(userRef, { schoolId: schoolRef.id, schoolName: schoolName, status: 'active' }); // Admin is active in their new school
      
      await batch.commit();

      if (currentUser && currentUser.uid === adminId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolRef.id, schoolName: schoolName, status: 'active' }) : null);
      }
      
      return schoolRef.id;
    } catch (error) {
      console.error("Error creating school:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinSchoolWithInviteCode = async (inviteCode: string, userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const schoolsRef = collection(db, "schools");
      const q = query(schoolsRef, where("inviteCode", "==", inviteCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("Invalid invite code");
        return false;
      }

      const schoolDoc = querySnapshot.docs[0];
      const schoolId = schoolDoc.id;
      const schoolData = schoolDoc.data() as School;

      const userRef = doc(db, "users", userId);
      // Admin joining another school is typically 'active'.
      // This function is generally for admins during onboarding.
      // If a teacher/student used this, their status might need separate handling, but they use schoolIdToJoin.
      await updateDoc(userRef, { schoolId: schoolId, schoolName: schoolData.name, status: 'active' });
      
      if (currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolId, schoolName: schoolData.name, status: 'active' }) : null);
      }

      return true;
    } catch (error) {
      console.error("Error joining school:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const checkAdminOnboardingStatus = async (): Promise<{ isOnboarded: boolean; schoolId?: string }> => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { isOnboarded: false };
    }
    // User's schoolId is already on currentUser from onAuthStateChanged
    if (currentUser.schoolId) {
      return { isOnboarded: true, schoolId: currentUser.schoolId };
    }
    return { isOnboarded: false };
  };

  const getSchoolDetails = async (schoolId: string): Promise<School | null> => {
    if (!schoolId) return null;
    try {
      const schoolRef = doc(db, "schools", schoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        return schoolSnap.data() as School;
      }
      return null;
    } catch (error) {
      console.error("Error fetching school details:", error);
      return null;
    }
  };

  const updateSchoolDetails = async (schoolId: string, data: Partial<Pick<School, 'name'>>): Promise<boolean> => {
    if (!schoolId || !currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
      const schoolRef = doc(db, "schools", schoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (!schoolSnap.exists() || schoolSnap.data().adminId !== currentUser.uid) {
        console.error("User is not authorized to update this school or school does not exist.");
        return false;
      }
      await updateDoc(schoolRef, { ...data, updatedAt: Timestamp.now() });
      return true;
    } catch (error) {
      console.error("Error updating school details:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const regenerateInviteCode = async (schoolId: string): Promise<string | null> => {
    if (!schoolId || (currentUser && currentUser.role !== 'admin')) return null;
    setLoading(true);
    try {
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const schoolRef = doc(db, "schools", schoolId);
      await updateDoc(schoolRef, { inviteCode: newInviteCode });
      return newInviteCode;
    } catch (error) {
      console.error("Error regenerating invite code:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUsersBySchool = async (schoolId: string): Promise<UserProfileWithId[]> => {
    if (!schoolId) return [];
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("schoolId", "==", schoolId));
      const querySnapshot = await getDocs(q);
      const users: UserProfileWithId[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data(), status: doc.data().status || 'active' } as UserProfileWithId);
      });
      return users;
    } catch (error) {
      console.error("Error fetching users by school:", error);
      return [];
    }
  };
  
  const getUsersBySchoolAndRole = async (schoolId: string, role: UserRole): Promise<UserProfileWithId[]> => {
    if (!schoolId || !role) return [];
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("schoolId", "==", schoolId), where("role", "==", role));
      const querySnapshot = await getDocs(q);
      const users: UserProfileWithId[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data(), status: doc.data().status || 'active' } as UserProfileWithId);
      });
      return users;
    } catch (error) {
      console.error("Error fetching users by school and role:", error);
      return [];
    }
  };

  const adminCreateUserInSchool = async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        await updateFirebaseProfile(firebaseUser, { displayName });

        const schoolDetails = await getSchoolDetails(schoolId); // To get schoolName

        const userProfileData = {
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          displayName: displayName,
          role: role,
          schoolId: schoolId,
          schoolName: schoolDetails?.name || 'Unknown School', // Store school name
          createdAt: Timestamp.now(),
          classIds: [],
          studentAssignments: {},
          status: 'active' as UserStatus, // Admin-created users are active
        };
        await setDoc(doc(db, "users", firebaseUser.uid), userProfileData); 

        const newUserProfile: UserProfileWithId = {
          id: firebaseUser.uid, 
          ...userProfileData,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata,
          providerData: firebaseUser.providerData,
          providerId: firebaseUser.providerId,
          tenantId: firebaseUser.tenantId,
          refreshToken: firebaseUser.refreshToken,
          delete: firebaseUser.delete,
          getIdToken: firebaseUser.getIdToken,
          getIdTokenResult: firebaseUser.getIdTokenResult,
          reload: firebaseUser.reload,
          toJSON: firebaseUser.toJSON,
        };
        return newUserProfile;
      }
      return null;
    } catch (error: any) {
      console.error("Error creating user by admin:", error);
      // Specific error handling can be done here or in the calling component
      // For example, if error.code === 'auth/email-already-in-use'
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUserRoleAndSchool = async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus }): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      const updateData: any = { ...data, updatedAt: Timestamp.now() };
      if (data.classIds === null) { 
        updateData.classIds = [];
      }
      // If role is changed, ensure status is appropriate (e.g. 'active') unless explicitly set
      if (data.role && !data.status) {
        updateData.status = 'active';
      }


      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating user role/school/status:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId: string): Promise<UserProfileWithId | null> => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return { id: userDocSnap.id, ...data, status: data.status || 'active' } as UserProfileWithId;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const createClassInSchool = async (className: string, schoolId: string, teacherId?: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher') || !schoolId) return null;
    setLoading(true);
    try {
      const classRef = collection(db, "classes");
      const classInviteCode = `C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const classData: Omit<Class, 'id'> = {
        name: className,
        schoolId: schoolId,
        teacherId: teacherId || '', 
        studentIds: [],
        classInviteCode: classInviteCode,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(classRef, classData);
      await updateDoc(doc(db, "classes", docRef.id), { id: docRef.id }); 
      return docRef.id;
    } catch (error) {
      console.error("Error creating class:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getClassesBySchool = async (schoolId: string): Promise<ClassWithTeacherInfo[]> => {
    if (!schoolId) return [];
    try {
      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("schoolId", "==", schoolId), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const classesPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const classData = docSnapshot.data() as Class;
        let teacherDisplayName = 'N/A';
        if (classData.teacherId) {
          const teacherProfile = await getUserProfile(classData.teacherId);
          teacherDisplayName = teacherProfile?.displayName || 'N/A';
        }
        return { ...classData, id: docSnapshot.id, teacherDisplayName };
      });
      return Promise.all(classesPromises);
    } catch (error) {
      console.error("Error fetching classes:", error);
      return [];
    }
  };
  
  const getClassesByIds = async (classIds: string[]): Promise<ClassWithTeacherInfo[]> => {
    if (!classIds || classIds.length === 0) return [];
    try {
      const MAX_CLASS_IDS_PER_QUERY = 30;
      const classChunks: string[][] = [];
      for (let i = 0; i < classIds.length; i += MAX_CLASS_IDS_PER_QUERY) {
          classChunks.push(classIds.slice(i, i + MAX_CLASS_IDS_PER_QUERY));
      }

      let allClasses: ClassWithTeacherInfo[] = [];

      for (const chunk of classChunks) {
        if (chunk.length === 0) continue;
        const classesRef = collection(db, "classes");
        const q = query(classesRef, where(documentId(), "in", chunk));
        const querySnapshot = await getDocs(q);
        
        const classesPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const classData = docSnapshot.data() as Class;
          let teacherDisplayName = 'N/A';
          if (classData.teacherId) {
            const teacherProfile = await getUserProfile(classData.teacherId);
            teacherDisplayName = teacherProfile?.displayName || 'N/A';
          }
          const assignmentsQuery = query(collection(db, "assignments"), where("classId", "==", classData.id));
          const assignmentsSnapshot = await getDocs(assignmentsQuery);
          const totalAssignmentsCount = assignmentsSnapshot.size;
          
          return { ...classData, id: docSnapshot.id, teacherDisplayName, totalAssignmentsCount };
        });
        const chunkClasses = await Promise.all(classesPromises);
        allClasses = [...allClasses, ...chunkClasses];
      }
      
      return allClasses.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error fetching classes by IDs:", error);
      return [];
    }
  };


  const getClassDetails = async (classId: string): Promise<ClassWithTeacherInfo | null> => {
    try {
      const classRef = doc(db, "classes", classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const classData = classSnap.data() as Class;
         let teacherDisplayName = 'N/A';
        if (classData.teacherId) {
          const teacherProfile = await getUserProfile(classData.teacherId);
          teacherDisplayName = teacherProfile?.displayName || 'N/A';
        }
        return { ...classData, teacherDisplayName };
      }
      return null;
    } catch (error) {
      console.error("Error fetching class details:", error);
      return null;
    }
  };

  const updateClassDetails = async (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId' | 'classInviteCode'>>): Promise<boolean> => {
     if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try {
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, { ...data, updatedAt: Timestamp.now() });
      return true;
    } catch (error) {
      console.error("Error updating class details:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const enrollStudentInClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const classRef = doc(db, "classes", classId);
      batch.update(classRef, { studentIds: arrayUnion(studentId), updatedAt: Timestamp.now() });
      
      const studentRef = doc(db, "users", studentId);
      batch.update(studentRef, { classIds: arrayUnion(classId), updatedAt: Timestamp.now() });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error enrolling student:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const joinClassWithCode = async (classCode: string, studentId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'student' || currentUser.uid !== studentId) return false;
    setLoading(true);
    try {
      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("classInviteCode", "==", classCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("Invalid class invite code");
        return false;
      }

      const classDoc = querySnapshot.docs[0];
      const classId = classDoc.id;
      const classData = classDoc.data() as Class;

      if (classData.studentIds?.includes(studentId)) {
        console.log("Student already enrolled in this class.");
        // Ensure local state for currentUser is also up-to-date if somehow it's not
        if (currentUser && !currentUser.classIds?.includes(classId)) {
          setCurrentUser(prev => prev ? ({ ...prev, classIds: Array.from(new Set([...(prev.classIds || []), classId])) }) : null);
        }
        return true; 
      }
      
      const batch = writeBatch(db);
      batch.update(classDoc.ref, { studentIds: arrayUnion(studentId), updatedAt: Timestamp.now() });
      
      const studentRef = doc(db, "users", studentId);
      batch.update(studentRef, { classIds: arrayUnion(classId), updatedAt: Timestamp.now() });
      
      await batch.commit();

      // Update local state
      setCurrentUser(prev => prev ? ({ ...prev, classIds: Array.from(new Set([...(prev.classIds || []), classId])) }) : null);
      return true;

    } catch (error) {
      console.error("Error joining class with code:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const regenerateClassInviteCode = async (classId: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return null;
    setLoading(true);
    try {
      const newInviteCode = `C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, { classInviteCode: newInviteCode, updatedAt: Timestamp.now() });
      return newInviteCode;
    } catch (error) {
      console.error("Error regenerating class invite code:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };


  const removeStudentFromClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const classRef = doc(db, "classes", classId);
      batch.update(classRef, { studentIds: arrayRemove(studentId), updatedAt: Timestamp.now() });

      const studentRef = doc(db, "users", studentId);
      batch.update(studentRef, { classIds: arrayRemove(classId), updatedAt: Timestamp.now() });
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error removing student from class:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getStudentsInClass = async (classId: string): Promise<UserProfileWithId[]> => {
    const classDetails = await getClassDetails(classId);
    if (!classDetails || !classDetails.studentIds || classDetails.studentIds.length === 0) {
      return [];
    }
    try {
      const MAX_STUDENT_IDS_PER_QUERY = 30; 
      const studentIdChunks: string[][] = [];
      for (let i = 0; i < classDetails.studentIds.length; i += MAX_STUDENT_IDS_PER_QUERY) {
          studentIdChunks.push(classDetails.studentIds.slice(i, i + MAX_STUDENT_IDS_PER_QUERY));
      }

      let allStudents: UserProfileWithId[] = [];
      for (const chunk of studentIdChunks) {
        if (chunk.length === 0) continue;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where(documentId(), "in", chunk));
        const querySnapshot = await getDocs(q);
        const studentsInChunk = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'active' } as UserProfileWithId));
        allStudents = [...allStudents, ...studentsInChunk];
      }
      return allStudents;
    } catch (error) {
      console.error("Error fetching students in class:", error);
      return [];
    }
  };

  const getStudentsNotInClass = async (schoolId: string, classId: string): Promise<UserProfileWithId[]> => {
    const allSchoolStudents = await getUsersBySchoolAndRole(schoolId, 'student');
    const studentsInClass = await getStudentsInClass(classId);
    const studentIdsInClass = new Set(studentsInClass.map(s => s.id));
    return allSchoolStudents.filter(student => !studentIdsInClass.has(student.id) && student.status === 'active');
  };

  const deleteClass = async (classId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const classDetails = await getClassDetails(classId);
      if (classDetails?.studentIds) {
        classDetails.studentIds.forEach(studentId => {
          const studentRef = doc(db, "users", studentId);
          batch.update(studentRef, { classIds: arrayRemove(classId) });
        });
      }
      const assignmentsQuery = query(collection(db, "assignments"), where("classId", "==", classId));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      assignmentsSnap.docs.forEach(d => batch.delete(d.ref));

      batch.delete(doc(db, "classes", classId));
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting class:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getClassesByTeacher = async (teacherId: string): Promise<ClassWithTeacherInfo[]> => {
    if (!teacherId) return [];
    try {
      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("teacherId", "==", teacherId), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const classes = querySnapshot.docs.map(docSnapshot => ({
        ...(docSnapshot.data() as Class),
        id: docSnapshot.id,
      }));
      return classes;
    } catch (error) {
      console.error("Error fetching classes by teacher:", error);
      return [];
    }
  };

  const getStudentsInMultipleClasses = async (classIds: string[]): Promise<UserProfileWithId[]> => {
    if (!classIds || classIds.length === 0) return [];
    try {
      const q = query(collection(db, "users"), where("role", "==", "student"), where("classIds", "array-contains-any", classIds));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), status: d.data().status || 'active' } as UserProfileWithId));
    } catch (error) {
      console.error("Error fetching students in multiple classes:", error);
      return [];
    }
  };

  const addLearningMaterial = async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return null;
    setLoading(true);
    try {
      const materialWithTimestamp = {
        ...materialData,
        teacherId: materialData.teacherId || currentUser.uid, 
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "learningMaterials"), materialWithTimestamp);
      await updateDoc(doc(db, "learningMaterials", docRef.id), { id: docRef.id }); 
      return docRef.id;
    } catch (error) {
      console.error("Error adding learning material:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLearningMaterialsByTeacher = async (teacherId: string, classId?: string): Promise<LearningMaterial[]> => {
    if (!teacherId) return [];
    try {
      const materialsRef = collection(db, "learningMaterials");
      let q;
      if (classId) {
        q = query(materialsRef, where("teacherId", "==", teacherId), where("classId", "==", classId), orderBy("createdAt", "desc"));
      } else {
        q = query(materialsRef, where("teacherId", "==", teacherId), orderBy("createdAt", "desc"));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningMaterial));
    } catch (error) {
      console.error("Error fetching learning materials by teacher:", error);
      return [];
    }
  };
  
  const getLearningMaterialsByClass = async (classId: string): Promise<LearningMaterial[]> => {
    if (!classId) return [];
    try {
        const materialsRef = collection(db, "learningMaterials");
        const q = query(materialsRef, where("classId", "==", classId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningMaterial));
    } catch (error) {
        console.error("Error fetching materials by class:", error);
        return [];
    }
  };


  const getLearningMaterialsBySchool = async (schoolId: string): Promise<LearningMaterialWithTeacherInfo[]> => {
    if (!schoolId) return [];
    try {
      const materialsRef = collection(db, "learningMaterials");
      const q = query(materialsRef, where("schoolId", "==", schoolId), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const materialsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const material = { id: docSnapshot.id, ...docSnapshot.data() } as LearningMaterial;
        let teacherDisplayName = 'N/A';
        let className = 'General';
        if (material.teacherId) {
          const teacherProfile = await getUserProfile(material.teacherId);
          teacherDisplayName = teacherProfile?.displayName || 'N/A';
        }
        if (material.classId) {
            const classInfo = await getClassDetails(material.classId);
            className = classInfo?.name || 'Unknown Class';
        }
        return { ...material, teacherDisplayName, className };
      });
      
      return Promise.all(materialsPromises);
    } catch (error) {
      console.error("Error fetching learning materials by school:", error);
      return [];
    }
  };

  const deleteLearningMaterial = async (materialId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "learningMaterials", materialId));
      return true;
    } catch (error) {
      console.error("Error deleting learning material:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateLearningMaterial = async (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId' | 'materialType'>>): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try {
      const materialRef = doc(db, "learningMaterials", materialId);
      await updateDoc(materialRef, { ...data, updatedAt: Timestamp.now() });
      return true;
    } catch (error) {
      console.error("Error updating learning material:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getLearningMaterialById = async (materialId: string): Promise<LearningMaterial | null> => {
    try {
      const materialRef = doc(db, "learningMaterials", materialId);
      const materialSnap = await getDoc(materialRef);
      if (materialSnap.exists()) {
        return { id: materialSnap.id, ...materialSnap.data() } as LearningMaterial;
      }
      return null;
    } catch (error) {
      console.error("Error fetching learning material by ID:", error);
      return null;
    }
  };

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'teacher' || !currentUser.schoolId) return null;
    setLoading(true);
    try {
      const dataWithTimestamps: Omit<Assignment, 'id' | 'totalSubmissions'> = {
        ...assignmentData,
        teacherId: currentUser.uid,
        schoolId: currentUser.schoolId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "assignments"), dataWithTimestamps);
      await updateDoc(doc(db, "assignments", docRef.id), { id: docRef.id, totalSubmissions: 0 });
      return docRef.id;
    } catch (error) {
      console.error("Error creating assignment:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentsByTeacher = async (teacherId: string, classId?: string): Promise<AssignmentWithClassInfo[]> => {
    if (!teacherId) return [];
    try {
      const assignmentsRef = collection(db, "assignments");
      let q;
      if (classId) {
        q = query(assignmentsRef, where("teacherId", "==", teacherId), where("classId", "==", classId), orderBy("deadline", "asc"));
      } else {
        q = query(assignmentsRef, where("teacherId", "==", teacherId), orderBy("deadline", "asc"));
      }
      const querySnapshot = await getDocs(q);
      
      const assignmentsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const assignment = { id: docSnapshot.id, ...docSnapshot.data() } as Assignment;
        let className = 'N/A';
        if(assignment.classId) {
          const classInfo = await getClassDetails(assignment.classId);
          className = classInfo?.name || 'Unknown Class';
        }
        return { ...assignment, className, totalSubmissions: assignment.totalSubmissions || 0 };
      });
      return Promise.all(assignmentsPromises);

    } catch (error) {
      console.error("Error fetching assignments by teacher:", error);
      return [];
    }
  };
  
  const getAssignmentsByClass = async (classId: string): Promise<Assignment[]> => {
     if (!classId) return [];
    try {
      const assignmentsRef = collection(db, "assignments");
      const q = query(assignmentsRef, where("classId", "==", classId), orderBy("deadline", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data(), totalSubmissions: docSnap.data().totalSubmissions || 0 } as Assignment));
    } catch (error) {
      console.error("Error fetching assignments by class:", error);
      return [];
    }
  };

  const getAssignmentById = async (assignmentId: string, studentId?: string): Promise<AssignmentWithClassAndSubmissionInfo | null> => {
    try {
      const assignmentRef = doc(db, "assignments", assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);
      if (assignmentSnap.exists()) {
        const assignmentData = assignmentSnap.data() as Assignment;
        let className = 'N/A';
        if(assignmentData.classId) {
          const classInfo = await getClassDetails(assignmentData.classId);
          className = classInfo?.name || 'Unknown Class';
        }
        
        let assignmentWithInfo: AssignmentWithClassAndSubmissionInfo = { ...assignmentData, className, totalSubmissions: assignmentData.totalSubmissions || 0 };

        if (studentId) {
          const submission = await getSubmissionByStudentForAssignment(assignmentId, studentId);
          if (submission) {
            assignmentWithInfo.submissionStatus = submission.status;
            assignmentWithInfo.submissionGrade = submission.grade;
          } else if (currentUser?.studentAssignments?.[assignmentId]) { 
            assignmentWithInfo.submissionStatus = currentUser.studentAssignments[assignmentId].status;
            assignmentWithInfo.submissionGrade = currentUser.studentAssignments[assignmentId].grade;
          }
           else {
            assignmentWithInfo.submissionStatus = 'missing';
          }
        }
        return assignmentWithInfo;
      }
      return null;
    } catch (error) {
      console.error("Error fetching assignment by ID:", error);
      return null;
    }
  };

  const updateAssignment = async (assignmentId: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>): Promise<boolean> => {
     if (!currentUser || currentUser.role !== 'teacher') return false;
    setLoading(true);
    try {
      const assignmentRef = doc(db, "assignments", assignmentId);
      await updateDoc(assignmentRef, { ...data, updatedAt: Timestamp.now() });
      return true;
    } catch (error) {
      console.error("Error updating assignment:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false; 
    setLoading(true);
    try {
      const assignmentDoc = await getAssignmentById(assignmentId);
      if(!assignmentDoc || (currentUser.role === 'teacher' && assignmentDoc.teacherId !== currentUser.uid) ) {
        console.error("Unauthorized to delete assignment or assignment not found.");
        return false;
      }

      const batch = writeBatch(db);
      batch.delete(doc(db, "assignments", assignmentId));
      
      const submissionsQuery = query(collection(db, "submissions"), where("assignmentId", "==", assignmentId));
      const submissionsSnap = await getDocs(submissionsQuery);
      submissionsSnap.docs.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionsForAssignment = async (assignmentId: string): Promise<SubmissionWithStudentName[]> => {
    try {
      const submissionsRef = collection(db, "submissions");
      const q = query(submissionsRef, where("assignmentId", "==", assignmentId), orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const submissionsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const submission = { id: docSnapshot.id, ...docSnapshot.data() } as Submission;
        let studentDisplayName = 'N/A';
        let studentEmail = 'N/A';
        if (submission.studentId) {
          const studentProfile = await getUserProfile(submission.studentId);
          studentDisplayName = studentProfile?.displayName || 'N/A';
          studentEmail = studentProfile?.email || 'N/A';
        }
        return { ...submission, studentDisplayName, studentEmail };
      });
      return Promise.all(submissionsPromises);

    } catch (error) {
      console.error("Error fetching submissions:", error);
      return [];
    }
  };

  const gradeSubmission = async (submissionId: string, grade: string | number, feedback?: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'teacher') return false;
    setLoading(true);
    try {
      const submissionRef = doc(db, "submissions", submissionId);
      const submissionSnap = await getDoc(submissionRef);
      if (!submissionSnap.exists()) return false;

      const submissionData = submissionSnap.data() as Submission;

      const batch = writeBatch(db);
      batch.update(submissionRef, { grade, feedback, status: 'graded', updatedAt: Timestamp.now() });
      
      const studentRef = doc(db, "users", submissionData.studentId);
      const studentAssignmentField = `studentAssignments.${submissionData.assignmentId}`;
      batch.update(studentRef, {
        [studentAssignmentField]: {
          status: 'graded',
          grade: grade,
        }
      });

      await batch.commit();

      if (currentUser.uid === submissionData.studentId) {
        setCurrentUser(prev => prev ? {
          ...prev,
          studentAssignments: {
            ...prev.studentAssignments,
            [submissionData.assignmentId]: { status: 'graded', grade }
          }
        } : null);
      }

      return true;
    } catch (error) {
      console.error("Error grading submission:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionByStudentForAssignment = async (assignmentId: string, studentId: string): Promise<Submission | null> => {
    try {
      const q = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId), where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const submissionDoc = querySnapshot.docs[0];
        return { id: submissionDoc.id, ...submissionDoc.data() } as Submission;
      }
      return null;
    } catch (error) {
      console.error('Error fetching submission by student and assignment:', error);
      return null;
    }
  };

  const addSubmission = async (submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'>): Promise<string | null> => {
    if (!currentUser || currentUser.role !== 'student') return null;
    setLoading(true);
    try {
      const assignment = await getAssignmentById(submissionData.assignmentId);
      if (!assignment) throw new Error("Assignment not found");

      const existingSubmission = await getSubmissionByStudentForAssignment(submissionData.assignmentId, currentUser.uid);
      
      const studentRef = doc(db, "users", currentUser.uid);
      const studentAssignmentField = `studentAssignments.${submissionData.assignmentId}`;
      const isLate = Timestamp.now() > assignment.deadline;
      const newStatus = isLate ? 'late' : 'submitted';

      if (existingSubmission) {
        const submissionRef = doc(db, "submissions", existingSubmission.id);
        const statusUpdate = existingSubmission.status === 'graded' 
          ? 'graded' 
          : newStatus;

        await updateDoc(submissionRef, {
          content: submissionData.content,
          submissionType: submissionData.submissionType,
          submittedAt: Timestamp.now(),
          status: statusUpdate,
          updatedAt: Timestamp.now()
        });
        await updateDoc(studentRef, {
          [studentAssignmentField]: { status: statusUpdate, grade: existingSubmission.grade } 
        });
        setCurrentUser(prev => prev ? { ...prev, studentAssignments: { ...prev.studentAssignments, [submissionData.assignmentId]: { status: statusUpdate, grade: existingSubmission.grade }} } : null);
        return existingSubmission.id;

      } else {
        const dataToSave: Omit<Submission, 'id'> = {
          ...submissionData,
          studentId: currentUser.uid,
          submittedAt: Timestamp.now(),
          status: newStatus,
        };
        const docRef = await addDoc(collection(db, "submissions"), dataToSave);
        await updateDoc(doc(db, "submissions", docRef.id), { id: docRef.id });

        const assignmentRef = doc(db, "assignments", submissionData.assignmentId);
        const assignmentSnap = await getDoc(assignmentRef);
        if (assignmentSnap.exists()) {
            const currentSubmissions = assignmentSnap.data().totalSubmissions || 0;
            await updateDoc(assignmentRef, { totalSubmissions: currentSubmissions + 1 });
        }

        await updateDoc(studentRef, {
          [studentAssignmentField]: { status: dataToSave.status }
        });
        setCurrentUser(prev => prev ? { ...prev, studentAssignments: { ...prev.studentAssignments, [submissionData.assignmentId]: {status: dataToSave.status }} } : null);

        return docRef.id;
      }

    } catch (error) {
      console.error("Error adding/updating submission:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

   const getAssignmentsForStudentByClass = async (classId: string, studentId: string): Promise<AssignmentWithClassAndSubmissionInfo[]> => {
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'teacher' && currentUser.role !== 'admin') ) return [];
    if (currentUser.role === 'student' && currentUser.uid !== studentId) return []; 

    const assignments = await getAssignmentsByClass(classId);
    const assignmentsWithStatus: AssignmentWithClassAndSubmissionInfo[] = [];
    const studentProfile = await getUserProfile(studentId); 

    for (const assignment of assignments) {
      const submission = await getSubmissionByStudentForAssignment(assignment.id, studentId);
      const classInfo = await getClassDetails(assignment.classId);
      
      let status: AssignmentWithClassAndSubmissionInfo['submissionStatus'] = 'missing';
      let grade: AssignmentWithClassAndSubmissionInfo['submissionGrade'] = undefined;

      if (submission) {
        status = submission.status;
        grade = submission.grade;
      } else if (studentProfile?.studentAssignments?.[assignment.id]) { 
        status = studentProfile.studentAssignments[assignment.id].status;
        grade = studentProfile.studentAssignments[assignment.id].grade;
      }
      
      assignmentsWithStatus.push({
        ...assignment,
        className: classInfo?.name || 'N/A',
        submissionStatus: status,
        submissionGrade: grade,
      });
    }
    return assignmentsWithStatus.sort((a, b) => a.deadline.toMillis() - b.deadline.toMillis());
  };


  const updateUserDisplayName = async (userId: string, displayName: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await updateFirebaseProfile(auth.currentUser, { displayName });
      }
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { displayName, updatedAt: Timestamp.now() });
      if (currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? { ...prev, displayName } : null);
      }
      return true;
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
      // IMPORTANT: For actual email update in Firebase Auth, re-authentication is required.
      // This simplified version only updates the email in Firestore.
      // await updateEmail(auth.currentUser, newEmail); // This would require re-auth
      console.warn("Email update is simplified and only updates Firestore. For Firebase Auth email change, re-authentication is needed.");
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { email: newEmail, updatedAt: Timestamp.now() });
       if (currentUser) {
        setCurrentUser(prev => prev ? { ...prev, email: newEmail } : null);
      }
      return true;
    } catch (error) {
      console.error("Error updating email in Firestore (Auth email not changed):", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserPassword = async (newPassword: string, currentPassword_not_used: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setLoading(true);
    try {
      // IMPORTANT: For actual password update in Firebase Auth, re-authentication may be required by Firebase.
      // This simplified version attempts direct update.
      console.warn("Password update is simplified. Firebase may require re-authentication for this action to succeed.");
      await updateFirebasePassword(auth.currentUser, newPassword);
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };


  const value = {
    currentUser,
    loading,
    signUp,
    logIn,
    logOut,
    createSchool,
    joinSchoolWithInviteCode,
    checkAdminOnboardingStatus,
    getSchoolDetails,
    updateSchoolDetails,
    regenerateInviteCode,
    getUsersBySchool,
    getUsersBySchoolAndRole,
    adminCreateUserInSchool,
    updateUserRoleAndSchool,
    getUserProfile,
    approveUserForSchool,
    createClassInSchool,
    getClassesBySchool,
    getClassesByIds,
    getClassDetails,
    updateClassDetails,
    enrollStudentInClass,
    removeStudentFromClass,
    getStudentsInClass,
    getStudentsNotInClass,
    deleteClass,
    regenerateClassInviteCode,
    joinClassWithCode,
    getClassesByTeacher,
    getStudentsInMultipleClasses,
    addLearningMaterial,
    getLearningMaterialsByTeacher,
    getLearningMaterialsBySchool,
    getLearningMaterialsByClass,
    deleteLearningMaterial,
    updateLearningMaterial,
    getLearningMaterialById,
    createAssignment,
    getAssignmentsByTeacher,
    getAssignmentsByClass,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    getSubmissionsForAssignment,
    gradeSubmission,
    getSubmissionByStudentForAssignment,
    addSubmission,
    getAssignmentsForStudentByClass,
    updateUserDisplayName,
    updateUserEmail,
    updateUserPassword,
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

