
import { db } from '@/lib/firebase';
import type { Testimonial } from '@/types';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export const addTestimonialService = async (
  testimonialData: Omit<Testimonial, 'id' | 'submittedAt' | 'isApprovedForDisplay'>
): Promise<string | null> => {
  try {
    const dataToSave: Omit<Testimonial, 'id'> = {
      ...testimonialData,
      isApprovedForDisplay: false, // Default to not approved
      submittedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'testimonials'), dataToSave);
    await updateDoc(doc(db, 'testimonials', docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Error adding testimonial in service:', error);
    return null;
  }
};

export const getApprovedTestimonialsService = async (limitCount: number = 5): Promise<Testimonial[]> => {
  try {
    const testimonialsRef = collection(db, 'testimonials');
    const q = query(
      testimonialsRef,
      where('isApprovedForDisplay', '==', true),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Testimonial));
  } catch (error) {
    console.error('Error fetching approved testimonials in service:', error);
    return [];
  }
};

export const getAllTestimonialsService = async (): Promise<Testimonial[]> => {
  // Intended for admin use, might need pagination for large datasets
  try {
    const testimonialsRef = collection(db, 'testimonials');
    const q = query(testimonialsRef, orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Testimonial));
  } catch (error) {
    console.error('Error fetching all testimonials in service:', error);
    return [];
  }
};

export const updateTestimonialApprovalService = async (
  testimonialId: string,
  isApproved: boolean
): Promise<boolean> => {
  try {
    const testimonialRef = doc(db, 'testimonials', testimonialId);
    await updateDoc(testimonialRef, { isApprovedForDisplay: isApproved });
    return true;
  } catch (error) {
    console.error('Error updating testimonial approval in service:', error);
    return false;
  }
};
