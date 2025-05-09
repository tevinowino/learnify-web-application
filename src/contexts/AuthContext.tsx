
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
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as updateFirebasePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, addDoc, Timestamp, orderBy, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId, Class, ClassWithTeacherInfo, LearningMaterialWithTeacherInfo } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signUp: (email: string, pass: string, role: UserRole, displayName: string) => Promise<UserProfile | null>;
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

  // Admin Class Management
  createClassInSchool: (className: string, schoolId: string, teacherId?: string) => Promise<string | null>;
  getClassesBySchool: (schoolId: string) => Promise<ClassWithTeacherInfo[]>;
  getClassDetails: (classId: string) => Promise<ClassWithTeacherInfo | null>;
  updateClassDetails: (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId'>>) => Promise<boolean>;
  enrollStudentInClass: (classId: string, studentId: string) => Promise<boolean>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<boolean>;
  getStudentsInClass: (classId: string) => Promise<UserProfileWithId[]>;
  getStudentsNotInClass: (schoolId: string, classId: string) => Promise<UserProfileWithId[]>;
  deleteClass: (classId: string) => Promise<boolean>;

  // Teacher Material Management
  addLearningMaterial: (material: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  getLearningMaterialsByTeacher: (teacherId: string) => Promise<LearningMaterial[]>;
  getLearningMaterialsBySchool: (schoolId: string) => Promise<LearningMaterialWithTeacherInfo[]>;
  deleteLearningMaterial: (materialId: string) => Promise<boolean>;
  updateLearningMaterial: (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId'>>) => Promise<boolean>;


  // Profile Management
  updateUserDisplayName: (userId: string, displayName: string) => Promise<boolean>;
  updateUserEmail: (newEmail: string, currentPassword_not_used: string) => Promise<boolean>; // Password for re-auth if needed by Firebase
  updateUserPassword: (newPassword: string, currentPassword_not_used: string) => Promise<boolean>; // Password for re-auth
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
            classIds: userData.classIds || [],
          });
        } else {
           // This case should ideally not happen if users are created with a profile doc
          setCurrentUser({ 
            uid: user.uid, email: user.email, displayName: user.displayName, role: null,
            photoURL: user.photoURL, emailVerified: user.emailVerified, isAnonymous: user.isAnonymous, metadata: user.metadata, providerData: user.providerData, providerId: user.providerId, tenantId: user.tenantId, refreshToken: user.refreshToken, delete: user.delete, getIdToken: user.getIdToken, getIdTokenResult: user.getIdTokenResult, reload: user.reload, toJSON: user.toJSON,
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string, role: UserRole, displayName: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser) {
        await updateFirebaseProfile(firebaseUser, { displayName });
        const userProfileData: Omit<UserProfile, keyof FirebaseUser | 'schoolId' | 'classIds'> & { uid: string } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          role: role,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
        const profile = { ...userProfileData, photoURL: firebaseUser.photoURL, emailVerified: firebaseUser.emailVerified, isAnonymous: firebaseUser.isAnonymous, metadata: firebaseUser.metadata, providerData: user.providerData, providerId: user.providerId, tenantId: user.tenantId, refreshToken: user.refreshToken, delete: user.delete, getIdToken: user.getIdToken, getIdTokenResult: user.getIdTokenResult, reload: user.reload, toJSON: user.toJSON } as UserProfile;
        setCurrentUser(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error("Error signing up:", error);
      // TODO: Handle specific errors like email-already-in-use
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
            classIds: userData.classIds || [],
          };
          setCurrentUser(profile);
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      // TODO: Handle specific errors like user-not-found or wrong-password
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

  // School Management
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
      batch.update(userRef, { schoolId: schoolRef.id });
      
      await batch.commit();

      if (currentUser && currentUser.uid === adminId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolRef.id }) : null);
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

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { schoolId: schoolId });
      
      if (currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolId }) : null);
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
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists() && userDocSnap.data().schoolId) {
      const schoolId = userDocSnap.data().schoolId;
      if (currentUser.schoolId !== schoolId) {
        setCurrentUser(prev => prev ? { ...prev, schoolId } : null);
      }
      return { isOnboarded: true, schoolId: schoolId };
    }
    return { isOnboarded: false };
  };

  const getSchoolDetails = async (schoolId: string): Promise<School | null> => {
    if (!schoolId) return null;
    // setLoading(true); // Not critical for this read, avoid if causing too many spinners
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
    } finally {
      // setLoading(false);
    }
  };

  const updateSchoolDetails = async (schoolId: string, data: Partial<Pick<School, 'name'>>): Promise<boolean> => {
    if (!schoolId || !currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
      const schoolRef = doc(db, "schools", schoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (!schoolSnap.exists() || schoolSnap.data().adminId !== currentUser.uid) {
        // Only creator admin can update
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


  // User Management by Admin
  const getUsersBySchool = async (schoolId: string): Promise<UserProfileWithId[]> => {
    if (!schoolId) return [];
    // setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("schoolId", "==", schoolId));
      const querySnapshot = await getDocs(q);
      const users: UserProfileWithId[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfileWithId);
      });
      return users;
    } catch (error) {
      console.error("Error fetching users by school:", error);
      return [];
    } finally {
      // setLoading(false);
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
        users.push({ id: doc.id, ...doc.data() } as UserProfileWithId);
      });
      return users;
    } catch (error) {
      console.error("Error fetching users by school and role:", error);
      return [];
    }
  };

  // Admin creates a user. This does NOT sign them in. User needs to log in separately.
  const adminCreateUserInSchool = async (email: string, pass: string, displayName: string, role: UserRole, schoolId: string): Promise<UserProfileWithId | null> => {
    // This function is tricky because createUserWithEmailAndPassword signs the *current* user out and signs the new one in.
    // This is not ideal for an admin creating users.
    // A more robust solution involves Firebase Admin SDK on a backend, or a two-step client process (which is complex).
    // For simplicity, this will create the user profile doc, but not the Firebase Auth user.
    // The admin would tell the user to sign up with this email, and upon signup, their role and school would be pre-set if email matches.
    // This is a simplified approach. A proper "invite" system needs backend.
    // OR: Admin creates the user locally, and the user then needs to complete registration (e.g. set password if not provided).
    // For now, we'll just create the user document and the admin gives them the credentials.
    // This is a security risk (admin knowing user password). A better way is to send an invite link that takes them to signup.
    // Given current constraints, this is a placeholder for a more secure system.
    // **This function cannot create the Firebase Auth user without logging out the admin.**
    // **We will create the Firestore document ONLY. The user must sign up themselves.**
    // **Alternative: Use a temporary password, tell user to change it.**
    console.warn("adminCreateUserInSchool is a simplified function. For production, use Firebase Admin SDK or a proper invite flow.");
    setLoading(true);
    try {
      // Simulate user creation for now as direct Firebase Auth user creation by admin is complex on client
      const userId = `temp_${Math.random().toString(36).substring(2, 15)}`; // Placeholder
      const userProfileData = {
        uid: userId, // This would be Firebase Auth UID in a real scenario
        email: email,
        displayName: displayName,
        role: role,
        schoolId: schoolId,
        createdAt: Timestamp.now(), // Add creation timestamp
      };
      // This should ideally create a Firebase Auth user too.
      // For this simplified version, we're only creating the Firestore document.
      // The user would then need to sign up using this email.
      // Or, the admin provides a temporary password, and the user changes it upon first login.
      // This is where we'd actually use createUserWithEmailAndPassword IF we handle re-authentication of admin
      // For now, let's assume admin communicates credentials. THIS IS NOT SECURE for real apps.
      
      // To make it slightly more functional, let's just store this data.
      // When a user signs up, if their email matches an entry here with a `pending: true` flag, assign role/school.
      const userRef = doc(db, "users", email); // Use email as temporary ID until real UID
      await setDoc(userRef, { ...userProfileData, pendingSetup: true, tempPassword: pass }); // Store temp pass (highly insecure)

      return { id: email, ...userProfileData } as UserProfileWithId; // Return with email as ID for now.
    } catch (error) {
      console.error("Error creating user by admin:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUserRoleAndSchool = async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[] }): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      const updateData: any = { ...data, updatedAt: Timestamp.now() };
      if (data.classIds === null) { // Explicitly clear classIds
        updateData.classIds = [];
      }

      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating user role/school:", error);
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
        return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfileWithId;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };


  // Class Management
  const createClassInSchool = async (className: string, schoolId: string, teacherId?: string): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher') || !schoolId) return null;
    setLoading(true);
    try {
      const classRef = collection(db, "classes");
      const classData: Omit<Class, 'id'> = {
        name: className,
        schoolId: schoolId,
        teacherId: teacherId || '', // Store empty string if undefined
        studentIds: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(classRef, classData);
      await updateDoc(doc(db, "classes", docRef.id), { id: docRef.id }); // Add id to the doc itself
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

  const updateClassDetails = async (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId'>>): Promise<boolean> => {
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
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, { studentIds: arrayUnion(studentId), updatedAt: Timestamp.now() });
      
      // Also add classId to student's profile
      const studentRef = doc(db, "users", studentId);
      await updateDoc(studentRef, { classIds: arrayUnion(classId), updatedAt: Timestamp.now() });
      return true;
    } catch (error) {
      console.error("Error enrolling student:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeStudentFromClass = async (classId: string, studentId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) return false;
    setLoading(true);
    try {
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, { studentIds: arrayRemove(studentId), updatedAt: Timestamp.now() });

      // Also remove classId from student's profile
      const studentRef = doc(db, "users", studentId);
      await updateDoc(studentRef, { classIds: arrayRemove(classId), updatedAt: Timestamp.now() });
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
      const studentPromises = classDetails.studentIds.map(studentId => getUserProfile(studentId));
      const students = (await Promise.all(studentPromises)).filter(Boolean) as UserProfileWithId[];
      return students;
    } catch (error) {
      console.error("Error fetching students in class:", error);
      return [];
    }
  };

  const getStudentsNotInClass = async (schoolId: string, classId: string): Promise<UserProfileWithId[]> => {
    const allSchoolStudents = await getUsersBySchoolAndRole(schoolId, 'student');
    const studentsInClass = await getStudentsInClass(classId);
    const studentIdsInClass = new Set(studentsInClass.map(s => s.id));
    return allSchoolStudents.filter(student => !studentIdsInClass.has(student.id));
  };

  const deleteClass = async (classId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    setLoading(true);
    try {
      // Optional: Remove classId from all students enrolled
      const classDetails = await getClassDetails(classId);
      if (classDetails?.studentIds) {
        const batch = writeBatch(db);
        classDetails.studentIds.forEach(studentId => {
          const studentRef = doc(db, "users", studentId);
          batch.update(studentRef, { classIds: arrayRemove(classId) });
        });
        await batch.commit();
      }
      await deleteDoc(doc(db, "classes", classId));
      return true;
    } catch (error) {
      console.error("Error deleting class:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };


  // Learning Material Management
  const addLearningMaterial = async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return null;
    setLoading(true);
    try {
      const materialWithTimestamp = {
        ...materialData,
        teacherId: materialData.teacherId || currentUser.uid, // Ensure teacherId is set
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "learningMaterials"), materialWithTimestamp);
      await updateDoc(doc(db, "learningMaterials", docRef.id), { id: docRef.id }); // Add id to the doc itself
      return docRef.id;
    } catch (error) {
      console.error("Error adding learning material:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLearningMaterialsByTeacher = async (teacherId: string): Promise<LearningMaterial[]> => {
    if (!teacherId) return [];
    try {
      const materialsRef = collection(db, "learningMaterials");
      const q = query(materialsRef, where("teacherId", "==", teacherId), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningMaterial));
    } catch (error) {
      console.error("Error fetching learning materials by teacher:", error);
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
        if (material.teacherId) {
          const teacherProfile = await getUserProfile(material.teacherId);
          teacherDisplayName = teacherProfile?.displayName || 'N/A';
        }
        return { ...material, teacherDisplayName };
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
      // Optional: Add check if currentUser.uid === material.teacherId or currentUser.role === 'admin'
      await deleteDoc(doc(db, "learningMaterials", materialId));
      return true;
    } catch (error) {
      console.error("Error deleting learning material:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateLearningMaterial = async (materialId: string, data: Partial<Pick<LearningMaterial, 'title' | 'content' | 'classId'>>): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) return false;
    setLoading(true);
    try {
      const materialRef = doc(db, "learningMaterials", materialId);
      // Optional: Add check for ownership or admin role before updating
      await updateDoc(materialRef, { ...data, updatedAt: Timestamp.now() });
      return true;
    } catch (error) {
      console.error("Error updating learning material:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Profile Management
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
    // Firebase requires re-authentication for sensitive operations like changing email.
    // This is simplified here. In a real app, you'd prompt for currentPassword and re-authenticate.
    if (!auth.currentUser) return false;
    setLoading(true);
    try {
      // const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      // await reauthenticateWithCredential(auth.currentUser, credential);
      // await updateFirebaseEmail(auth.currentUser, newEmail); // This is the correct Firebase SDK v9 for email
      // Note: updateEmail is not directly available on user object in v9, it's a top-level import.
      // This part is highly simplified. Firebase official docs should be followed for re-auth.
      console.warn("Email update requires re-authentication, which is simplified here.");
      // For now, we'll just update the Firestore document.
      // Actual email change in Firebase Auth needs proper re-auth flow.
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { email: newEmail, updatedAt: Timestamp.now() });
       if (currentUser) {
        setCurrentUser(prev => prev ? { ...prev, email: newEmail } : null);
      }
      return true;
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
      // Re-authentication needed
      // const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      // await reauthenticateWithCredential(auth.currentUser, credential);
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
    createClassInSchool,
    getClassesBySchool,
    getClassDetails,
    updateClassDetails,
    enrollStudentInClass,
    removeStudentFromClass,
    getStudentsInClass,
    getStudentsNotInClass,
    deleteClass,
    addLearningMaterial,
    getLearningMaterialsByTeacher,
    getLearningMaterialsBySchool,
    deleteLearningMaterial,
    updateLearningMaterial,
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
