
import { db } from '@/lib/firebase';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

// Saves or updates a single attendance record for a student on a specific date for a specific class
export const saveAttendanceRecordService = async (
  recordData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    const attendanceRef = collection(db, 'attendanceRecords');
    const q = query(
      attendanceRef,
      where('studentId', '==', recordData.studentId),
      where('classId', '==', recordData.classId),
      where('date', '==', recordData.date), // Ensure date is a Firestore Timestamp for accurate querying
      where('schoolId', '==', recordData.schoolId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing record
      const existingDocRef = querySnapshot.docs[0].ref;
      await updateDoc(existingDocRef, {
        ...recordData,
        updatedAt: Timestamp.now(),
      });
      return existingDocRef.id;
    } else {
      // Add new record
      const dataToSave = {
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(attendanceRef, dataToSave);
      await updateDoc(docRef, { id: docRef.id });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving attendance record in service:', error);
    return null;
  }
};

// Saves multiple attendance records in a batch (e.g., for a whole class on a specific day)
export const saveMultipleAttendanceRecordsService = async (
  records: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<boolean> => {
  if (records.length === 0) return true;
  try {
    const batch = writeBatch(db);
    const attendanceRef = collection(db, 'attendanceRecords');

    for (const record of records) {
      // Check if a record already exists for this student, class, and date
      const q = query(
        attendanceRef,
        where('studentId', '==', record.studentId),
        where('classId', '==', record.classId),
        where('date', '==', record.date),
        where('schoolId', '==', record.schoolId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDocRef = querySnapshot.docs[0].ref;
        batch.update(existingDocRef, { ...record, updatedAt: Timestamp.now() });
      } else {
        const newDocRef = doc(attendanceRef); // Auto-generate ID
        batch.set(newDocRef, { ...record, id: newDocRef.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      }
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving multiple attendance records in service:', error);
    return false;
  }
};

// Get attendance for a specific class on a specific date
export const getAttendanceForClassByDateService = async (
  classId: string,
  date: Timestamp, // Ensure this is a Firestore Timestamp representing the start of the day
  schoolId: string
): Promise<AttendanceRecord[]> => {
  if (!classId || !date || !schoolId) return [];
  try {
    const attendanceRef = collection(db, 'attendanceRecords');
    // To query for a specific day, you might need to query for a range
    // from the start of the day to the end of the day if dates include time.
    // If 'date' field is purely date (e.g., stored as YYYY-MM-DD string or timestamp at midnight), direct equality works.
    // Assuming 'date' is a Timestamp set to midnight of the target day.
    const q = query(
      attendanceRef,
      where('classId', '==', classId),
      where('date', '==', date),
      where('schoolId', '==', schoolId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord));
  } catch (error) {
    console.error('Error fetching attendance for class by date:', error);
    return [];
  }
};

// Get attendance for a student across all their classes for a date range
export const getAttendanceForStudentByDateRangeService = async (
  studentId: string,
  schoolId: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<AttendanceRecord[]> => {
  if (!studentId || !schoolId) return [];
  try {
    const attendanceRef = collection(db, 'attendanceRecords');
    const q = query(
      attendanceRef,
      where('studentId', '==', studentId),
      where('schoolId', '==', schoolId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord));
  } catch (error) {
    console.error('Error fetching attendance for student by date range:', error);
    return [];
  }
};

// Get attendance for a class across a date range (for Admin view)
export const getAttendanceForClassByDateRangeService = async (
  classId: string,
  schoolId: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<AttendanceRecord[]> => {
  if (!classId || !schoolId) return [];
  try {
    const attendanceRef = collection(db, 'attendanceRecords');
    const q = query(
      attendanceRef,
      where('classId', '==', classId),
      where('schoolId', '==', schoolId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      orderBy('studentName', 'asc') // Optional: sort by student name for better readability
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord));
  } catch (error) {
    console.error('Error fetching attendance for class by date range (admin):', error);
    return [];
  }
};

// Get all attendance records for a school within a date range (can be very large, use with caution or add pagination)
export const getAttendanceForSchoolByDateRangeService = async (
  schoolId: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<AttendanceRecord[]> => {
  if (!schoolId) return [];
  try {
    const attendanceRef = collection(db, 'attendanceRecords');
    const q = query(
      attendanceRef,
      where('schoolId', '==', schoolId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      orderBy('className', 'asc'), 
      orderBy('studentName', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord));
  } catch (error) {
    console.error('Error fetching attendance for school by date range:', error);
    return [];
  }
};
