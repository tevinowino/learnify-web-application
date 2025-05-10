
import { doc, collection, query, where, getDocs, addDoc, Timestamp, orderBy, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Submission, SubmissionWithStudentName, UserProfile } from '@/types';
import type { getUserProfileService as GetUserProfileServiceType } from './userService';


export const addSubmissionService = async (
  submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'>,
  studentId: string,
  assignmentDeadline: Timestamp
): Promise<{ submissionId: string; newStatus: Submission['status']; existingGrade?: string | number } | null> => {
  try {
    const existingSubmission = await getSubmissionByStudentForAssignmentService(submissionData.assignmentId, studentId);
    const studentRef = doc(db, "users", studentId);
    const isLate = Timestamp.now() > assignmentDeadline;
    const newStatus = isLate ? 'late' : 'submitted';

    if (existingSubmission) {
      const submissionRef = doc(db, "submissions", existingSubmission.id);
      const statusUpdate = existingSubmission.status === 'graded' ? 'graded' : newStatus;
      await updateDoc(submissionRef, {
        content: submissionData.content,
        submissionType: submissionData.submissionType,
        submittedAt: Timestamp.now(),
        status: statusUpdate,
        updatedAt: Timestamp.now()
      });
      return { submissionId: existingSubmission.id, newStatus: statusUpdate, existingGrade: existingSubmission.grade };
    } else {
      const dataToSave: Omit<Submission, 'id'> = {
        ...submissionData,
        studentId: studentId,
        submittedAt: Timestamp.now(),
        status: newStatus,
      };
      const docRef = await addDoc(collection(db, "submissions"), dataToSave);
      await updateDoc(doc(db, "submissions", docRef.id), { id: docRef.id });

      const assignmentRef = doc(db, "assignments", submissionData.assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);
      if (assignmentSnap.exists()) {
          const currentSubmissions = assignmentSnap.data().totalSubmissions || 0;
          await updateDoc(assignmentRef, { totalSubmissions: currentSubmissions + 1 });
      }
      return { submissionId: docRef.id, newStatus };
    }
  } catch (error) {
    console.error("Error adding/updating submission in service:", error);
    return null;
  }
};

export const getSubmissionsForAssignmentService = async (
  assignmentId: string,
  getUserProfile: typeof GetUserProfileServiceType
): Promise<SubmissionWithStudentName[]> => {
  try {
    const submissionsRef = collection(db, "submissions");
    // Removed orderBy("submittedAt", "desc") to avoid needing composite index with where clause.
    // Sorting should be handled client-side.
    const q = query(submissionsRef, where("assignmentId", "==", assignmentId));
    const querySnapshot = await getDocs(q);
    const submissionsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const submission = { id: docSnapshot.id, ...docSnapshot.data() } as Submission;
      let studentDisplayName = 'N/A';
      let studentEmail = 'N/A';
      if (submission.studentId) {
        const studentProfile = await getUserProfile(submission.studentId);
        studentDisplayName = studentProfile?.displayName || 'N/A';
        studentEmail = studentProfile?.email || 'N/A';
      }
      return { ...submission, studentDisplayName, studentEmail };
    });
    return Promise.all(submissionsPromises);
  } catch (error) {
    console.error("Error fetching submissions in service:", error);
    return [];
  }
};

export const gradeSubmissionService = async (submissionId: string, grade: string | number, feedback?: string): Promise<boolean> => {
  try {
    const submissionRef = doc(db, "submissions", submissionId);
    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists()) return false;

    const submissionData = submissionSnap.data() as Submission;
    const batch = writeBatch(db);
    batch.update(submissionRef, { grade, feedback, status: 'graded', updatedAt: Timestamp.now() });
    
    const studentRef = doc(db, "users", submissionData.studentId);
    const studentAssignmentField = `studentAssignments.${submissionData.assignmentId}`;
    batch.update(studentRef, { [studentAssignmentField]: { status: 'graded', grade } });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error grading submission in service:", error);
    return false;
  }
};

export const getSubmissionByStudentForAssignmentService = async (assignmentId: string, studentId: string): Promise<Submission | null> => {
  try {
    // This query with two equality clauses should be fine without a custom composite index.
    const q = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const submissionDoc = querySnapshot.docs[0];
      return { id: submissionDoc.id, ...submissionDoc.data() } as Submission;
    }
    return null;
  } catch (error) {
    console.error('Error fetching submission by student and assignment in service:', error);
    return null;
  }
};

export const getSubmissionByIdService = async (submissionId: string): Promise<Submission | null> => {
    try {
        const submissionRef = doc(db, "submissions", submissionId);
        const submissionSnap = await getDoc(submissionRef);
        if (submissionSnap.exists()) {
            return { id: submissionSnap.id, ...submissionSnap.data() } as Submission;
        }
        return null;
    } catch (error) {
        console.error("Error fetching submission by ID:", error);
        return null;
    }
};

