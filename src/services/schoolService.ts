
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { School, OnboardingSchoolData } from '@/types';

export const onboardingCreateSchoolService = async (
  adminId: string,
  schoolData: OnboardingSchoolData,
): Promise<{ schoolId: string; inviteCode: string } | null> => {
  try {
    const inviteCode = `SCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const schoolRef = doc(collection(db, "schools")); // Auto-generate ID

    const newSchool: School = {
      id: schoolRef.id,
      name: schoolData.schoolName,
      adminId: adminId, // Set the creator admin
      inviteCode: inviteCode,
      schoolType: schoolData.schoolType,
      country: schoolData.country,
      phoneNumber: schoolData.phoneNumber,
      setupComplete: false, // School setup is not yet complete
      isExamModeActive: false, // Default exam mode to off
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(schoolRef, newSchool); // Create the school document

    return { schoolId: schoolRef.id, inviteCode };
  } catch (error) {
    console.error("Error in onboardingCreateSchoolService:", error);
    return null;
  }
};


export const createSchoolService = async (schoolName: string, adminId: string): Promise<string | null> => {
  try {
    const inviteCode = `SCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const schoolRef = doc(collection(db, "schools"));
    const schoolData: School = {
      id: schoolRef.id,
      name: schoolName,
      adminId: adminId,
      inviteCode: inviteCode,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isExamModeActive: false, 
      setupComplete: true, 
    };
    
    await setDoc(schoolRef, schoolData);
    
    // Note: Linking admin to this school should happen in AuthProvider or a higher-level function
    // to ensure consistency, especially if the user profile might not exist yet.
    // For this specific function, if it's called outside onboarding, the calling context should handle user updates.

    return schoolRef.id;
  } catch (error) {
    console.error("Error creating school in service:", error);
    return null;
  }
};

export const joinSchoolWithInviteCodeService = async (inviteCode: string, userId: string): Promise<School | null> => {
  try {
    const schoolsRef = collection(db, "schools");
    const q = query(schoolsRef, where("inviteCode", "==", inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("Invalid invite code");
      return null;
    }

    const schoolDoc = querySnapshot.docs[0];
    const schoolId = schoolDoc.id;
    const schoolData = schoolDoc.data() as School;

    // The user document update should ideally happen in AuthProvider after this service call returns.
    // This service focuses on finding the school.
    
    return schoolData;
  } catch (error) {
    console.error("Error joining school in service:", error);
    return null;
  }
};

export const getSchoolDetailsService = async (schoolId: string): Promise<School | null> => {
  if (!schoolId) return null;
  try {
    const schoolRef = doc(db, "schools", schoolId);
    const schoolSnap = await getDoc(schoolRef);
    return schoolSnap.exists() ? schoolSnap.data() as School : null;
  } catch (error) {
    console.error("Error fetching school details in service:", error);
    return null;
  }
};

export const updateSchoolDetailsService = async (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive' | 'setupComplete' | 'schoolType' | 'country' | 'phoneNumber'>>): Promise<boolean> => {
  try {
    const schoolRef = doc(db, "schools", schoolId);
    await updateDoc(schoolRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating school details in service:", error);
    return false;
  }
};

export const regenerateInviteCodeService = async (schoolId: string): Promise<string | null> => {
  try {
    const newInviteCode = `SCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const schoolRef = doc(db, "schools", schoolId);
    await updateDoc(schoolRef, { inviteCode: newInviteCode, updatedAt: Timestamp.now() });
    return newInviteCode;
  } catch (error) {
    console.error("Error regenerating invite code in service:", error);
    return null;
  }
};

export const deleteSchoolService = async (schoolId: string): Promise<boolean> => {
  if (!schoolId) return false;
  try {
    const schoolRef = doc(db, "schools", schoolId);
    await deleteDoc(schoolRef);
    // Note: This is a basic delete. A more robust delete might involve
    // deleting all associated users, classes, subjects, materials, assignments etc.
    // which would require more complex batch operations or Cloud Functions.
    console.log(`School document ${schoolId} deleted.`);
    return true;
  } catch (error) {
    console.error(`Error deleting school ${schoolId} in service:`, error);
    return false;
  }
};
