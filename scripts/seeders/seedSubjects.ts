
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, Subject } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedSubjectsInFirestore(
  db: Firestore,
  schools: School[],
  numSubjectsPerSchool: number
): Promise<Subject[]> {
  console.log(`📚 Seeding subjects for ${schools.length} schools...`);
  const subjects: Subject[] = [];
  const commonSubjects = [
    "Mathematics", "English Language", "Integrated Science", "Social Studies",
    "Creative Arts", "Physical Education", "Computing", "Religious & Moral Education",
    "French", "Career Technology", "History", "Geography", "Biology", "Chemistry", "Physics"
  ];

  for (const school of schools) {
    const subjectsToSeedNames = faker.helpers.arrayElements(commonSubjects, Math.min(numSubjectsPerSchool, commonSubjects.length));
    for (const subjectName of subjectsToSeedNames) {
      const subjectRef = doc(db, "subjects", uuidv4());
      const subject: Subject = {
        id: subjectRef.id,
        name: subjectName,
        schoolId: school.id,
        isCompulsory: faker.datatype.boolean(0.3), // 30% chance of being compulsory
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(subjectRef, subject);
      subjects.push(subject);
    }
    console.log(`  Seeded ${subjectsToSeedNames.length} subjects for school ${school.name}`);
  }
  return subjects;
}
