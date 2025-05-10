
import { doc, collection, query, where, getDocs, addDoc, Timestamp, orderBy, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Assignment, AssignmentWithClassInfo, AssignmentWithClassAndSubmissionInfo, UserProfile } from '@/types';
import type { getClassDetailsService as GetClassDetailsServiceType } from './classService';
import type { getSubmissionByStudentForAssignmentService as GetSubmissionServiceType } from './submissionService';

export const createAssignmentService = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'totalSubmissions'>): Promise<string | null> => {
  try {
    const dataWithTimestamps: Omit<Assignment, 'id' | 'totalSubmissions'> = {
      ...assignmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "assignments"), dataWithTimestamps);
    await updateDoc(doc(db, "assignments", docRef.id), { id: docRef.id, totalSubmissions: 0 });
    return docRef.id;
  } catch (error) {
    console.error("Error creating assignment in service:", error);
    return null;
  }
};

export const getAssignmentsByTeacherService = async (
  teacherId: string,
  getClassDetails: GetClassDetailsServiceType,
  classId?: string
): Promise<AssignmentWithClassInfo[]> => {
  if (!teacherId) return [];
  try {
    const assignmentsRef = collection(db, "assignments");
    let q;
    if (classId) {
      q = query(assignmentsRef, where("teacherId", "==", teacherId), where("classId", "==", classId));
    } else {
      q = query(assignmentsRef, where("teacherId", "==", teacherId));
    }
    // Removed orderBy("deadline", "asc") to avoid needing composite index with where clauses.
    // Sorting should be handled client-side if specific order is crucial.
    const querySnapshot = await getDocs(q);
    const assignmentsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const assignment = { id: docSnapshot.id, ...docSnapshot.data() } as Assignment;
      let className = 'N/A';
      if(assignment.classId) {
        const classInfo = await getClassDetails(assignment.classId, async () => null); 
        className = classInfo?.name || 'Unknown Class';
      }
      return { ...assignment, className, totalSubmissions: assignment.totalSubmissions || 0 };
    });
    return Promise.all(assignmentsPromises);
  } catch (error) {
    console.error("Error fetching assignments by teacher in service:", error);
    return [];
  }
};

export const getAssignmentsByClassService = async (classId: string): Promise<Assignment[]> => {
   if (!classId) return [];
  try {
    const assignmentsRef = collection(db, "assignments");
    // Removed orderBy("deadline", "asc") to avoid needing composite index with where clause.
    // Sorting should be handled client-side.
    const q = query(assignmentsRef, where("classId", "==", classId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data(), totalSubmissions: docSnap.data().totalSubmissions || 0 } as Assignment));
  } catch (error) {
    console.error("Error fetching assignments by class in service:", error);
    return [];
  }
};

export const getAssignmentByIdService = async (
  assignmentId: string,
  getClassDetails: GetClassDetailsServiceType
): Promise<AssignmentWithClassAndSubmissionInfo | null> => {
  try {
    const assignmentRef = doc(db, "assignments", assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    if (assignmentSnap.exists()) {
      const assignmentData = assignmentSnap.data() as Assignment;
      let className = 'N/A';
      if(assignmentData.classId) {
        const classInfo = await getClassDetails(assignmentData.classId, async () => null); 
        className = classInfo?.name || 'Unknown Class';
      }
      return { ...assignmentData, className, totalSubmissions: assignmentData.totalSubmissions || 0 };
    }
    return null;
  } catch (error) {
    console.error("Error fetching assignment by ID in service:", error);
    return null;
  }
};

export const updateAssignmentService = async (assignmentId: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions'>>): Promise<boolean> => {
  try {
    const assignmentRef = doc(db, "assignments", assignmentId);
    await updateDoc(assignmentRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating assignment in service:", error);
    return false;
  }
};

export const deleteAssignmentService = async (assignmentId: string): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "assignments", assignmentId));
    const submissionsQuery = query(collection(db, "submissions"), where("assignmentId", "==", assignmentId));
    const submissionsSnap = await getDocs(submissionsQuery);
    submissionsSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting assignment in service:", error);
    return false;
  }
};

export const getAssignmentsForStudentByClassService = async (
    classId: string, 
    studentId: string,
    getSubmission: GetSubmissionServiceType,
    getClassDetails: GetClassDetailsServiceType,
    studentProfile: UserProfile | null
  ): Promise<AssignmentWithClassAndSubmissionInfo[]> => {
    // getAssignmentsByClassService no longer sorts by deadline.
    const assignments = await getAssignmentsByClassService(classId);
    const assignmentsWithStatus: AssignmentWithClassAndSubmissionInfo[] = [];

    for (const assignment of assignments) {
      const submission = await getSubmission(assignment.id, studentId);
      const classInfo = await getClassDetails(assignment.classId, async () => null); 
      
      let status: AssignmentWithClassAndSubmissionInfo['submissionStatus'] = 'missing';
      let grade: AssignmentWithClassAndSubmissionInfo['submissionGrade'] = undefined;

      if (submission) {
        status = submission.status;
        grade = submission.grade;
      } else if (studentProfile?.studentAssignments?.[assignment.id]) { 
        status = studentProfile.studentAssignments[assignment.id].status;
        grade = studentProfile.studentAssignments[assignment.id].grade;
      }
      
      assignmentsWithStatus.push({
        ...assignment,
        className: classInfo?.name || 'N/A',
        submissionStatus: status,
        submissionGrade: grade,
      });
    }
    // Sort client-side as service-level sort was removed.
    return assignmentsWithStatus.sort((a, b) => a.deadline.toMillis() - b.deadline.toMillis());
  };

