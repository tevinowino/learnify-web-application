
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { School, OnboardingSchoolData } from '@/types';

export const onboardingCreateSchoolService = async (
  adminId: string,
  schoolData: OnboardingSchoolData,
  logoUrl?: string | null
): Promise<{ schoolId: string; inviteCode: string } | null> => {
  try {
    const inviteCode = `SCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const schoolRef = doc(collection(db, "schools"));
    const newSchool: School = {
      id: schoolRef.id,
      name: schoolData.schoolName,
      adminId: adminId, // This is the creatorAdminId
      inviteCode: inviteCode,
      schoolType: schoolData.schoolType,
      country: schoolData.country,
      phoneNumber: schoolData.phoneNumber,
      logoUrl: logoUrl || undefined,
      setupComplete: false, // Initial setup is not complete
      isExamModeActive: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(schoolRef, newSchool);
    return { schoolId: schoolRef.id, inviteCode };
  } catch (error) {
    console.error("Error in onboardingCreateSchoolService:", error);
    return null;
  }
};


export const createSchoolService = async (schoolName: string, adminId: string): Promise<string | null> => {
  // This function is likely for admins who are ALREADY onboarded and creating a school,
  // or if there's a separate flow. For the new multi-step onboarding, onboardingCreateSchoolService is preferred.
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
      setupComplete: true, // Assuming this flow means setup is done or handled differently
    };
    
    const batch = writeBatch(db);
    batch.set(schoolRef, schoolData);
    
    const userRef = doc(db, "users", adminId);
    // Only update if schoolId isn't already set, or if it's part of a different flow
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && !userSnap.data().schoolId) {
      batch.update(userRef, { schoolId: schoolRef.id, schoolName: schoolName, status: 'active' });
    }
    
    await batch.commit();
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

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { 
        schoolId: schoolId, 
        schoolName: schoolData.name, 
        status: 'active', // Joining implies becoming active in this school context
        onboardingStep: null, // Clear any previous onboarding state if joining
        updatedAt: Timestamp.now() 
    });
    
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

export const updateSchoolDetailsService = async (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive' | 'setupComplete' | 'schoolType' | 'country' | 'phoneNumber' | 'logoUrl'>>): Promise<boolean> => {
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
