
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, UserProfileWithId, Subject, ClassWithTeacherInfo, LearningMaterial, LearningMaterialType } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedLearningMaterialsInFirestore(
  db: Firestore,
  classes: ClassWithTeacherInfo[],
  users: UserProfileWithId[],
  subjects: Subject[],
  schools: School[],
  numMaterialsPerClassSubject: number
): Promise<void> {
  console.log("📄 Seeding learning materials...");
  const batch = writeBatch(db);

  for (const classData of classes) {
    const school = schools.find(s => s.id === classData.schoolId);
    if (!school) continue;

    const teacher = users.find(u => u.id === classData.teacherId);
    if (!teacher) continue;

    let relevantSubjects: Subject[] = [];
    if (classData.classType === 'main' && classData.compulsorySubjectIds) {
      relevantSubjects = subjects.filter(s => classData.compulsorySubjectIds!.includes(s.id));
    } else if (classData.classType === 'subject_based' && classData.subjectId) {
      const sub = subjects.find(s => s.id === classData.subjectId);
      if (sub) relevantSubjects.push(sub);
    }
    relevantSubjects = relevantSubjects.length > 0 ? relevantSubjects : faker.helpers.arrayElements(subjects.filter(s => s.schoolId === school.id), 1);

    for (const subject of relevantSubjects) {
      for (let i = 0; i < numMaterialsPerClassSubject; i++) {
        const materialType = faker.helpers.arrayElement<LearningMaterialType>(["text", "link", "pdf_link", "video_link"]);
        const materialRef = doc(db, "learningMaterials", uuidv4());
        const material: LearningMaterial = {
          id: materialRef.id,
          title: `${subject.name} - ${faker.lorem.words(3)}`,
          content: materialType === "text" ? faker.lorem.paragraphs(2) : faker.internet.url(),
          materialType,
          schoolId: school.id,
          teacherId: teacher.id,
          classId: classData.id,
          subjectId: subject.id,
          createdAt: Timestamp.fromDate(faker.date.recent({ days: 30 })),
          updatedAt: Timestamp.fromDate(faker.date.recent({ days: 10 })),
        };
        batch.set(materialRef, material);
      }
    }
  }
  await batch.commit();
  console.log("Finished seeding learning materials.");
}
