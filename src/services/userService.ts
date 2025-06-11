
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
  // Base object with guaranteed fields
  const userProfileData: any = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName,
    role: role,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(), // Added updatedAt
    classIds: [],
    subjects: [],
    studentAssignments: {},
    status: initialStatus || ((role === 'teacher' || role === 'student') && initialSchoolId ? 'pending_verification' : 'active'),
    onboardingStep: (role === 'admin' && !initialSchoolId) ? 0 : null,
    // lastTestimonialSurveyAt will be set when they first interact with the survey
  };

  // Conditionally add optional fields only if they have a value
  if (initialSchoolId) {
    userProfileData.schoolId = initialSchoolId;
  }
  if (initialSchoolName) {
    userProfileData.schoolName = initialSchoolName;
  }
  if (role === 'parent' && childStudentId) {
    userProfileData.childStudentId = childStudentId;
  }

  // If admin is new and creating a school (onboardingStep 0), schoolId/Name are not set yet.
  if (role === 'admin' && userProfileData.onboardingStep === 0) {
    delete userProfileData.schoolId;
    delete userProfileData.schoolName;
  }

  await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);

  // Construct the return object matching UserProfile type by spreading firebaseUser and then our Firestore data
  const completeProfile: UserProfile = {
    ...firebaseUser, // Spreads properties from FirebaseUser like photoURL, emailVerified etc.
    ...userProfileData, // Spreads properties we just defined for Firestore
    uid: firebaseUser.uid, // Ensure uid is correctly part of the returned object
  };
  return completeProfile;
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
      const userProfileData: any = { // Use any to build the object conditionally
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        role: role,
        schoolId: schoolId,
        schoolName: schoolName || 'Unknown School',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        classIds: [],
        subjects: [],
        studentAssignments: {},
        status: 'active' as UserStatus,
        onboardingStep: null,
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
    if (data.onboardingStep === undefined && data.onboardingStep !== null) { // If onboardingStep is not explicitly passed as null or a number, don't change it.
        delete updateData.onboardingStep;
    } else if (data.onboardingStep === null) {
        updateData.onboardingStep = null;
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

    const mainClassId = classIds[0]; // Assuming the first classId is the main class
    const classDetails = await getClassDetailsService(mainClassId, getUserProfileService); // Pass getUserProfileService
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
  authInstance: FirebaseAuthType, // Not used for creating Auth accounts here
  schoolId: string,
  schoolName: string,
  usersToInvite: Array<{ email: string; displayName: string; role: 'teacher' | 'student' }>
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    for (const user of usersToInvite) {
      const newUserRef = doc(collection(db, "users")); 
      const userProfileData: any = {
        uid: newUserRef.id, 
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        schoolId: schoolId,
        schoolName: schoolName,
        status: 'pending_verification' as UserStatus, 
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        classIds: [],
        subjects: [],
        onboardingStep: null,
      };
      batch.set(newUserRef, userProfileData);
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error inviting users during onboarding in service:", error);
    return false;
  }
};

