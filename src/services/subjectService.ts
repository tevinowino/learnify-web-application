
import { doc, collection, query, where, getDocs, addDoc, Timestamp, updateDoc, deleteDoc, orderBy, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subject, OnboardingSubjectData } from '@/types';

export const createSubjectService = async (schoolId: string, subjectName: string, isCompulsory?: boolean): Promise<string | null> => {
  if (!schoolId || !subjectName.trim()) return null;
  try {
    const subjectData: Omit<Subject, 'id'> = {
      name: subjectName.trim(),
      schoolId,
      isCompulsory: isCompulsory ?? false,
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

export const onboardingAddSubjectsService = async (schoolId: string, subjects: OnboardingSubjectData[]): Promise<boolean> => {
  if (!schoolId || subjects.length === 0) return false;
  try {
    const batch = writeBatch(db);
    const subjectsCollectionRef = collection(db, "subjects");

    for (const subject of subjects) {
      if (!subject.name.trim()) continue; 
      const subjectDocRef = doc(subjectsCollectionRef); 
      const subjectData: Subject = {
        id: subjectDocRef.id,
        name: subject.name.trim(),
        schoolId,
        isCompulsory: subject.isCompulsory || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(subjectDocRef, subjectData);
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error batch adding subjects in service:", error);
    return false;
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

export const getAllSubjectsService = async (firestoreDb: typeof db): Promise<Subject[]> => {
  try {
    const subjectsRef = collection(firestoreDb, "subjects");
    const querySnapshot = await getDocs(subjectsRef);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Subject));
  } catch (error) {
    console.error("Error fetching all subjects in service:", error);
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

export const updateSubjectService = async (subjectId: string, newName: string, isCompulsory?: boolean): Promise<boolean> => {
  if (!subjectId || !newName.trim()) return false;
  try {
    const subjectRef = doc(db, "subjects", subjectId);
    const updateData: Partial<Subject> = { name: newName.trim(), updatedAt: Timestamp.now() };
    if (isCompulsory !== undefined) {
        updateData.isCompulsory = isCompulsory;
    }
    await updateDoc(subjectRef, updateData);
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
    return true;
  } catch (error) {
    console.error("Error deleting subject in service:", error);
    return false;
  }
};
