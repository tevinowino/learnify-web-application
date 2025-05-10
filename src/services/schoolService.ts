
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { School } from '@/types';

export const createSchoolService = async (schoolName: string, adminId: string): Promise<string | null> => {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const schoolRef = doc(collection(db, "schools"));
    const schoolData: School = {
      id: schoolRef.id,
      name: schoolName,
      adminId: adminId,
      inviteCode: inviteCode,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isExamModeActive: false, // Default exam mode to false
    };
    
    const batch = writeBatch(db);
    batch.set(schoolRef, schoolData);
    
    const userRef = doc(db, "users", adminId);
    batch.update(userRef, { schoolId: schoolRef.id, schoolName: schoolName, status: 'active' });
    
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
    await updateDoc(userRef, { schoolId: schoolId, schoolName: schoolData.name, status: 'active', updatedAt: Timestamp.now() });
    
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

export const updateSchoolDetailsService = async (schoolId: string, data: Partial<Pick<School, 'name' | 'isExamModeActive'>>): Promise<boolean> => {
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
    const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const schoolRef = doc(db, "schools", schoolId);
    await updateDoc(schoolRef, { inviteCode: newInviteCode, updatedAt: Timestamp.now() });
    return newInviteCode;
  } catch (error) {
    console.error("Error regenerating invite code in service:", error);
    return null;
  }
};

// Exam related functions will be moved to examService.ts
// createExamPeriodService, getExamPeriodsBySchoolService, getExamPeriodByIdService,
// updateExamPeriodService, addOrUpdateExamResultService, getExamResultsForTeacherService,
// getExamResultsByStudentService, getExamResultsByPeriodAndClassService
// should be removed from here if they were present.
