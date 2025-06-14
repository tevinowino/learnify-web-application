
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, ClassWithTeacherInfo, ExamPeriod, ExamPeriodStatus } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedExamPeriodsInFirestore(
  db: Firestore,
  schools: School[],
  classes: ClassWithTeacherInfo[],
  numExamPeriodsPerSchool: number
): Promise<ExamPeriod[]> {
  console.log(`📅 Seeding ${numExamPeriodsPerSchool} exam periods per school...`);
  const examPeriods: ExamPeriod[] = [];
  const batch = writeBatch(db);

  for (const school of schools) {
    const mainClassesInSchool = classes.filter(c => c.schoolId === school.id && c.classType === "main");
    if (mainClassesInSchool.length === 0) {
      console.warn(`  No main classes found for school ${school.name}, skipping exam period creation.`);
      continue;
    }

    for (let i = 0; i < numExamPeriodsPerSchool; i++) {
      const examPeriodRef = doc(db, "examPeriods", uuidv4());
      const startDate = faker.date.soon({ days: (i * 30) + 10 });
      const endDate = faker.date.soon({ days: 5, refDate: startDate });
      const statusOptions: ExamPeriodStatus[] = ["upcoming", "active", "grading", "completed"];
      
      const examPeriod: ExamPeriod = {
        id: examPeriodRef.id,
        name: `${faker.helpers.arrayElement(["Mid-Term", "End-Term", "Final"])} Exams ${startDate.getFullYear()} Term ${i + 1}`,
        schoolId: school.id,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        assignedClassIds: faker.helpers.arrayElements(mainClassesInSchool.map((c) => c.id), faker.number.int({ min: 1, max: Math.min(mainClassesInSchool.length, 2) })),
        status: faker.helpers.arrayElement(statusOptions),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(examPeriodRef, examPeriod);
      examPeriods.push(examPeriod);
    }
    console.log(`  Seeded exam periods for school ${school.name}`);
  }
  await batch.commit();
  console.log("Finished seeding exam periods.");
  return examPeriods;
}
