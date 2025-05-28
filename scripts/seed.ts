
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { faker } from '@faker-js/faker';
import type {
  School,
  UserProfile,
  UserRole,
  UserStatus,
  Class,
  Subject,
  Assignment,
  LearningMaterial,
  ExamPeriod,
  ExamResult,
  AttendanceRecord,
  AttendanceStatus,
  ClassType,
  LearningMaterialType,
  SubmissionFormat,
  ExamPeriodStatus,
  Notification,
  Testimonial,
} from '../src/types'; // Adjust path as needed
import { v4 as uuidv4 } from 'uuid';

// --- Configuration ---
const NUM_SCHOOLS = 1;
const NUM_ADMINS_PER_SCHOOL = 1;
const NUM_TEACHERS_PER_SCHOOL = 3;
const NUM_STUDENTS_PER_SCHOOL = 10;
const NUM_PARENTS_PER_SCHOOL = 5;
const NUM_SUBJECTS_PER_SCHOOL = 5;
const NUM_MAIN_CLASSES_PER_SCHOOL = 2; // e.g., Form 1, Form 2
const NUM_SUBJECT_CLASSES_PER_SUBJECT_PER_MAIN_CLASS_LEVEL = 1; // e.g., Form 1 Math, Form 2 Math
const MAX_STUDENTS_PER_MAIN_CLASS = 7;
const NUM_MATERIALS_PER_TEACHER_CLASS_SUBJECT = 2;
const NUM_ASSIGNMENTS_PER_TEACHER_CLASS_SUBJECT = 1;
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.7;
const NUM_EXAM_PERIODS_PER_SCHOOL = 1;
const NUM_ATTENDANCE_RECORDS_PER_STUDENT_PER_DAY = 1;
const NUM_PAST_ATTENDANCE_DAYS = 5;
const NUM_NOTIFICATIONS_PER_USER = 3;
const NUM_TESTIMONIALS = 5;


// --- Firebase Admin Setup ---
let serviceAccountJson: ServiceAccount | undefined = undefined;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
  try {
    serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON_STRING:', e);
  }
} else {
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_JSON_STRING environment variable not found. ' +
    'Attempting to use GOOGLE_APPLICATION_CREDENTIALS if set, or default service account for some GCP environments.'
  );
}

if (serviceAccountJson) {
  initializeApp({ credential: cert(serviceAccountJson) });
} else {
  initializeApp(); // Relies on GOOGLE_APPLICATION_CREDENTIALS or default ADC
}


const db = getFirestore();
const adminAuth = getAuth();

const createFirebaseUser = async (email: string, pass: string, displayName: string): Promise<string | null> => {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password: pass,
      displayName,
      emailVerified: true,
    });
    return userRecord.uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.warn(`User with email ${email} already exists in Firebase Auth. Fetching existing UID.`);
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        return userRecord.uid;
      } catch (fetchError) {
        console.error(`Failed to fetch existing user ${email}:`, fetchError);
        return null;
      }
    }
    console.error(`Error creating Firebase Auth user ${email}:`, error);
    return null;
  }
};

const seededSchoolIds: string[] = [];
const seededTeacherIds: Record<string, string[]> = {}; // schoolId: [teacherId]
const seededStudentIds: Record<string, string[]> = {}; // schoolId: [studentId]
const seededParentIds: Record<string, string[]> = {};  // schoolId: [parentId]
const seededSubjectIds: Record<string, string[]> = {}; // schoolId: [subjectId]
const seededMainClassIds: Record<string, string[]> = {}; // schoolId: [classId]
const seededSubjectClassIds: Record<string, string[]> = {}; // schoolId: [classId]


