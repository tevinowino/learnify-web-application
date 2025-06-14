
import { db } from '@/lib/firebase';
import type { ExamPeriod, ExamPeriodWithClassNames, ExamResult, ExamResultWithStudentInfo, Class, UserProfile, Subject } from '@/types';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, Timestamp, writeBatch, orderBy, documentId } from 'firebase/firestore';
import type { getClassDetailsService as GetClassDetailsServiceType } from './classService';
import type { getUserProfileService as GetUserProfileServiceType } from './userService';
import type { getSubjectByIdService as GetSubjectByIdServiceType } from './subjectService';

export const createExamPeriodService = async (examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string | null> => {
  try {
    const dataWithTimestamps: Omit<ExamPeriod, 'id'> = {
      ...examPeriodData,
      status: 'upcoming', 
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

export const getAllExamPeriodsService = async (
    firestoreDb: typeof db,
    getClassDetails: GetClassDetailsServiceType
  ): Promise<ExamPeriodWithClassNames[]> => {
  try {
    const examPeriodsRef = collection(firestoreDb, "examPeriods");
    const querySnapshot = await getDocs(query(examPeriodsRef, orderBy("startDate", "desc")));
    const periodsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const period = { id: docSnapshot.id, ...docSnapshot.data() } as ExamPeriod;
      const classNames: string[] = [];
      if (period.assignedClassIds && period.assignedClassIds.length > 0) {
        const classDocsPromises = period.assignedClassIds.map(classId => getClassDetails(classId, async () => null));
        const classDocs = await Promise.all(classDocsPromises);
        classDocs.forEach(classDoc => {
          if (classDoc) classNames.push(classDoc.name);
        });
      }
      return { ...period, assignedClassNames: classNames };
    });
    return Promise.all(periodsPromises);
  } catch (error) {
    console.error("Error fetching all exam periods:", error);
    return [];
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
    const q = query(collection(db, "examResults"), 
      where("studentId", "==", resultData.studentId),
      where("examPeriodId", "==", resultData.examPeriodId),
      where("classId", "==", resultData.classId),
      where("subjectId", "==", resultData.subjectId),
      where("schoolId", "==", resultData.schoolId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingDocRef = querySnapshot.docs[0].ref;
      await updateDoc(existingDocRef, {
        ...resultData,
        updatedAt: Timestamp.now(),
      });
      return existingDocRef.id;
    } else {
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
  getSubjectById?: GetSubjectByIdServiceType,
  getExamPeriodById?: (examPeriodId: string, getClassDetails: GetClassDetailsServiceType) => Promise<ExamPeriodWithClassNames | null>
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
      let subjectName = result.subjectId; 
      let examPeriodName = result.examPeriodId;

      if (getSubjectById && result.subjectId) {
          const subject = await getSubjectById(result.subjectId);
          subjectName = subject?.name || result.subjectId;
      }
      if (getExamPeriodById && result.examPeriodId) {
          const examPeriod = await getExamPeriodById(result.examPeriodId, async () => null); 
          examPeriodName = examPeriod?.name || result.examPeriodId;
      }

      return {
        ...result,
        subjectName, 
        examPeriodName 
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
  subjectId: string, 
  getSubjectById?: GetSubjectByIdServiceType
): Promise<ExamResultWithStudentInfo[]> => {
   try {
    const q = query(collection(db, "examResults"), 
      where("examPeriodId", "==", examPeriodId),
      where("classId", "==", classId),
      where("schoolId", "==", schoolId),
      where("subjectId", "==", subjectId) 
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
    console.error("Error fetching exam results for period, class, and subject:", error);
    return [];
  }
};
