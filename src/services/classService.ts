
import { doc, collection, query, where, getDocs, writeBatch, updateDoc, addDoc, Timestamp, arrayUnion, arrayRemove, documentId, orderBy, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Class, ClassWithTeacherInfo, UserProfileWithId, UserProfile, ClassType } from '@/types';
import type { getUserProfileService as GetUserProfileServiceType } from './userService'; 
import { getSubjectByIdService } from './subjectService'; // Import for subject name resolution

export const createClassService = async (
  className: string, 
  schoolId: string, 
  teacherId: string,
  classType: ClassType,
  compulsorySubjectIds?: string[],
  subjectId?: string | null
  ): Promise<string | null> => {
  try {
    const classRef = collection(db, "classes");
    const classInviteCode = `C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const classData: Omit<Class, 'id'> = {
      name: className,
      schoolId: schoolId,
      teacherId: teacherId || '',
      studentIds: [],
      classInviteCode: classInviteCode,
      classType: classType,
      compulsorySubjectIds: classType === 'main' ? (compulsorySubjectIds || []) : [],
      subjectId: classType === 'subject_based' ? (subjectId || null) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(classRef, classData);
    await updateDoc(doc(db, "classes", docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error creating class in service:", error);
    return null;
  }
};

export const getClassesBySchoolService = async (
  schoolId: string,
  getUserProfile: typeof GetUserProfileServiceType
): Promise<ClassWithTeacherInfo[]> => {
  if (!schoolId) return [];
  try {
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("schoolId", "==", schoolId));
    const querySnapshot = await getDocs(q);
    const classesPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const classData = docSnapshot.data() as Class;
      let teacherDisplayName = 'N/A';
      if (classData.teacherId) {
        const teacherProfile = await getUserProfile(classData.teacherId);
        teacherDisplayName = teacherProfile?.displayName || 'N/A';
      }
      let subjectName = undefined;
      if (classData.classType === 'subject_based' && classData.subjectId) {
        const subject = await getSubjectByIdService(classData.subjectId);
        subjectName = subject?.name;
      }
      return { ...classData, id: docSnapshot.id, teacherDisplayName, subjectName };
    });
    const allClasses = await Promise.all(classesPromises);
    return allClasses.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching classes by school in service:", error);
    return [];
  }
};

export const getClassesByIdsService = async (
  classIds: string[],
  getUserProfile: typeof GetUserProfileServiceType,
  getAssignmentsForClass: (classId: string) => Promise<any[]> 
): Promise<ClassWithTeacherInfo[]> => {
  if (!classIds || classIds.length === 0) return [];
  try {
    const MAX_CLASS_IDS_PER_QUERY = 30;
    const classChunks: string[][] = [];
    for (let i = 0; i < classIds.length; i += MAX_CLASS_IDS_PER_QUERY) {
        classChunks.push(classIds.slice(i, i + MAX_CLASS_IDS_PER_QUERY));
    }
    let allClasses: ClassWithTeacherInfo[] = [];
    for (const chunk of classChunks) {
      if (chunk.length === 0) continue;
      const classesRef = collection(db, "classes");
      const q = query(classesRef, where(documentId(), "in", chunk));
      const querySnapshot = await getDocs(q);
      const classesPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const classData = docSnapshot.data() as Class;
        let teacherDisplayName = 'N/A';
        if (classData.teacherId) {
          const teacherProfile = await getUserProfile(classData.teacherId);
          teacherDisplayName = teacherProfile?.displayName || 'N/A';
        }
        const assignments = await getAssignmentsForClass(classData.id);
        let subjectName = undefined;
        if (classData.classType === 'subject_based' && classData.subjectId) {
            const subject = await getSubjectByIdService(classData.subjectId);
            subjectName = subject?.name;
        }
        return { ...classData, id: docSnapshot.id, teacherDisplayName, totalAssignmentsCount: assignments.length, subjectName };
      });
      const chunkClasses = await Promise.all(classesPromises);
      allClasses = [...allClasses, ...chunkClasses];
    }
    return allClasses.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching classes by IDs in service:", error);
    return [];
  }
};


export const getClassDetailsService = async (
  classId: string,
  getUserProfile: typeof GetUserProfileServiceType
): Promise<ClassWithTeacherInfo | null> => {
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
      let subjectName = undefined;
      if (classData.classType === 'subject_based' && classData.subjectId) {
        const subject = await getSubjectByIdService(classData.subjectId);
        subjectName = subject?.name;
      }
      return { ...classData, teacherDisplayName, subjectName };
    }
    return null;
  } catch (error) {
    console.error("Error fetching class details in service:", error);
    return null;
  }
};

export const updateClassDetailsService = async (classId: string, data: Partial<Pick<Class, 'name' | 'teacherId' | 'classInviteCode' | 'classType' | 'compulsorySubjectIds' | 'subjectId'>>): Promise<boolean> => {
  try {
    const classRef = doc(db, "classes", classId);
    const updateData: any = { ...data, updatedAt: Timestamp.now() };
    
    // Ensure subjectId is nullified if classType is not subject_based
    if (data.classType && data.classType !== 'subject_based') {
        updateData.subjectId = null;
    }
    // Ensure compulsorySubjectIds is empty array if classType is not main
    if (data.classType && data.classType !== 'main') {
        updateData.compulsorySubjectIds = [];
    }

    await updateDoc(classRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating class details in service:", error);
    return false;
  }
};

export const enrollStudentInClassService = async (classId: string, studentId: string): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const classRef = doc(db, "classes", classId);
    const studentRef = doc(db, "users", studentId);

    const classSnap = await getDoc(classRef);
    if (!classSnap.exists()) return false;
    const classData = classSnap.data() as Class;

    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) return false;
    const studentData = studentSnap.data() as UserProfile;

    // Update class's student list
    batch.update(classRef, { studentIds: arrayUnion(studentId), updatedAt: Timestamp.now() });
    
    // Update student's class list
    const studentUpdatePayload: any = { classIds: arrayUnion(classId), updatedAt: Timestamp.now() };

    let subjectsToAdd: string[] = [];
    if (classData.classType === 'main' && classData.compulsorySubjectIds) {
        subjectsToAdd.push(...classData.compulsorySubjectIds);
    }
    if (classData.classType === 'subject_based' && classData.subjectId) {
        subjectsToAdd.push(classData.subjectId);
    }
    
    if (subjectsToAdd.length > 0) {
        // Ensure unique subjects by merging with existing if any
        const currentStudentSubjects = studentData.subjects || [];
        const finalSubjects = Array.from(new Set([...currentStudentSubjects, ...subjectsToAdd]));
        studentUpdatePayload.subjects = finalSubjects;
    }

    batch.update(studentRef, studentUpdatePayload);
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error enrolling student in service:", error);
    return false;
  }
};

export const removeStudentFromClassService = async (classId: string, studentId: string): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const classRef = doc(db, "classes", classId);
    batch.update(classRef, { studentIds: arrayRemove(studentId), updatedAt: Timestamp.now() });
    const studentRef = doc(db, "users", studentId);
    batch.update(studentRef, { classIds: arrayRemove(classId), updatedAt: Timestamp.now() });
    
    // Note: Removing from a class does not automatically remove subjects. 
    // This might need more complex logic if, for example, a student leaves a main class, 
    // whether its compulsory subjects should be removed if not part of another class.
    // For now, it only removes the class association.

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error removing student from class in service:", error);
    return false;
  }
};

export const getStudentsInClassService = async (
    classId: string,
    getUserProfile: typeof GetUserProfileServiceType
  ): Promise<UserProfileWithId[]> => {
  const classDetails = await getClassDetailsService(classId, getUserProfile); 
  if (!classDetails || !classDetails.studentIds || classDetails.studentIds.length === 0) {
    return [];
  }
  try {
    const MAX_STUDENT_IDS_PER_QUERY = 30;
    const studentIdChunks: string[][] = [];
    for (let i = 0; i < classDetails.studentIds.length; i += MAX_STUDENT_IDS_PER_QUERY) {
        studentIdChunks.push(classDetails.studentIds.slice(i, i + MAX_STUDENT_IDS_PER_QUERY));
    }
    let allStudents: UserProfileWithId[] = [];
    for (const chunk of studentIdChunks) {
      if (chunk.length === 0) continue;
      const usersRef = collection(db, "users");
      const q = query(usersRef, where(documentId(), "in", chunk));
      const querySnapshot = await getDocs(q);
      const studentsInChunk = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'active' } as UserProfileWithId));
      allStudents = [...allStudents, ...studentsInChunk];
    }
    return allStudents;
  } catch (error) {
    console.error("Error fetching students in class (service):", error);
    return [];
  }
};

export const getStudentsNotInClassService = async (
  schoolId: string,
  classId: string,
  getUsersBySchoolAndRole: (schoolId: string, role: UserProfile['role']) => Promise<UserProfileWithId[]>,
  getStudentsInClass: (classId: string) => Promise<UserProfileWithId[]>,
  getUserProfile: typeof GetUserProfileServiceType 
): Promise<UserProfileWithId[]> => {
  const allSchoolStudents = await getUsersBySchoolAndRole(schoolId, 'student');
  const studentsInCurrentClass = await getStudentsInClass(classId); 
  const studentIdsInClass = new Set(studentsInCurrentClass.map(s => s.id));
  return allSchoolStudents.filter(student => !studentIdsInClass.has(student.id) && student.status === 'active');
};


export const deleteClassService = async (classId: string): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef); 
    if (classSnap.exists()) {
      const classData = classSnap.data() as Class;
      if (classData.studentIds) {
        classData.studentIds.forEach(studentId => {
          const studentRef = doc(db, "users", studentId);
          batch.update(studentRef, { classIds: arrayRemove(classId) });
        });
      }
    }
    
    const assignmentsQuery = query(collection(db, "assignments"), where("classId", "==", classId));
    const assignmentsSnap = await getDocs(assignmentsQuery);
    assignmentsSnap.docs.forEach(d => batch.delete(d.ref));
    
    const materialsQuery = query(collection(db, "learningMaterials"), where("classId", "==", classId));
    const materialsSnap = await getDocs(materialsQuery);
    materialsSnap.docs.forEach(d => batch.delete(d.ref));

    batch.delete(classRef);
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting class in service:", error);
    return false;
  }
};

export const regenerateClassInviteCodeService = async (classId: string): Promise<string | null> => {
  try {
    const newInviteCode = `C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const classRef = doc(db, "classes", classId);
    await updateDoc(classRef, { classInviteCode: newInviteCode, updatedAt: Timestamp.now() });
    return newInviteCode;
  } catch (error) {
    console.error("Error regenerating class invite code in service:", error);
    return null;
  }
};

