
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, UserProfileWithId, Subject, ClassWithTeacherInfo, ExamPeriod, ExamResult } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedExamResultsInFirestore(
  db: Firestore,
  examPeriods: ExamPeriod[],
  classes: ClassWithTeacherInfo[],
  users: UserProfileWithId[],
  subjects: Subject[],
  schools: School[]
): Promise<void> {
  console.log("📊 Seeding exam results...");
  const batch = writeBatch(db);

  for (const examPeriod of examPeriods) {
    if (examPeriod.status === "upcoming") continue;

    for (const classId of examPeriod.assignedClassIds) {
      const classInfo = classes.find(c => c.id === classId);
      if (!classInfo || !classInfo.studentIds || classInfo.studentIds.length === 0) continue;

      const school = schools.find(s => s.id === classInfo.schoolId);
      if (!school) continue;

      const teacherForClass = users.find(u => u.id === classInfo.teacherId);
      if (!teacherForClass) continue;

      let relevantSubjectIds: string[] = [];
      if (classInfo.classType === 'main' && classInfo.compulsorySubjectIds) {
        relevantSubjectIds.push(...classInfo.compulsorySubjectIds);
      }
      const schoolSpecificSubjects = subjects.filter(s => s.schoolId === school.id);
      const electiveSubjects = schoolSpecificSubjects.filter(s => !relevantSubjectIds.includes(s.id));
      relevantSubjectIds.push(...faker.helpers.arrayElements(electiveSubjects.map(s => s.id), Math.min(2, electiveSubjects.length)));
      relevantSubjectIds = Array.from(new Set(relevantSubjectIds));

      for (const studentId of classInfo.studentIds) {
        for (const subjectId of relevantSubjectIds) {
          if (faker.datatype.boolean(0.8)) { // 80% chance to have a result for a subject
            const resultRef = doc(db, "examResults", uuidv4());
            const result: ExamResult = {
              id: resultRef.id,
              studentId,
              examPeriodId: examPeriod.id,
              classId,
              schoolId: school.id,
              subjectId: subjectId,
              marks: faker.number.int({ min: 40, max: 100 }).toString() + "%",
              remarks: faker.lorem.sentence(),
              teacherId: teacherForClass.id, 
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            };
            batch.set(resultRef, result);
          }
        }
      }
    }
  }
  await batch.commit();
  console.log("Finished seeding exam results.");
}
