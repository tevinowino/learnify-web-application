
import { collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Activity } from '@/types';

export const addActivityService = async (activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<string | null> => {
  try {
    const activityWithTimestamp = {
      ...activityData,
      timestamp: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "activities"), activityWithTimestamp);
    // No need to write ID back for activities usually, unless specifically needed for direct linking later
    // await updateDoc(doc(db, "activities", docRef.id), { id: docRef.id }); 
    return docRef.id;
  } catch (error) {
    console.error("Error adding activity in service:", error);
    return null;
  }
};

// Generic function to get activities, can be filtered further in calling components
export const getActivitiesService = async (
  schoolId: string,
  filters?: { classId?: string; userId?: string; type?: Activity['type'] },
  limitCount: number = 10
): Promise<Activity[]> => {
  if (!schoolId) return [];
  try {
    const activitiesRef = collection(db, "activities");
    let qConstraints = [
        where("schoolId", "==", schoolId),
        orderBy("timestamp", "desc"),
        limit(limitCount)
    ];

    if (filters?.classId) {
      // For class-specific activities, this might require a composite index on (schoolId, classId, timestamp)
      // Or, fetch school activities and then filter client-side if index complexity is an issue.
      // For simplicity, let's assume direct query is possible or client-side filtering will be applied.
      // This specific query will likely need a composite index: (schoolId, classId, timestamp desc)
      // qConstraints = [where("schoolId", "==", schoolId), where("classId", "==", filters.classId), orderBy("timestamp", "desc"), limit(limitCount)];
       console.warn("Fetching class-specific activities might require a composite index (schoolId, classId, timestamp). Filtering client-side for now if direct query fails.");
    }
    
    // For user-specific or type-specific, direct querying becomes complex quickly without many indexes.
    // Fetching general school/class activities and then filtering is more robust without index management.

    const q = query(activitiesRef, ...qConstraints);
    const querySnapshot = await getDocs(q);
    
    let activities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));

    // Client-side filtering if needed for classId, userId, type if not directly queried
    if(filters?.classId) {
        activities = activities.filter(act => act.classId === filters.classId || !act.classId); // Show general school + specific class
    }
    if(filters?.userId){ // this means actorId or if we had targetId
        activities = activities.filter(act => act.actorId === filters.userId);
    }
    if(filters?.type){
        activities = activities.filter(act => act.type === filters.type);
    }

    return activities;
  } catch (error) {
    console.error("Error fetching activities in service:", error);
    return [];
  }
};
