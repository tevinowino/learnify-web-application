
import { db } from '@/lib/firebase';
import type { ExamPeriod, ExamPeriodWithClassNames, ExamResult, ExamResultWithStudentInfo, Class, UserProfile, Subject } from '@/types';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, Timestamp, writeBatch, orderBy, documentId } from 'firebase/firestore';
import type { getClassDetailsService as GetClassDetailsServiceType } from './classService';
import type { getUserProfileService as GetUserProfileServiceType } from './userService';
import type { getSubjectByIdService as GetSubjectByIdServiceType } from './subjectService'; // Assuming subject service exists

export const createExamPeriodService = async (examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string | null> => {
  try {
    const dataWithTimestamps: Omit<ExamPeriod, 'id'> = {
      ...examPeriodData,
      status: 'upcoming', // Default status
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "examPeriods"), dataWithTimestamps);
    await updateDoc(doc(db, "examPeriods", docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error creating exam period in service:", error);
    return null;
  }
};

export const getExamPeriodsBySchoolService = async (
    schoolId: string,
    getClassDetails: GetClassDetailsServiceType
    ): Promise<ExamPeriodWithClassNames[]> => {
  if (!schoolId) return [];
  try {
    const q = query(collection(db, "examPeriods"), where("schoolId", "==", schoolId), orderBy("startDate", "desc"));
    const querySnapshot = await getDocs(q);
    
    const periodsWithClassNames: Promise<ExamPeriodWithClassNames>[] = querySnapshot.docs.map(async (docSnapshot) => {
        const period = { id: docSnapshot.id, ...docSnapshot.data() } as ExamPeriod;
        const classNames: string[] = [];
        if (period.assignedClassIds && period.assignedClassIds.length > 0) {
            // Firestore 'in' query supports up to 30 items in the array. If more, chunking is needed.
            // For simplicity, assume less than 30 or handle chunking if error occurs.
            const classDocsPromises = period.assignedClassIds.map(classId => getClassDetails(classId, async () => null));
            const classDocs = await Promise.all(classDocsPromises);
            classDocs.forEach(classDoc => {
                if (classDoc) classNames.push(classDoc.name);
            });
        }
        return { ...period, assignedClassNames: classNames };
    });

    return Promise.all(periodsWithClassNames);
  } catch (error) {
    console.error("Error fetching exam periods by school:", error);
    return [];
  }
};


export const getExamPeriodByIdService = async (
    examPeriodId: string,
    getClassDetails: GetClassDetailsServiceType
    ): Promise<ExamPeriodWithClassNames | null> => {
  try {
    const docRef = doc(db, "examPeriods", examPeriodId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const period = { id: docSnap.id, ...docSnap.data() } as ExamPeriod;
      const classNames: string[] = [];
        if (period.assignedClassIds && period.assignedClassIds.length > 0) {
            const classDocsPromises = period.assignedClassIds.map(classId => getClassDetails(classId, async () => null));
            const classDocs = await Promise.all(classDocsPromises);
            classDocs.forEach(classDoc => {
                if (classDoc) classNames.push(classDoc.name);
            });
        }
      return { ...period, assignedClassNames: classNames };
    }
    return null;
  } catch (error) {
    console.error("Error fetching exam period by ID:", error);
    return null;
  }
};

export const updateExamPeriodService = async (examPeriodId: string, data: Partial<ExamPeriod>): Promise<boolean> => {
  try {
    const docRef = doc(db, "examPeriods", examPeriodId);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating exam period:", error);
    return false;
  }
};


export const addOrUpdateExamResultService = async (resultData: Omit<ExamResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    // Check if a result already exists for this student, exam, class, subject
    const q = query(collection(db, "examResults"), 
      where("studentId", "==", resultData.studentId),
      where("examPeriodId", "==", resultData.examPeriodId),
      where("classId", "==", resultData.classId),
      where("subjectId", "==", resultData.subjectId),
      where("schoolId", "==", resultData.schoolId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing result
      const existingDocRef = querySnapshot.docs[0].ref;
      await updateDoc(existingDocRef, {
        ...resultData,
        updatedAt: Timestamp.now(),
      });
      return existingDocRef.id;
    } else {
      // Add new result
      const dataWithTimestamps = {
        ...resultData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "examResults"), dataWithTimestamps);
      await updateDoc(doc(db, "examResults", docRef.id), { id: docRef.id });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error adding/updating exam result:", error);
    return null;
  }
};

export const getExamResultsForTeacherService = async (
  examPeriodId: string,
  classId: string,
  subjectId: string,
  schoolId: string,
  getUserProfile: GetUserProfileServiceType
): Promise<ExamResultWithStudentInfo[]> => {
  try {
    const q = query(collection(db, "examResults"),
      where("examPeriodId", "==", examPeriodId),
      where("classId", "==", classId),
      where("subjectId", "==", subjectId),
      where("schoolId", "==", schoolId)
    );
    const querySnapshot = await getDocs(q);
    const resultsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const result = { id: docSnapshot.id, ...docSnapshot.data() } as ExamResult;
      const studentProfile = await getUserProfile(result.studentId);
      return {
        ...result,
        studentName: studentProfile?.displayName || 'N/A',
        studentEmail: studentProfile?.email || 'N/A',
      };
    });
    return Promise.all(resultsPromises);
  } catch (error) {
    console.error("Error fetching exam results for teacher:", error);
    return [];
  }
};