async function seedSchools() {
  console.log('Seeding schools...');
  for (let i = 0; i < NUM_SCHOOLS; i++) {
    const schoolName = faker.company.name() + ' Academy';
    const schoolRef = db.collection('schools').doc();
    const schoolInviteCode = `SCH-${faker.string.alphanumeric(6).toUpperCase()}`;
    const school: School = {
      id: schoolRef.id,
      name: schoolName,
      adminId: '', // Will be updated after admin user is created
      inviteCode: schoolInviteCode,
      isExamModeActive: faker.datatype.boolean(0.3), // 30% chance of being active
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await schoolRef.set(school);
    seededSchoolIds.push(school.id);
    console.log(`  Created school: ${school.name} (ID: ${school.id})`);
  }
}

async function seedUsers() {
  console.log('Seeding users (admins, teachers, students, parents)...');
  for (const schoolId of seededSchoolIds) {
    const schoolDoc = await db.collection('schools').doc(schoolId).get();
    const schoolName = schoolDoc.data()?.name || 'School';
    seededTeacherIds[schoolId] = [];
    seededStudentIds[schoolId] = [];
    seededParentIds[schoolId] = [];

    // Admins
    for (let i = 0; i < NUM_ADMINS_PER_SCHOOL; i++) {
      const email = faker.internet.email({ firstName: `admin${i}`, lastName: schoolId.substring(0,4), provider: 'learnify.dev' });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUser(email, 'password123', displayName);
      if (uid) {
        const userProfile: Omit<UserProfile, keyof FirebaseUserType | 'classIds' | 'studentAssignments'> & { uid: string, createdAt: Timestamp, classIds?: string[], studentAssignments?: {}, status: UserStatus, schoolId?: string, schoolName?: string, subjects?: string[], childStudentId?: string, lastTestimonialSurveyAt?: Timestamp } = {
          uid, email, displayName, role: 'admin', schoolId, schoolName, status: 'active', createdAt: Timestamp.now(),
        };
        await db.collection('users').doc(uid).set(userProfile);
        if (i === 0) await db.collection('schools').doc(schoolId).update({ adminId: uid }); // First admin creates school
        console.log(`    Admin for ${schoolName}: ${displayName} (${email})`);
      }
    }

    // Teachers
    for (let i = 0; i < NUM_TEACHERS_PER_SCHOOL; i++) {
      const email = faker.internet.email({ firstName: `teacher${i}`, lastName: schoolId.substring(0,4), provider: 'learnify.dev' });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUser(email, 'password123', displayName);
      if (uid) {
        const userProfile: Partial<UserProfile> = {
          uid, email, displayName, role: 'teacher', schoolId, schoolName, status: 'active', createdAt: Timestamp.now(), classIds: []
        };
        await db.collection('users').doc(uid).set(userProfile);
        seededTeacherIds[schoolId].push(uid);
        console.log(`    Teacher for ${schoolName}: ${displayName} (${email})`);
      }
    }

    // Students & Parents
    for (let i = 0; i < NUM_STUDENTS_PER_SCHOOL; i++) {
      const studentFirstName = faker.person.firstName();
      const studentLastName = faker.person.lastName();
      const studentDisplayName = `${studentFirstName} ${studentLastName}`;
      const studentEmail = faker.internet.email({ firstName: studentFirstName, lastName: studentLastName, provider: 'learnify.student.dev' });
      const studentUid = await createFirebaseUser(studentEmail, 'password123', studentDisplayName);
      if (studentUid) {
        const userProfile: Partial<UserProfile> = {
          uid: studentUid, email: studentEmail, displayName: studentDisplayName, role: 'student', schoolId, schoolName, status: 'active', createdAt: Timestamp.now(), classIds: [], subjects: []
        };
        await db.collection('users').doc(studentUid).set(userProfile);
        seededStudentIds[schoolId].push(studentUid);
        console.log(`    Student for ${schoolName}: ${studentDisplayName} (${studentEmail})`);

        // Create a parent for some students
        if (i < NUM_PARENTS_PER_SCHOOL) {
          const parentDisplayName = `${faker.person.firstName()} ${studentLastName}`; // Parent might share last name
          const parentEmail = faker.internet.email({ firstName: parentDisplayName.split(' ')[0], lastName: studentLastName, provider: 'learnify.parent.dev' });
          const parentUid = await createFirebaseUser(parentEmail, 'password123', parentDisplayName);
          if (parentUid) {
            const parentProfile: Partial<UserProfile> = {
              uid: parentUid, email: parentEmail, displayName: parentDisplayName, role: 'parent', schoolId, schoolName, status: 'active', childStudentId: studentUid, createdAt: Timestamp.now()
            };
            await db.collection('users').doc(parentUid).set(parentProfile);
            seededParentIds[schoolId].push(parentUid);
            console.log(`      Parent for ${studentDisplayName}: ${parentDisplayName} (${parentEmail})`);
          }
        }
      }
    }
  }
}

async function seedSubjects() {
  console.log('Seeding subjects...');
  const commonSubjects = ["Mathematics", "English", "Science", "History", "Geography", "Art", "Music", "Physical Education", "Computer Studies", "Kiswahili", "Religious Education"];
  for (const schoolId of seededSchoolIds) {
    seededSubjectIds[schoolId] = [];
    const subjectsToSeed = faker.helpers.arrayElements(commonSubjects, NUM_SUBJECTS_PER_SCHOOL);
    for (const subjectName of subjectsToSeed) {
      const subjectRef = db.collection('subjects').doc();
      const subject: Subject = {
        id: subjectRef.id,
        name: subjectName,
        schoolId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await subjectRef.set(subject);
      seededSubjectIds[schoolId].push(subject.id);
    }
    console.log(`  Seeded ${NUM_SUBJECTS_PER_SCHOOL} subjects for school ${schoolId}`);
  }
}

async function seedClasses() {
  console.log('Seeding classes...');
  for (const schoolId of seededSchoolIds) {
    const teachers = seededTeacherIds[schoolId] || [];
    const students = seededStudentIds[schoolId] || [];
    const subjects = seededSubjectIds[schoolId] || [];
    if (teachers.length === 0) {
      console.warn(`  No teachers for school ${schoolId}, skipping class creation.`);
      continue;
    }
    seededMainClassIds[schoolId] = [];
    seededSubjectClassIds[schoolId] = [];

    // Main Classes
    for (let i = 0; i < NUM_MAIN_CLASSES_PER_SCHOOL; i++) {
      const classRef = db.collection('classes').doc();
      const mainClassName = `Form ${i + 1} Alpha`;
      const assignedTeacherId = teachers[i % teachers.length];
      const compulsorySubjects = faker.helpers.arrayElements(subjects, Math.min(2, subjects.length)).map(s => s); // All subject IDs are strings now

      const classData: Class = {
        id: classRef.id, name: mainClassName, schoolId, teacherId: assignedTeacherId,
        classType: 'main', studentIds: [], classInviteCode: `MC-${faker.string.alphanumeric(6).toUpperCase()}`,
        compulsorySubjectIds: compulsorySubjects, subjectId: null,
        createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      };
      await classRef.set(classData);
      seededMainClassIds[schoolId].push(classRef.id);
      console.log(`    Created main class: ${mainClassName} for school ${schoolId}`);

      // Enroll some students in this main class & assign compulsory subjects
      const studentsToEnroll = faker.helpers.arrayElements(students, Math.min(MAX_STUDENTS_PER_CLASS, students.length));
      for (const studentId of studentsToEnroll) {
        await db.collection('users').doc(studentId).update({
          classIds: FieldValue.arrayUnion(classRef.id),
          subjects: FieldValue.arrayUnion(...compulsorySubjects)
        });
        await classRef.update({ studentIds: FieldValue.arrayUnion(studentId) });
      }

      // Subject-based classes for this main class level
      for (const subjectId of subjects) {
          const subjectDoc = await db.collection('subjects').doc(subjectId).get();
          const subjectName = subjectDoc.data()?.name || 'Subject';
          const subjectClassRef = db.collection('classes').doc();
          const subjectClassName = `${subjectName} - Form ${i + 1}`;
          const subjectClassData: Class = {
            id: subjectClassRef.id, name: subjectClassName, schoolId, teacherId: faker.helpers.arrayElement(teachers),
            classType: 'subject_based', studentIds: [], classInviteCode: `SC-${faker.string.alphanumeric(6).toUpperCase()}`,
            compulsorySubjectIds: [], subjectId: subjectId,
            createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
          };
          await subjectClassRef.set(subjectClassData);
          seededSubjectClassIds[schoolId].push(subjectClassRef.id);
          console.log(`      Created subject class: ${subjectClassName} for school ${schoolId}`);
           // Enroll students from the main class who take this subject (if not compulsory, could be selective)
          for (const studentId of studentsToEnroll) {
             // For simplicity, enroll all students from main class into its corresponding subject classes
             // In a real scenario, students would pick electives.
            if(compulsorySubjects.includes(subjectId) || faker.datatype.boolean(0.7)) { // 70% take non-compulsory
                await db.collection('users').doc(studentId).update({
                    classIds: FieldValue.arrayUnion(subjectClassRef.id),
                    subjects: FieldValue.arrayUnion(subjectId) // Ensure they have the subject
                });
                await subjectClassRef.update({ studentIds: FieldValue.arrayUnion(studentId) });
            }
          }
      }
    }
  }
}


async function seedLearningMaterials() {
  console.log('Seeding learning materials...');
  for (const schoolId of seededSchoolIds) {
    const teachers = seededTeacherIds[schoolId] || [];
    const classes = [...(seededMainClassIds[schoolId] || []), ...(seededSubjectClassIds[schoolId] || [])];
    const subjects = seededSubjectIds[schoolId] || [];
    if (teachers.length === 0 || classes.length === 0) continue;

    for (const teacherId of teachers) {
      const assignedClasses = classes.filter(clsId => {
          const classDoc = db.collection('classes').doc(clsId); // This needs actual fetching if teacherId isn't on class directly
          // For simplicity, let's assume teacher teaches a few random classes
          return faker.datatype.boolean(0.5);
      });

      for (const classId of assignedClasses) {
        const classDoc = await db.collection('classes').doc(classId).get();
        const classData = classDoc.data() as Class | undefined;
        if (!classData) continue;

        const subjectIdForMaterial = classData.subjectId || (subjects.length > 0 ? faker.helpers.arrayElement(subjects) : null);

        for (let i = 0; i < NUM_MATERIALS_PER_TEACHER_CLASS_SUBJECT; i++) {
          const materialType = faker.helpers.arrayElement<LearningMaterialType>(['text', 'link', 'pdf_link', 'video_link']); // No pdf_upload for seeder simplicity
          const materialRef = db.collection('learningMaterials').doc();
          const material: Omit<LearningMaterial, 'id' | 'originalFileName' | 'attachmentUrl'> = {
            title: faker.lorem.sentence(5),
            content: materialType === 'text' ? faker.lorem.paragraphs(2) : faker.internet.url(),
            materialType,
            schoolId,
            teacherId,
            classId,
            subjectId: subjectIdForMaterial,
            createdAt: Timestamp.fromDate(faker.date.recent({ days: 30 })),
            updatedAt: Timestamp.fromDate(faker.date.recent({ days: 10 })),
          };
          await materialRef.set({ ...material, id: materialRef.id });
        }
      }
    }
     console.log(`  Seeded materials for school ${schoolId}`);
  }
}

async function seedAssignmentsAndSubmissions() {
  console.log('Seeding assignments and submissions...');
  for (const schoolId of seededSchoolIds) {
      const teachers = seededTeacherIds[schoolId] || [];
      const classes = [...(seededMainClassIds[schoolId] || []), ...(seededSubjectClassIds[schoolId] || [])];
      const subjects = seededSubjectIds[schoolId] || [];
      if (teachers.length === 0 || classes.length === 0) continue;

      for (const teacherId of teachers) {
          const assignedClasses = classes.filter(() => faker.datatype.boolean(0.5)); // Teacher teaches some random classes

          for (const classId of assignedClasses) {
              const classDoc = await db.collection('classes').doc(classId).get();
              const classData = classDoc.data() as Class | undefined;
              if (!classData || !classData.studentIds || classData.studentIds.length === 0) continue;

              const subjectIdForAssignment = classData.subjectId || (subjects.length > 0 ? faker.helpers.arrayElement(subjects) : null);

              for (let i = 0; i < NUM_ASSIGNMENTS_PER_TEACHER_CLASS_SUBJECT; i++) {
                  const assignmentRef = db.collection('assignments').doc();
                  const deadline = Timestamp.fromDate(faker.date.soon({ days: 14 }));
                  const assignment: Omit<Assignment, 'id' | 'totalSubmissions'> = {
                      classId, teacherId, schoolId, subjectId: subjectIdForAssignment,
                      title: `Assignment: ${faker.lorem.words(3)}`,
                      description: faker.lorem.paragraph(),
                      deadline,
                      allowedSubmissionFormats: faker.helpers.arrayElements<SubmissionFormat>(['text_entry', 'file_link', 'file_upload'], faker.number.int({min: 1, max: 2})),
                      createdAt: Timestamp.fromDate(faker.date.recent({ days: 7, refDate: deadline.toDate() })),
                      updatedAt: Timestamp.fromDate(faker.date.recent({ days: 3, refDate: deadline.toDate() })),
                  };
                  await assignmentRef.set({ ...assignment, id: assignmentRef.id, totalSubmissions: 0 });
                  console.log(`    Created assignment: "${assignment.title}" for class ${classId}`);

                  let submissionsCount = 0;
                  for (const studentId of classData.studentIds) {
                      if (Math.random() < SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE) {
                          const submissionRef = db.collection('submissions').doc();
                          const submittedAt = Timestamp.fromDate(faker.date.between({ from: assignment.createdAt.toDate(), to: deadline.toDate() }));
                          const submissionType = faker.helpers.arrayElement(assignment.allowedSubmissionFormats);
                          const status = faker.datatype.boolean(0.6) ? 'graded' : (submittedAt > deadline ? 'late' : 'submitted');
                          
                          const submission: Omit<Submission, 'id'> = {
                              assignmentId: assignmentRef.id, classId, studentId, submittedAt,
                              submissionType,
                              content: submissionType === 'text_entry' ? faker.lorem.paragraph() : (submissionType === 'file_link' ? faker.internet.url() : `https://example.com/uploads/${faker.system.fileName()}`),
                              originalFileName: submissionType === 'file_upload' ? faker.system.commonFileName('pdf') : undefined,
                              grade: status === 'graded' ? faker.number.int({ min: 60, max: 100 }).toString() + '%' : undefined,
                              feedback: status === 'graded' ? faker.lorem.sentence() : undefined,
                              status,
                              updatedAt: Timestamp.now(),
                          };
                          await submissionRef.set({ ...submission, id: submissionRef.id });
                          submissionsCount++;
                      }
                  }
                  await assignmentRef.update({ totalSubmissions: submissionsCount });
              }
          }
      }
      console.log(`  Seeded assignments & submissions for school ${schoolId}`);
  }
}

// Add more seed functions for ExamPeriods, ExamResults, Attendance, Notifications, Testimonials...
// Example for ExamPeriods
async function seedExamPeriods() {
    console.log('Seeding exam periods...');
    for (const schoolId of seededSchoolIds) {
        const classes = [...(seededMainClassIds[schoolId] || []), ...(seededSubjectClassIds[schoolId] || [])];
        if (classes.length === 0) continue;

        for (let i = 0; i < NUM_EXAM_PERIODS_PER_SCHOOL; i++) {
            const examPeriodRef = db.collection('examPeriods').doc();
            const startDate = faker.date.soon({ days: 10 });
            const endDate = faker.date.soon({ days: 5, refDate: startDate });
            const statusOptions: ExamPeriodStatus[] = ['upcoming', 'active', 'grading'];
            const examPeriod: Omit<ExamPeriod, 'id'> = {
                name: `${faker.helpers.arrayElement(['Mid-Term', 'End-Term', 'Final'])} Exams ${startDate.getFullYear()} Term ${i+1}`,
                schoolId,
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
                assignedClassIds: faker.helpers.arrayElements(classes, faker.number.int({ min: 1, max: Math.min(classes.length, 3) })),
                status: faker.helpers.arrayElement(statusOptions),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            await examPeriodRef.set({ ...examPeriod, id: examPeriodRef.id });
        }
        console.log(`  Seeded exam periods for school ${schoolId}`);
    }
}


async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    await seedSchools();
    await seedUsers(); // Depends on schools
    await seedSubjects(); // Depends on schools
    await seedClasses(); // Depends on schools, users (teachers), subjects
    await seedLearningMaterials(); // Depends on classes, teachers, subjects
    await seedAssignmentsAndSubmissions(); // Depends on classes, teachers, students, subjects
    await seedExamPeriods(); // Depends on schools, classes
    // Add calls to other seed functions here in logical order

    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

seedDatabase();
