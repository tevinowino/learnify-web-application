
import { db } from '@/lib/firebase';
import type { Notification } from '@/types';
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
  writeBatch,
} from 'firebase/firestore';

export const addNotificationService = async (
  notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
): Promise<string | null> => {
  try {
    const dataWithTimestamp: Omit<Notification, 'id'> = {
      ...notificationData,
      createdAt: Timestamp.now(),
      isRead: false,
    };
    const docRef = await addDoc(collection(db, 'notifications'), dataWithTimestamp);
    await updateDoc(doc(db, 'notifications', docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Error adding notification in service:', error);
    return null;
  }
};

export const getNotificationsService = async (userId: string, limitCount: number = 20): Promise<Notification[]> => {
  if (!userId) return [];
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Notification));
  } catch (error) {
    console.error('Error fetching notifications in service:', error);
    return [];
  }
};

export const markNotificationAsReadService = async (notificationId: string): Promise<boolean> => {
  if (!notificationId) return false;
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read in service:', error);
    return false;
  }
};

export const markAllNotificationsAsReadService = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return true; // No unread notifications to mark
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { isRead: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read in service:', error);
    return false;
  }
};