export const getExamResultsByStudentService = async (
  studentId: string, 
  schoolId: string,
  getSubjectById?: GetSubjectByIdServiceType, // Optional: if you want to fetch subject names
  getExamPeriodById?: (examPeriodId: string, getClassDetails: GetClassDetailsServiceType) => Promise<ExamPeriodWithClassNames | null> // Optional
): Promise<ExamResultWithStudentInfo[]> => {
  if (!studentId || !schoolId) return [];
  try {
    const q = query(collection(db, "examResults"), 
      where("studentId", "==", studentId),
      where("schoolId", "==", schoolId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const resultsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const result = { id: docSnapshot.id, ...docSnapshot.data() } as ExamResult;
      let subjectName = result.subjectId; // Default to ID if name not fetched
      let examPeriodName = result.examPeriodId;

      if (getSubjectById && result.subjectId) {
          const subject = await getSubjectById(result.subjectId);
          subjectName = subject?.name || result.subjectId;
      }
      if (getExamPeriodById && result.examPeriodId) {
          // For getClassDetails, we can pass a dummy function if we don't need class names here
          const examPeriod = await getExamPeriodById(result.examPeriodId, async () => null);
          examPeriodName = examPeriod?.name || result.examPeriodId;
      }

      return {
        ...result,
        subjectName, // This will be ID if getSubjectById is not provided or subject not found
        examPeriodName // This will be ID if getExamPeriodById is not provided or period not found
      };
    });
    return Promise.all(resultsPromises);
  } catch (error) {
    console.error("Error fetching exam results for student:", error);
    return [];
  }
};

export const getExamResultsByPeriodAndClassService = async (
  examPeriodId: string,
  classId: string,
  schoolId: string,
  getSubjectById?: GetSubjectByIdServiceType
): Promise<ExamResultWithStudentInfo[]> => {
   try {
    const q = query(collection(db, "examResults"), 
      where("examPeriodId", "==", examPeriodId),
      where("classId", "==", classId),
      where("schoolId", "==", schoolId)
    );
    const querySnapshot = await getDocs(q);
    const resultsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const result = { id: docSnapshot.id, ...docSnapshot.data() } as ExamResult;
       let subjectName = result.subjectId;
       if (getSubjectById && result.subjectId) {
          const subject = await getSubjectById(result.subjectId);
          subjectName = subject?.name || result.subjectId;
       }
      return { ...result, subjectName };
    });
    return Promise.all(resultsPromises);
  } catch (error) {
    console.error("Error fetching exam results for period and class:", error);
    return [];
  }
};

// You might want a function to check if all results for an exam period are submitted by an admin.
// This would involve:
// 1. Getting the ExamPeriod to see assignedClassIds.
// 2. For each class, get its students.
// 3. For each student in each class, check if results for all relevant subjects are in `examResults`.
// This can be complex and might be better handled with aggregated data or cloud functions if performance becomes an issue.
// For now, an admin might visually inspect or rely on teacher confirmations.