export const getClassesByTeacherService = async (teacherId: string): Promise<ClassWithTeacherInfo[]> => {
  if (!teacherId) return [];
  try {
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("teacherId", "==", teacherId));
    const querySnapshot = await getDocs(q);
    const classPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const classData = docSnapshot.data() as Class;
       let subjectName = undefined;
        if (classData.classType === 'subject_based' && classData.subjectId) {
            const subject = await getSubjectByIdService(classData.subjectId);
            subjectName = subject?.name;
        }
      return {
        ...(docSnapshot.data() as Class),
        id: docSnapshot.id,
        subjectName
      };
    });
    const classes = await Promise.all(classPromises);
    return classes.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching classes by teacher in service:", error);
    return [];
  }
};


export const getStudentsInMultipleClassesService = async (classIds: string[]): Promise<UserProfileWithId[]> => {
  if (!classIds || classIds.length === 0) return [];
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"), where("classIds", "array-contains-any", classIds));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), status: d.data().status || 'active' } as UserProfileWithId));
  } catch (error) {
    console.error("Error fetching students in multiple classes (service):", error);
    return [];
  }
};


export const getClassByInviteCodeService = async (inviteCode: string): Promise<Class | null> => {
  try {
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("classInviteCode", "==", inviteCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const classDoc = querySnapshot.docs[0];
      return { id: classDoc.id, ...classDoc.data() } as Class;
    }
    return null;
  } catch (error) {
    console.error("Error fetching class by invite code:", error);
    return null;
  }
};

