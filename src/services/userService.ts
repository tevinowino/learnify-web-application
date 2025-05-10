
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile as updateFirebaseProfile, type Auth as FirebaseAuthType, type User as FirebaseUserType } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { UserProfile, UserProfileWithId, UserRole, UserStatus } from '@/types';

export const createUserProfileInFirestore = async (
  firebaseUser: FirebaseUserType,
  role: UserRole,
  displayName: string,
  schoolIdToJoin?: string,
  schoolName?: string
): Promise<UserProfile> => {
  const userProfileData: Omit<UserProfile, keyof FirebaseUserType | 'classIds' | 'studentAssignments'> & { uid: string, createdAt: Timestamp, classIds: string[], studentAssignments: {}, status: UserStatus, schoolId?: string, schoolName?: string } = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName,
    role: role,
    createdAt: Timestamp.now(),
    classIds: [],
    studentAssignments: {},
    status: (role === 'teacher' || role === 'student') && schoolIdToJoin ? 'pending_verification' : 'active',
    schoolId: (role === 'teacher' || role === 'student') ? schoolIdToJoin : undefined,
    schoolName: (role === 'teacher' || role === 'student') ? schoolName : undefined,
  };
  await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
  return {
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
};

export const getUserProfileService = async (userId: string): Promise<UserProfileWithId | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return { id: userDocSnap.id, ...data, status: data.status || 'active' } as UserProfileWithId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile in service:", error);
    return null;
  }
};

export const updateUserDisplayNameService = async (userId: string, displayName: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { displayName, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating display name in service:", error);
    return false;
  }
};

export const updateUserEmailInFirestore = async (userId: string, newEmail: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { email: newEmail, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating email in Firestore (service):", error);
    return false;
  }
};

export const getUsersBySchoolService = async (schoolId: string): Promise<UserProfileWithId[]> => {
  if (!schoolId) return [];
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("schoolId", "==", schoolId));
    const querySnapshot = await getDocs(q);
    // Client-side sorting for consistency as orderBy was removed
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'active' } as UserProfileWithId));
    return users.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  } catch (error) {
    console.error("Error fetching users by school in service:", error);
    return [];
  }
};

export const getUsersBySchoolAndRoleService = async (schoolId: string, role: UserRole): Promise<UserProfileWithId[]> => {
  if (!schoolId || !role) return [];
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("schoolId", "==", schoolId), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    // Client-side sorting for consistency
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'active' } as UserProfileWithId));
    return users.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  } catch (error) {
    console.error("Error fetching users by school and role in service:", error);
    return [];
  }
};

export const adminCreateUserService = async (
  authInstance: FirebaseAuthType,
  email: string, pass: string, displayName: string, role: UserRole, schoolId: string, schoolName?: string
): Promise<UserProfileWithId | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      await updateFirebaseProfile(firebaseUser, { displayName });
      const userProfileData = {
        uid: firebaseUser.uid, 
        email: firebaseUser.email,
        displayName: displayName,
        role: role,
        schoolId: schoolId,
        schoolName: schoolName || 'Unknown School',
        createdAt: Timestamp.now(),
        classIds: [],
        studentAssignments: {},
        status: 'active' as UserStatus, // Admin created users are active immediately
      };
      await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
      return { id: firebaseUser.uid, ...userProfileData } as UserProfileWithId;
    }
    return null;
  } catch (error) {
    console.error("Error in adminCreateUserService:", error);
    throw error; // Re-throw to be caught by AuthContext
  }
};

export const updateUserRoleAndSchoolService = async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus }): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const updateData: any = { ...data, updatedAt: Timestamp.now() };
     if (data.classIds === null) { 
        updateData.classIds = [];
      }
    if (data.role && !data.status) { // If role is changing, ensure status is active unless specified
        updateData.status = 'active';
    }
    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating user role/school/status in service:", error);
    return false;
  }
};

export const approveUserService = async (userId: string, schoolId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    // When approving, if schoolId wasn't set during signup (e.g. for Admin self-onboarding), set it now.
    // Also, ensure their status becomes active.
    const schoolDocRef = doc(db, "schools", schoolId);
    const schoolSnap = await getDoc(schoolDocRef);
    const schoolName = schoolSnap.exists() ? schoolSnap.data().name : 'Unknown School';

    await updateDoc(userRef, { status: 'active', schoolId, schoolName, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error approving user in service:", error);
    return false;
  }
};

export const completeStudentOnboardingService = async (userId: string, classId: string, subjectIds: string[]): Promise<boolean> => {
  if (!userId || !classId || !subjectIds) return false;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      classIds: [classId], // Student is typically in one primary class, can be expanded later if needed
      subjects: subjectIds,
      updatedAt: Timestamp.now(),
      // Optionally, set a flag like `hasCompletedOnboarding: true` if needed
    });
    return true;
  } catch (error) {
    console.error("Error completing student onboarding in service:", error);
    return false;
  }
};
