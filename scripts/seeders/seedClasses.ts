
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch, FieldValue } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, UserProfileWithId, Subject, Class, ClassWithTeacherInfo } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedClassesInFirestore(
  db: Firestore,
  schools: School[],
  users: UserProfileWithId[],
  subjects: Subject[],
  numMainClassesPerSchool: number
): Promise<ClassWithTeacherInfo[]> {
  console.log("🏛️ Seeding classes and enrollments...");
  const createdClasses: ClassWithTeacherInfo[] = [];
  const batch = writeBatch(db);

  for (const school of schools) {
    const schoolTeachers = users.filter(u => u.schoolId === school.id && u.role === 'teacher');
    const schoolStudents = users.filter(u => u.schoolId === school.id && u.role === 'student');
    const schoolSpecificSubjects = subjects.filter(s => s.schoolId === school.id);

    if (schoolTeachers.length === 0 || schoolStudents.length === 0 || schoolSpecificSubjects.length === 0) {
      console.warn(`  Skipping class creation for ${school.name}: Insufficient teachers, students, or subjects.`);
      continue;
    }

    const studentsPerMainClass = Math.max(1, Math.floor(schoolStudents.length / numMainClassesPerSchool));

    for (let i = 0; i < numMainClassesPerSchool; i++) {
      const classRef = doc(db, "classes", uuidv4());
      const mainClassName = `Form ${i + 1}${faker.helpers.arrayElement(["A", "B", "C", "D"])}`;
      const assignedTeacher = schoolTeachers[i % schoolTeachers.length];
      
      const compulsorySubjectsForThisClass = faker.helpers.arrayElements(
        schoolSpecificSubjects.filter(s => s.isCompulsory),
        faker.number.int({ min: 1, max: Math.min(3, schoolSpecificSubjects.filter(s => s.isCompulsory).length || 1) })
      );
      const compulsorySubjectIds = compulsorySubjectsForThisClass.map(s => s.id);
      const compulsorySubjectNames = compulsorySubjectsForThisClass.map(s => s.name);

      const enrolledStudentBatch = schoolStudents.slice(i * studentsPerMainClass, (i + 1) * studentsPerMainClass);
      const enrolledStudentIds = enrolledStudentBatch.map(s => s.id);

      const classData: Class = {
        id: classRef.id,
        name: mainClassName,
        schoolId: school.id,
        teacherId: assignedTeacher.id,
        classType: "main",
        studentIds: enrolledStudentIds,
        classInviteCode: `MC-${faker.string.alphanumeric(6).toUpperCase()}`,
        compulsorySubjectIds: compulsorySubjectIds,
        subjectId: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(classRef, classData);
      createdClasses.push({ ...classData, teacherDisplayName: assignedTeacher.displayName, compulsorySubjectNames });
      console.log(`    Created main class: ${mainClassName} for ${school.name} with ${enrolledStudentIds.length} students. Teacher: ${assignedTeacher.displayName}`);

      for (const student of enrolledStudentBatch) {
        const studentRef = doc(db, "users", student.id);
        batch.update(studentRef, {
          classIds: FieldValue.arrayUnion(classRef.id),
          subjects: FieldValue.arrayUnion(...compulsorySubjectIds),
          onboardingStep: null, // Mark student as onboarded to this main class
          updatedAt: Timestamp.now(),
        });
      }

      const electiveSubjects = schoolSpecificSubjects.filter(s => !compulsorySubjectIds.includes(s.id));
      const subjectsForSubjectClasses = [...compulsorySubjectsForThisClass, ...faker.helpers.arrayElements(electiveSubjects, Math.min(2, electiveSubjects.length))];

      for (const subject of subjectsForSubjectClasses) {
        const subjectClassRef = doc(db, "classes", uuidv4());
        const subjectClassName = `${subject.name} - ${mainClassName.split(" ")[0]} ${mainClassName.split(" ")[1]}`;
        const subjectTeacher = schoolTeachers[(i + schoolSpecificSubjects.indexOf(subject)) % schoolTeachers.length];

        const subjectClassData: Class = {
          id: subjectClassRef.id,
          name: subjectClassName,
          schoolId: school.id,
          teacherId: subjectTeacher.id,
          classType: "subject_based",
          studentIds: [], 
          classInviteCode: `SC-${faker.string.alphanumeric(6).toUpperCase()}`,
          compulsorySubjectIds: [],
          subjectId: subject.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        batch.set(subjectClassRef, subjectClassData);
        createdClasses.push({ ...subjectClassData, teacherDisplayName: subjectTeacher.displayName, subjectName: subject.name });
        console.log(`      Created subject class: ${subjectClassName} for ${school.name}. Teacher: ${subjectTeacher.displayName}`);

        let enrolledInSubjectClassCount = 0;
        for (const student of enrolledStudentBatch) {
          const isCompulsoryForMain = compulsorySubjectIds.includes(subject.id);
          if (isCompulsoryForMain || faker.datatype.boolean(0.6)) {
            const studentRef = doc(db, "users", student.id);
            batch.update(studentRef, {
              classIds: FieldValue.arrayUnion(subjectClassRef.id),
              subjects: FieldValue.arrayUnion(subject.id),
              updatedAt: Timestamp.now(),
            });
            batch.update(subjectClassRef, {
              studentIds: FieldValue.arrayUnion(student.id),
              updatedAt: Timestamp.now(),
            });
            enrolledInSubjectClassCount++;
          }
        }
        console.log(`        Enrolled ${enrolledInSubjectClassCount} students into ${subjectClassName}.`);
      }
    }
  }
  await batch.commit();
  console.log("Finished seeding classes and enrollments.");
  return createdClasses;
}