export const joinClassWithCodeService = async (classCode: string, studentId: string): Promise<boolean> => {
    try {
      const classDetails = await getClassByInviteCodeService(classCode);
      if (!classDetails) {
        console.log("Invalid class invite code");
        return false;
      }
      
      const studentRef = doc(db, "users", studentId);
      const studentDoc = await getDoc(studentRef);
      if (!studentDoc.exists()) {
        console.log("Student profile not found.");
        return false;
      }
      const studentData = studentDoc.data() as UserProfile;
      if (studentData.classIds?.includes(classDetails.id)) {
        console.log("Student already enrolled.");
        return true; 
      }

      const batch = writeBatch(db);
      const classRefDoc = doc(db, "classes", classDetails.id);
      batch.update(classRefDoc, { studentIds: arrayUnion(studentId), updatedAt: Timestamp.now() });
      
      const studentUpdatePayload: any = { classIds: arrayUnion(classDetails.id), updatedAt: Timestamp.now() };
      let subjectsToEnroll: string[] = studentData.subjects || [];

      if (classDetails.classType === 'main' && classDetails.compulsorySubjectIds) {
        subjectsToEnroll.push(...classDetails.compulsorySubjectIds);
      }
      if (classDetails.classType === 'subject_based' && classDetails.subjectId) {
        subjectsToEnroll.push(classDetails.subjectId);
      }
      studentUpdatePayload.subjects = Array.from(new Set(subjectsToEnroll));


      batch.update(studentRef, studentUpdatePayload);
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error joining class with code (service):", error);
      return false;
    }
  };

    