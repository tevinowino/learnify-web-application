
import { doc, collection, query, where, getDocs, addDoc, Timestamp, updateDoc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subject } from '@/types';

export const createSubjectService = async (schoolId: string, subjectName: string): Promise<string | null> => {
  if (!schoolId || !subjectName.trim()) return null;
  try {
    const subjectData: Omit<Subject, 'id'> = {
      name: subjectName.trim(),
      schoolId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "subjects"), subjectData);
    await updateDoc(doc(db, "subjects", docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error creating subject in service:", error);
    return null;
  }
};

export const getSubjectsBySchoolService = async (schoolId: string): Promise<Subject[]> => {
  if (!schoolId) return [];
  try {
    const subjectsRef = collection(db, "subjects");
    const q = query(subjectsRef, where("schoolId", "==", schoolId), orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
  } catch (error) {
    console.error("Error fetching subjects by school in service:", error);
    return [];
  }
};

export const getSubjectByIdService = async (subjectId: string): Promise<Subject | null> => {
  if (!subjectId) return null;
  try {
    const subjectRef = doc(db, "subjects", subjectId);
    const subjectSnap = await getDoc(subjectRef);
    return subjectSnap.exists() ? { id: subjectSnap.id, ...subjectSnap.data() } as Subject : null;
  } catch (error) {
    console.error("Error fetching subject by ID:", error);
    return null;
  }
};

export const updateSubjectService = async (subjectId: string, newName: string): Promise<boolean> => {
  if (!subjectId || !newName.trim()) return false;
  try {
    const subjectRef = doc(db, "subjects", subjectId);
    await updateDoc(subjectRef, { name: newName.trim(), updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating subject in service:", error);
    return false;
  }
};

export const deleteSubjectService = async (subjectId: string): Promise<boolean> => {
  if (!subjectId) return false;
  try {
    await deleteDoc(doc(db, "subjects", subjectId));
    // Consider implications: if subjects are tied to student profiles, those references might need cleaning.
    // For now, simple delete.
    return true;
  } catch (error) {
    console.error("Error deleting subject in service:", error);
    return false;
  }
};

