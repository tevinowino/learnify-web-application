
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, Timestamp, arrayUnion, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile as updateFirebaseProfile, type Auth as FirebaseAuthType, type User as FirebaseUserType } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { UserProfile, UserProfileWithId, UserRole, UserStatus } from '@/types';
import { getClassDetailsService } from './classService'; 

export const createUserProfileInFirestore = async (
  firebaseUser: FirebaseUserType,
  role: UserRole,
  displayName: string,
  initialSchoolId?: string, 
  initialSchoolName?: string,
  initialStatus?: UserStatus, 
  childStudentId?: string 
): Promise<UserProfile> => {
  const userProfileData: Omit<UserProfile, keyof FirebaseUserType | 'classIds' | 'studentAssignments'> & { uid: string, createdAt: Timestamp, classIds: string[], studentAssignments: {}, status: UserStatus, schoolId?: string, schoolName?: string, subjects?: string[], childStudentId?: string, onboardingStep?: number | null, lastTestimonialSurveyAt?: Timestamp } = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName,
    role: role,
    createdAt: Timestamp.now(),
    classIds: [],
    subjects: [],
    studentAssignments: {},
    status: initialStatus || ((role === 'teacher' || role === 'student') && initialSchoolId ? 'pending_verification' : 'active'),
    schoolId: initialSchoolId,
    schoolName: initialSchoolName,
    childStudentId: role === 'parent' ? childStudentId : undefined,
    onboardingStep: role === 'admin' && !initialSchoolId ? 0 : null, // Initialize for new admins
    lastTestimonialSurveyAt: undefined,
  };

  if (role === 'admin' && !initialSchoolId) {
    // School ID and name will be set after school creation step in onboarding
    delete userProfileData.schoolId;
    delete userProfileData.schoolName;
    userProfileData.status = 'active'; // Admins creating schools are active
  }


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
      return {
        id: userDocSnap.id,
        ...data,
        status: data.status || (data.role === 'admin' ? 'active' : 'pending_verification'),
        subjects: data.subjects || [],
        classIds: data.classIds || [],
        onboardingStep: data.onboardingStep === undefined ? null : data.onboardingStep, // Ensure default
      } as UserProfileWithId;
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
        subjects: [],
        studentAssignments: {},
        status: 'active' as UserStatus, // Directly created by admin, so active
        onboardingStep: null, // Not part of admin onboarding flow for this user
        lastTestimonialSurveyAt: undefined,
      };
      await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
      return { id: firebaseUser.uid, ...userProfileData } as UserProfileWithId;
    }
    return null;
  } catch (error) {
    console.error("Error in adminCreateUserService:", error);
    throw error;
  }
};

export const updateUserRoleAndSchoolService = async (userId: string, data: { role?: UserRole; schoolId?: string, classIds?: string[], status?: UserStatus, subjects?: string[], onboardingStep?: number | null }): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const updateData: any = { ...data, updatedAt: Timestamp.now() };
     if (data.classIds === null) {
        updateData.classIds = [];
      }
    if (data.role && !data.status && data.status !== 'rejected') {
        updateData.status = 'active';
    }
    if (data.subjects && Array.isArray(data.subjects)) {
        updateData.subjects = data.subjects;
    } else if (data.subjects === null) {
        updateData.subjects = [];
    }
    if (data.onboardingStep === undefined) { // If onboardingStep is not explicitly passed, don't change it.
        delete updateData.onboardingStep;
    }

    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating user role/school/status/subjects/onboardingStep in service:", error);
    return false;
  }
};

export const approveUserService = async (userId: string, schoolId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
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

export const completeStudentOnboardingService = async (userId: string, classIds: string[], subjectIds: string[]): Promise<boolean> => {
  if (!userId || !classIds || classIds.length === 0 || !subjectIds) return false;
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;

    const userData = userSnap.data() as UserProfile;
    let finalSubjectIds = new Set(subjectIds);

    const mainClassId = classIds[0];
    const classDetails = await getClassDetailsService(mainClassId, getUserProfileService);
    if (classDetails?.classType === 'main' && classDetails.compulsorySubjectIds) {
      classDetails.compulsorySubjectIds.forEach(id => finalSubjectIds.add(id));
    }

    const batch = writeBatch(db);
    batch.update(userRef, {
      classIds: classIds,
      subjects: Array.from(finalSubjectIds),
      updatedAt: Timestamp.now(),
    });

    for (const classId of classIds) {
        const classRef = doc(db, "classes", classId);
        batch.update(classRef, { studentIds: arrayUnion(userId), updatedAt: Timestamp.now() });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error completing student onboarding in service:", error);
    return false;
  }
};

export const updateUserLastTestimonialSurveyAtService = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastTestimonialSurveyAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error("Error updating lastTestimonialSurveyAt in service:", error);
    return false;
  }
};

export const onboardingInviteUsersService = async (
  authInstance: FirebaseAuthType,
  schoolId: string,
  schoolName: string,
  usersToInvite: Array<{ email: string; displayName: string; role: 'teacher' | 'student' }>
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    for (const user of usersToInvite) {
      // For onboarding, we'll create their Firestore profile with 'pending_verification'
      // They will need to complete signup themselves (or be manually activated by admin later).
      // This assumes the admin is just "inviting" them to join, not creating full Auth accounts yet.
      const newUserRef = doc(collection(db, "users")); // Auto-generate ID for Firestore doc
      const userProfileData = {
        uid: newUserRef.id, // Using Firestore doc ID as temp UID if no Auth user created
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        schoolId: schoolId,
        schoolName: schoolName,
        status: 'pending_verification' as UserStatus, // Or a new status like 'invited'
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        classIds: [],
        subjects: [],
        onboardingStep: null,
      };
      batch.set(newUserRef, userProfileData);
      // Here, you would typically send an email invitation to user.email
      // For example: `sendInvitationEmail(user.email, schoolName, inviteCodeForSchool);`
      // The user would then click a link in the email to sign up for Learnify using this school ID.
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error inviting users during onboarding in service:", error);
    return false;
  }
};
