
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
  childStudentId?: string,
  initialOnboardingStep?: number | null
): Promise<UserProfile> => {
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
    onboardingStep: (role === 'admin' && !initialSchoolId) ? (initialOnboardingStep !== undefined ? initialOnboardingStep : 0) : null,
  };

  if (initialSchoolId) userProfileData.schoolId = initialSchoolId;
  if (initialSchoolName) userProfileData.schoolName = initialSchoolName;
  if (role === 'parent' && childStudentId) userProfileData.childStudentId = childStudentId;
  if (userProfileData.lastTestimonialSurveyAt === undefined) userProfileData.lastTestimonialSurveyAt = null;


  // If admin is new and creating a school (onboardingStep 0), schoolId/Name are not set yet on the user profile explicitly by this function call.
  // They will be set later when the school is actually created.
  if (role === 'admin' && userProfileData.onboardingStep === 0) {
    delete userProfileData.schoolId; // Omit if undefined
    delete userProfileData.schoolName; // Omit if undefined
  }
  if (childStudentId === undefined) delete userProfileData.childStudentId;


  await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);

  const completeProfile: UserProfile = {
    ...firebaseUser, 
    ...userProfileData, 
    uid: firebaseUser.uid, 
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
        onboardingStep: data.onboardingStep === undefined ? null : data.onboardingStep, 
        lastTestimonialSurveyAt: data.lastTestimonialSurveyAt || null,
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
      const userProfileData: any = { 
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
        lastTestimonialSurveyAt: null,
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

export const updateUserRoleAndSchoolService = async (userId: string, data: { role?: UserRole; schoolId?: string, schoolName?: string, classIds?: string[], status?: UserStatus, subjects?: string[], onboardingStep?: number | null }): Promise<boolean> => {
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
    if (data.onboardingStep === undefined && data.onboardingStep !== null) { 
        delete updateData.onboardingStep;
    } else if (data.onboardingStep === null) {
        updateData.onboardingStep = null;
    }

    // Ensure schoolName is updated if schoolId is updated and schoolName is provided
    if(data.schoolId && data.schoolName){
      updateData.schoolName = data.schoolName;
    } else if (data.schoolId && !data.schoolName) {
      // If schoolId is updated but schoolName is not, attempt to fetch it
      const schoolDetails = await getDoc(doc(db, "schools", data.schoolId));
      if(schoolDetails.exists()){
        updateData.schoolName = schoolDetails.data().name;
      }
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
      // Check if a user with this email already exists in Firestore to prevent re-creating a profile for an existing Firebase Auth user
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", user.email));
      const existingUserSnap = await getDocs(q);

      if (!existingUserSnap.empty) {
          // User profile already exists, perhaps update their status or school if applicable
          // For now, we'll assume if they exist, we don't re-create or significantly alter them here.
          // This logic might need refinement based on how you want to handle existing users being "invited".
          console.warn(`User profile for ${user.email} already exists. Skipping profile creation.`);
          continue; 
      }


      const newUserRef = doc(collection(db, "users")); 
      const userProfileData: any = {
        uid: newUserRef.id, // This will be a new ID, which is problematic if an Auth account exists for this email.
                           // The ideal flow would be to check Firebase Auth first.
                           // For simplicity in this onboarding step, we're focusing on Firestore profiles.
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
        lastTestimonialSurveyAt: null,
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
