
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, ClassWithTeacherInfo, UserProfileWithId, AttendanceRecord, AttendanceStatus } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

const startOfDayTimestamp = (date: Date): Timestamp => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
};

export async function seedAttendanceRecordsInFirestore(
  db: Firestore,
  schools: School[],
  classes: ClassWithTeacherInfo[],
  users: UserProfileWithId[],
  numAttendanceDaysToSeed: number
): Promise<void> {
  console.log(`🗓️ Seeding attendance records for ${numAttendanceDaysToSeed} days...`);
  const batch = writeBatch(db);

  for (const school of schools) {
    const mainClassesInSchool = classes.filter(c => c.schoolId === school.id && c.classType === "main");
    if (mainClassesInSchool.length === 0) continue;

    for (let dayOffset = 0; dayOffset < numAttendanceDaysToSeed; dayOffset++) {
      const attendanceDateRaw = faker.date.recent({ days: dayOffset + 1 });
      const attendanceDate = startOfDayTimestamp(attendanceDateRaw);

      for (const classData of mainClassesInSchool) {
        if (!classData.studentIds || classData.studentIds.length === 0 || !classData.teacherId) continue;
        
        const teacherProfile = users.find(u => u.id === classData.teacherId);
        if (!teacherProfile) continue;

        for (const studentId of classData.studentIds) {
          const studentProfile = users.find(u => u.id === studentId);
          if (!studentProfile) continue;

          const status = faker.helpers.arrayElement<AttendanceStatus>(["present", "present", "present", "absent", "late"]);
          const recordRef = doc(db, "attendanceRecords", uuidv4());
          const record: AttendanceRecord = {
            id: recordRef.id,
            studentId,
            studentName: studentProfile.displayName,
            classId: classData.id,
            className: classData.name,
            schoolId: school.id,
            date: attendanceDate,
            status,
            markedBy: teacherProfile.id,
            markedByName: teacherProfile.displayName,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };
          batch.set(recordRef, record);
        }
      }
    }
  }
  await batch.commit();
  console.log(`Finished seeding attendance for ${numAttendanceDaysToSeed} days.`);
}
