
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch, updateDoc } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, UserProfileWithId, Subject, ClassWithTeacherInfo, Assignment, Submission, SubmissionFormat } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedAssignmentsAndSubmissionsInFirestore(
  db: Firestore,
  classes: ClassWithTeacherInfo[],
  users: UserProfileWithId[],
  subjects: Subject[],
  schools: School[],
  numAssignmentsPerClassSubject: number,
  submissionsPerAssignmentPercentage: number
): Promise<void> {
  console.log("📝 Seeding assignments and submissions...");
  const batch = writeBatch(db);

  for (const classData of classes) {
    const school = schools.find(s => s.id === classData.schoolId);
    if (!school) continue;
    const teacher = users.find(u => u.id === classData.teacherId);
    if (!teacher) continue;

    const studentsInClass = users.filter(u => u.schoolId === school.id && u.role === 'student' && classData.studentIds?.includes(u.id));
    if (studentsInClass.length === 0) continue;

    let relevantSubjects: Subject[] = [];
    if (classData.classType === 'main' && classData.compulsorySubjectIds) {
      relevantSubjects = subjects.filter(s => classData.compulsorySubjectIds!.includes(s.id) && s.schoolId === school.id);
    } else if (classData.classType === 'subject_based' && classData.subjectId) {
      const sub = subjects.find(s => s.id === classData.subjectId && s.schoolId === school.id);
      if (sub) relevantSubjects.push(sub);
    }
    relevantSubjects = relevantSubjects.length > 0 ? relevantSubjects : faker.helpers.arrayElements(subjects.filter(s => s.schoolId === school.id), 1);

    for (const subject of relevantSubjects) {
      for (let i = 0; i < numAssignmentsPerClassSubject; i++) {
        const assignmentRef = doc(db, "assignments", uuidv4());
        const deadline = Timestamp.fromDate(faker.date.soon({ days: 14 }));
        const assignment: Assignment = {
          id: assignmentRef.id,
          classId: classData.id,
          teacherId: teacher.id,
          schoolId: school.id,
          subjectId: subject.id,
          title: `Assignment: ${subject.name} - ${faker.lorem.words(2)}`,
          description: faker.lorem.paragraph(),
          deadline,
          allowedSubmissionFormats: faker.helpers.arrayElements<SubmissionFormat>(["text_entry", "file_link", "file_upload"], faker.number.int({ min: 1, max: 2 })),
          createdAt: Timestamp.fromDate(faker.date.recent({ days: 7, refDate: deadline.toDate() })),
          updatedAt: Timestamp.fromDate(faker.date.recent({ days: 3, refDate: deadline.toDate() })),
          totalSubmissions: 0, // Initialize and update below
        };
        batch.set(assignmentRef, assignment);

        let submissionsCount = 0;
        for (const student of studentsInClass) {
          if (Math.random() < submissionsPerAssignmentPercentage) {
            const submissionRef = doc(db, "submissions", uuidv4());
            const submittedAt = Timestamp.fromDate(faker.date.between({ from: assignment.createdAt.toDate(), to: deadline.toDate() }));
            const submissionType = faker.helpers.arrayElement(assignment.allowedSubmissionFormats);
            const statusOptions: Submission['status'][] = ['submitted', 'graded', 'late'];
            const status = faker.helpers.arrayElement(statusOptions);

            const submission: Submission = {
              id: submissionRef.id,
              assignmentId: assignmentRef.id,
              classId: classData.id,
              studentId: student.id,
              submittedAt,
              submissionType,
              content: submissionType === "text_entry" ? faker.lorem.paragraph() : submissionType === "file_link" ? faker.internet.url() : `https://placehold.co/300x200.png?text=${faker.system.fileName()}`,
              originalFileName: submissionType === "file_upload" ? faker.system.commonFileName("pdf") : undefined,
              grade: status === "graded" ? faker.number.int({ min: 60, max: 100 }).toString() + "%" : undefined,
              feedback: status === "graded" ? faker.lorem.sentence() : undefined,
              status,
              updatedAt: Timestamp.now(),
            };
            batch.set(submissionRef, submission);
            submissionsCount++;
          }
        }
        // We need to update totalSubmissions after the loop for submissions
        // This requires a separate update operation which can't be batched with the creation if ID is auto-generated.
        // For simplicity here, we'll do it after the batch. Better would be to use a transaction or cloud function.
        // Or, if we pre-generate IDs for assignments, we can batch the update.
        // For seeder, let's update it separately post-batch for now.
        updateDoc(assignmentRef, { totalSubmissions: submissionsCount }); 
      }
    }
  }
  await batch.commit();
  console.log("Finished seeding assignments & submissions (totalSubmissions updated separately).");
}
