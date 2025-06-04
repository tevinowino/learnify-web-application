
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
  Notification, // Though not directly seeded extensively, kept for type consistency
  Testimonial,
} from '../src/types';
import { v4 as uuidv4 } from 'uuid';

// --- Configuration ---
const NUM_SCHOOLS = 1;
const NUM_ADMINS_PER_SCHOOL = 1;
const NUM_TEACHERS_PER_SCHOOL = 10;
const NUM_STUDENTS_PER_SCHOOL = 50;
const NUM_PARENTS_PER_SCHOOL = 30; // Approx 60% of students get a parent
const NUM_SUBJECTS_PER_SCHOOL = 8;
const NUM_MAIN_CLASSES_PER_SCHOOL = 4; // e.g., Form 1, Form 2, Form 3, Form 4
// MAX_STUDENTS_PER_MAIN_CLASS adjusted dynamically based on total students and classes
const NUM_MATERIALS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT = 2;
const NUM_ASSIGNMENTS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT = 2;
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.75;
const NUM_EXAM_PERIODS_PER_SCHOOL = 2; // e.g., Mid-Term, End-Term
const NUM_ATTENDANCE_DAYS_TO_SEED = 10; // Seed attendance for the past 10 school days
const NUM_TESTIMONIALS_TO_SEED = 5;


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
  console.log('Initializing Firebase Admin SDK with provided service account JSON.');
  initializeApp({ 
    credential: cert(serviceAccountJson),
    projectId: "learnify-project-e7f59", 
  });
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
      emailVerified: true, // Assume verified for seeder
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
const seededExamPeriodIds: Record<string, string[]> = {}; // schoolId: [examPeriodId]

// Store all created class details for later reference (e.g., assigning teachers, subjects)
let allCreatedClasses: (Class & { teacherDisplayName?: string, subjectName?: string })[] = [];
let allCreatedSubjects: Subject[] = [];


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
      isExamModeActive: faker.datatype.boolean(0.3),
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
        const userProfile: UserProfile = {
          uid, email, displayName, role: 'admin', schoolId, schoolName, status: 'active', createdAt: Timestamp.now(), classIds: [], subjects: [], photoURL: faker.image.avatar(), emailVerified: true, isAnonymous:false, metadata:{creationTime: Timestamp.now().toDate().toISOString(), lastSignInTime:Timestamp.now().toDate().toISOString()}, providerData:[], providerId: "password", tenantId:null, refreshToken:"", delete: async () => {}, getIdToken: async () => "", getIdTokenResult: async () => ({} as any), reload: async () => {} , toJSON: () => ({})
        };
        await db.collection('users').doc(uid).set(userProfile);
        if (i === 0) await db.collection('schools').doc(schoolId).update({ adminId: uid });
        console.log(`    Admin for ${schoolName}: ${displayName} (${email})`);
      }
    }

    // Teachers
    for (let i = 0; i < NUM_TEACHERS_PER_SCHOOL; i++) {
      const email = faker.internet.email({ firstName: `teacher${i}`, lastName: schoolId.substring(0,4), provider: 'learnify.dev' });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUser(email, 'password123', displayName);
      if (uid) {
        const userProfile: UserProfile = {
          uid, email, displayName, role: 'teacher', schoolId, schoolName, status: 'active', createdAt: Timestamp.now(), classIds: [], subjects: [], photoURL: faker.image.avatar(), emailVerified: true, isAnonymous:false, metadata:{creationTime: Timestamp.now().toDate().toISOString(), lastSignInTime:Timestamp.now().toDate().toISOString()}, providerData:[], providerId: "password", tenantId:null, refreshToken:"", delete: async () => {}, getIdToken: async () => "", getIdTokenResult: async () => ({} as any), reload: async () => {} , toJSON: () => ({})
        };
        await db.collection('users').doc(uid).set(userProfile);
        seededTeacherIds[schoolId].push(uid);
        console.log(`    Teacher for ${schoolName}: ${displayName} (${email})`);
      }
    }

    // Students
    for (let i = 0; i < NUM_STUDENTS_PER_SCHOOL; i++) {
      const studentFirstName = faker.person.firstName();
      const studentLastName = faker.person.lastName();
      const studentDisplayName = `${studentFirstName} ${studentLastName}`;
      const studentEmail = faker.internet.email({ firstName: studentFirstName, lastName: studentLastName, provider: 'learnify.student.dev' });
      const studentUid = await createFirebaseUser(studentEmail, 'password123', studentDisplayName);
      if (studentUid) {
        const userProfile: UserProfile = {
          uid: studentUid, email: studentEmail, displayName: studentDisplayName, role: 'student', schoolId, schoolName, status: 'active', createdAt: Timestamp.now(), classIds: [], subjects: [], photoURL: faker.image.avatar(), emailVerified: true, isAnonymous:false, metadata:{creationTime: Timestamp.now().toDate().toISOString(), lastSignInTime:Timestamp.now().toDate().toISOString()}, providerData:[], providerId: "password", tenantId:null, refreshToken:"", delete: async () => {}, getIdToken: async () => "", getIdTokenResult: async () => ({} as any), reload: async () => {} , toJSON: () => ({})
        };
        await db.collection('users').doc(studentUid).set(userProfile);
        seededStudentIds[schoolId].push(studentUid);
        console.log(`    Student for ${schoolName}: ${studentDisplayName} (${studentEmail})`);

        // Create a parent for some students
        if (i < NUM_PARENTS_PER_SCHOOL) {
          const parentDisplayName = `${faker.person.firstName()} ${studentLastName}`;
          const parentEmail = faker.internet.email({ firstName: parentDisplayName.split(' ')[0], lastName: studentLastName, provider: 'learnify.parent.dev' });
          const parentUid = await createFirebaseUser(parentEmail, 'password123', parentDisplayName);
          if (parentUid) {
            const parentProfile: UserProfile = {
              uid: parentUid, email: parentEmail, displayName: parentDisplayName, role: 'parent', schoolId, schoolName, status: 'active', childStudentId: studentUid, createdAt: Timestamp.now(), classIds: [], subjects: [], photoURL: faker.image.avatar(), emailVerified: true, isAnonymous:false, metadata:{creationTime: Timestamp.now().toDate().toISOString(), lastSignInTime:Timestamp.now().toDate().toISOString()}, providerData:[], providerId: "password", tenantId:null, refreshToken:"", delete: async () => {}, getIdToken: async () => "", getIdTokenResult: async () => ({} as any), reload: async () => {} , toJSON: () => ({})
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
  const commonSubjects = ["Mathematics", "English Language", "Integrated Science", "Social Studies", "Creative Arts", "Physical Education", "Computing", "Religious & Moral Education", "French", "Career Technology"];
  for (const schoolId of seededSchoolIds) {
    seededSubjectIds[schoolId] = [];
    const subjectsToSeed = faker.helpers.arrayElements(commonSubjects, NUM_SUBJECTS_PER_SCHOOL);
    for (const subjectName of subjectsToSeed) {
      const subjectRef = db.collection('subjects').doc();
      const subject: Subject = {
        id: subjectRef.id, name: subjectName, schoolId,
        createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      };
      await subjectRef.set(subject);
      seededSubjectIds[schoolId].push(subject.id);
      allCreatedSubjects.push(subject);
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
    if (teachers.length === 0 || students.length === 0 || subjects.length === 0) {
      console.warn(`  Insufficient teachers, students, or subjects for school ${schoolId}, skipping class creation.`);
      continue;
    }
    seededMainClassIds[schoolId] = [];
    seededSubjectClassIds[schoolId] = [];

    // Distribute students into main classes
    const studentsPerMainClass = Math.ceil(students.length / NUM_MAIN_CLASSES_PER_SCHOOL);

    for (let i = 0; i < NUM_MAIN_CLASSES_PER_SCHOOL; i++) {
      const classRef = db.collection('classes').doc();
      const mainClassName = `Form ${i + 1} Stream ${faker.helpers.arrayElement(['A', 'B', 'C'])}`;
      const assignedTeacherId = teachers[i % teachers.length];
      const compulsorySubjects = faker.helpers.arrayElements(subjects, Math.min(3, subjects.length));

      const enrolledStudentIds = students.slice(i * studentsPerMainClass, (i + 1) * studentsPerMainClass);

      const classData: Class = {
        id: classRef.id, name: mainClassName, schoolId, teacherId: assignedTeacherId,
        classType: 'main', studentIds: enrolledStudentIds, classInviteCode: `MC-${faker.string.alphanumeric(6).toUpperCase()}`,
        compulsorySubjectIds: compulsorySubjects, subjectId: null,
        createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      };
      await classRef.set(classData);
      seededMainClassIds[schoolId].push(classRef.id);
      allCreatedClasses.push(classData);
      console.log(`    Created main class: ${mainClassName} with ${enrolledStudentIds.length} students.`);

      // Update enrolled students with this main class and its compulsory subjects
      for (const studentId of enrolledStudentIds) {
        await db.collection('users').doc(studentId).update({
          classIds: FieldValue.arrayUnion(classRef.id),
          subjects: FieldValue.arrayUnion(...compulsorySubjects)
        });
      }

      // Create subject-based classes for this main class level
      for (const subjectId of subjects) {
        const subjectDoc = allCreatedSubjects.find(s => s.id === subjectId);
        const subjectName = subjectDoc?.name || 'Unknown Subject';
        const subjectClassRef = db.collection('classes').doc();
        const subjectClassName = `${subjectName} - ${mainClassName.split(' ')[0]} ${mainClassName.split(' ')[1]}`; // e.g., Mathematics - Form 1
        const subjectTeacherId = teachers[(i + subjects.indexOf(subjectId)) % teachers.length]; // Vary subject teachers

        const subjectClassData: Class = {
          id: subjectClassRef.id, name: subjectClassName, schoolId, teacherId: subjectTeacherId,
          classType: 'subject_based', studentIds: [], classInviteCode: `SC-${faker.string.alphanumeric(6).toUpperCase()}`,
          compulsorySubjectIds: [], subjectId: subjectId,
          createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
        };
        await subjectClassRef.set(subjectClassData);
        seededSubjectClassIds[schoolId].push(subjectClassRef.id);
        allCreatedClasses.push(subjectClassData);
        console.log(`      Created subject class: ${subjectClassName}`);

        // Enroll students from the main class into this subject-based class if it's compulsory or they "elect" it
        for (const studentId of enrolledStudentIds) {
          if (compulsorySubjects.includes(subjectId) || faker.datatype.boolean(0.6)) { // 60% take non-compulsory
            await db.collection('users').doc(studentId).update({
              classIds: FieldValue.arrayUnion(subjectClassRef.id),
              subjects: FieldValue.arrayUnion(subjectId)
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
    const schoolSubjects = allCreatedSubjects.filter(s => s.schoolId === schoolId);

    for (const teacherId of teachers) {
      const teacherProfile = await db.collection('users').doc(teacherId).get().then(d => d.data() as UserProfile);
      const classesTaughtByTeacher = allCreatedClasses.filter(c => c.schoolId === schoolId && c.teacherId === teacherId);

      for (const classData of classesTaughtByTeacher) {
        const subjectsForThisClass = classData.classType === 'main'
          ? faker.helpers.arrayElements(schoolSubjects, Math.min(2, schoolSubjects.length)) // For main class, pick a couple of subjects
          : schoolSubjects.filter(s => s.id === classData.subjectId); // For subject class, use its specific subject

        for (const subject of subjectsForThisClass) {
          for (let i = 0; i < NUM_MATERIALS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT; i++) {
            const materialType = faker.helpers.arrayElement<LearningMaterialType>(['text', 'link', 'pdf_link', 'video_link']);
            const materialRef = db.collection('learningMaterials').doc();
            const material: Omit<LearningMaterial, 'id' | 'originalFileName' | 'attachmentUrl'> = {
              title: `${subject.name} - ${faker.lorem.words(3)}`,
              content: materialType === 'text' ? faker.lorem.paragraphs(2) : faker.internet.url(),
              materialType, schoolId, teacherId, classId: classData.id, subjectId: subject.id,
              createdAt: Timestamp.fromDate(faker.date.recent({ days: 30 })),
              updatedAt: Timestamp.fromDate(faker.date.recent({ days: 10 })),
            };
            await materialRef.set({ ...material, id: materialRef.id });
          }
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
    const schoolSubjects = allCreatedSubjects.filter(s => s.schoolId === schoolId);

    for (const teacherId of teachers) {
      const classesTaughtByTeacher = allCreatedClasses.filter(c => c.schoolId === schoolId && c.teacherId === teacherId);

      for (const classData of classesTaughtByTeacher) {
        const studentsInClass = classData.studentIds || [];
        if (studentsInClass.length === 0) continue;

        const subjectsForThisClass = classData.classType === 'main'
          ? faker.helpers.arrayElements(schoolSubjects, Math.min(2, schoolSubjects.length))
          : schoolSubjects.filter(s => s.id === classData.subjectId);

        for (const subject of subjectsForThisClass) {
          for (let i = 0; i < NUM_ASSIGNMENTS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT; i++) {
            const assignmentRef = db.collection('assignments').doc();
            const deadline = Timestamp.fromDate(faker.date.soon({ days: 14 }));
            const assignment: Omit<Assignment, 'id' | 'totalSubmissions'> = {
              classId: classData.id, teacherId, schoolId, subjectId: subject.id,
              title: `Assignment: ${subject.name} - ${faker.lorem.words(2)}`,
              description: faker.lorem.paragraph(), deadline,
              allowedSubmissionFormats: faker.helpers.arrayElements<SubmissionFormat>(['text_entry', 'file_link', 'file_upload'], faker.number.int({min: 1, max: 2})),
              createdAt: Timestamp.fromDate(faker.date.recent({ days: 7, refDate: deadline.toDate() })),
              updatedAt: Timestamp.fromDate(faker.date.recent({ days: 3, refDate: deadline.toDate() })),
            };
            await assignmentRef.set({ ...assignment, id: assignmentRef.id, totalSubmissions: 0 });
            // console.log(`    Created assignment: "${assignment.title}" for class ${classData.name}`);

            let submissionsCount = 0;
            for (const studentId of studentsInClass) {
              if (Math.random() < SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE) {
                const submissionRef = db.collection('submissions').doc();
                const submittedAt = Timestamp.fromDate(faker.date.between({ from: assignment.createdAt.toDate(), to: deadline.toDate() }));
                const submissionType = faker.helpers.arrayElement(assignment.allowedSubmissionFormats);
                const status = faker.datatype.boolean(0.6) ? 'graded' : (submittedAt > deadline ? 'late' : 'submitted');
                
                const submission: Omit<Submission, 'id'> = {
                  assignmentId: assignmentRef.id, classId: classData.id, studentId, submittedAt, submissionType,
                  content: submissionType === 'text_entry' ? faker.lorem.paragraph() : (submissionType === 'file_link' ? faker.internet.url() : `https://placehold.co/300x200.png?text=${faker.system.fileName()}`),
                  originalFileName: submissionType === 'file_upload' ? faker.system.commonFileName('pdf') : undefined,
                  grade: status === 'graded' ? faker.number.int({ min: 60, max: 100 }).toString() + '%' : undefined,
                  feedback: status === 'graded' ? faker.lorem.sentence() : undefined,
                  status, updatedAt: Timestamp.now(),
                };
                await submissionRef.set({ ...submission, id: submissionRef.id });
                submissionsCount++;
              }
            }
            await assignmentRef.update({ totalSubmissions: submissionsCount });
          }
        }
      }
    }
    console.log(`  Seeded assignments & submissions for school ${schoolId}`);
  }
}

async function seedExamPeriods() {
    console.log('Seeding exam periods...');
    for (const schoolId of seededSchoolIds) {
        seededExamPeriodIds[schoolId] = [];
        const classesInSchool = allCreatedClasses.filter(c => c.schoolId === schoolId && c.classType === 'main'); // Typically exams are for main classes
        if (classesInSchool.length === 0) continue;

        for (let i = 0; i < NUM_EXAM_PERIODS_PER_SCHOOL; i++) {
            const examPeriodRef = db.collection('examPeriods').doc();
            const startDate = faker.date.soon({ days: 10 });
            const endDate = faker.date.soon({ days: 5, refDate: startDate });
            const statusOptions: ExamPeriodStatus[] = ['upcoming', 'active', 'grading'];
            const examPeriod: Omit<ExamPeriod, 'id'> = {
                name: `${faker.helpers.arrayElement(['Mid-Term', 'End-Term', 'Final'])} Exams ${startDate.getFullYear()} Term ${i+1}`,
                schoolId, startDate: Timestamp.fromDate(startDate), endDate: Timestamp.fromDate(endDate),
                assignedClassIds: faker.helpers.arrayElements(classesInSchool.map(c => c.id), faker.number.int({ min: 1, max: Math.min(classesInSchool.length, 3) })),
                status: faker.helpers.arrayElement(statusOptions),
                createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
            };
            await examPeriodRef.set({ ...examPeriod, id: examPeriodRef.id });
            seededExamPeriodIds[schoolId].push(examPeriodRef.id);
        }
        console.log(`  Seeded exam periods for school ${schoolId}`);
    }
}

async function seedExamResults() {
  console.log('Seeding exam results...');
  for (const schoolId of seededSchoolIds) {
    const periods = seededExamPeriodIds[schoolId] || [];
    const schoolSubjects = allCreatedSubjects.filter(s => s.schoolId === schoolId);
    if (periods.length === 0 || schoolSubjects.length === 0) continue;

    for (const periodId of periods) {
      const periodDoc = await db.collection('examPeriods').doc(periodId).get();
      const examPeriod = periodDoc.data() as ExamPeriod | undefined;
      if (!examPeriod || examPeriod.status === 'upcoming' || examPeriod.status === 'completed') continue; // Only enter for active/grading

      for (const classId of examPeriod.assignedClassIds) {
        const classDoc = allCreatedClasses.find(c => c.id === classId);
        if (!classDoc || !classDoc.studentIds || classDoc.studentIds.length === 0) continue;
        
        const classSubjects = classDoc.classType === 'main' 
            ? (classDoc.compulsorySubjectIds || []).map(csId => schoolSubjects.find(s => s.id === csId)).filter(Boolean) as Subject[]
            : schoolSubjects.filter(s => s.id === classDoc.subjectId);
        
        const teacherId = classDoc.teacherId || (seededTeacherIds[schoolId]?.[0]);
        if (!teacherId) continue;

        for (const studentId of classDoc.studentIds) {
          for (const subject of classSubjects) {
            if (faker.datatype.boolean(0.8)) { // 80% chance a result is entered
              const resultRef = db.collection('examResults').doc();
              const result: Omit<ExamResult, 'id'> = {
                studentId, examPeriodId: periodId, classId, schoolId, subjectId: subject.id,
                marks: faker.number.int({ min: 40, max: 100 }).toString() + '%',
                remarks: faker.lorem.sentence(), teacherId,
                createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
              };
              await resultRef.set({ ...result, id: resultRef.id });
            }
          }
        }
      }
    }
    console.log(`  Seeded exam results for school ${schoolId}`);
  }
}

async function seedAttendanceRecords() {
  console.log('Seeding attendance records...');
  for (const schoolId of seededSchoolIds) {
    const mainClassesInSchool = allCreatedClasses.filter(c => c.schoolId === schoolId && c.classType === 'main');
    if (mainClassesInSchool.length === 0) continue;

    for (let dayOffset = 0; dayOffset < NUM_ATTENDANCE_DAYS_TO_SEED; dayOffset++) {
      const attendanceDate = faker.date.recent({ days: dayOffset + 1 }); // Go back up to 10 days
      const attendanceDateTimestamp = Timestamp.fromDate(startOfDay(attendanceDate));

      for (const classData of mainClassesInSchool) {
        if (!classData.studentIds || classData.studentIds.length === 0 || !classData.teacherId) continue;
        const teacherProfile = await db.collection('users').doc(classData.teacherId).get().then(d => d.data() as UserProfile);

        for (const studentId of classData.studentIds) {
          const studentProfile = await db.collection('users').doc(studentId).get().then(d => d.data() as UserProfile);
          if (!studentProfile) continue;

          const status = faker.helpers.arrayElement<AttendanceStatus>(['present', 'present', 'present', 'absent', 'late']); // Skew towards present
          const recordRef = db.collection('attendanceRecords').doc();
          const record: Omit<AttendanceRecord, 'id'> = {
            studentId, studentName: studentProfile.displayName, classId: classData.id, className: classData.name, schoolId,
            date: attendanceDateTimestamp, status, markedBy: classData.teacherId, markedByName: teacherProfile?.displayName,
            createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
          };
          await recordRef.set({ ...record, id: recordRef.id });
        }
      }
    }
    console.log(`  Seeded attendance for school ${schoolId} for ${NUM_ATTENDANCE_DAYS_TO_SEED} days.`);
  }
}

async function seedTestimonials() {
    console.log('Seeding testimonials...');
    const userPool = [
        ...(seededAdminIds[seededSchoolIds[0]] || []),
        ...(seededTeacherIds[seededSchoolIds[0]] || []),
        ...(seededStudentIds[seededSchoolIds[0]] || []),
        ...(seededParentIds[seededSchoolIds[0]] || [])
    ].filter(Boolean);

    if (userPool.length === 0) {
        console.log("  No users available to create testimonials.");
        return;
    }

    for (let i = 0; i < NUM_TESTIMONIALS_TO_SEED; i++) {
        const randomUserId = faker.helpers.arrayElement(userPool);
        const userDoc = await db.collection('users').doc(randomUserId).get();
        if (!userDoc.exists()) continue;
        const userData = userDoc.data() as UserProfile;

        const testimonialRef = db.collection('testimonials').doc();
        const testimonial: Omit<Testimonial, 'id'> = {
            userId: userData.uid,
            userName: userData.displayName || 'Anonymous User',
            userRole: userData.role,
            schoolId: userData.schoolId,
            schoolName: userData.schoolName,
            rating: faker.number.int({ min: 4, max: 5 }),
            feedbackText: faker.lorem.paragraph(faker.number.int({ min: 2, max: 4 })),
            isApprovedForDisplay: faker.datatype.boolean(0.7), // 70% chance of being pre-approved for display
            submittedAt: Timestamp.fromDate(faker.date.recent({ days: 60 })),
        };
        await testimonialRef.set({ ...testimonial, id: testimonialRef.id });
    }
    console.log(`  Seeded ${NUM_TESTIMONIALS_TO_SEED} testimonials.`);
}


async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    await seedSchools();
    await seedUsers(); // Depends on schools
    await seedSubjects(); // Depends on schools
    await seedClasses(); // Depends on schools, users (teachers, students), subjects
    await seedLearningMaterials(); // Depends on classes, teachers, subjects
    await seedAssignmentsAndSubmissions(); // Depends on classes, teachers, students, subjects
    await seedExamPeriods(); // Depends on schools, classes
    await seedExamResults(); // Depends on exam periods, classes, students, subjects, teachers
    await seedAttendanceRecords(); // Depends on classes, students, teachers
    await seedTestimonials(); // Depends on users

    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

// Temporary storage for admin IDs for testimonial seeding, as school adminId is set after user creation
const seededAdminIds: Record<string, string[]> = {};
async function prepareAdminIdsForTestimonials() {
    for (const schoolId of seededSchoolIds) {
        const schoolDoc = await db.collection('schools').doc(schoolId).get();
        const adminId = schoolDoc.data()?.adminId;
        if (adminId) {
            seededAdminIds[schoolId] = [adminId];
        }
    }
}

async function runAllSeeders() {
    await seedDatabase();
    // This is a bit of a hack; ideally, the user creation logic would directly populate this.
    // Call this after seedUsers if adminId is needed from the school document for testimonials.
    await prepareAdminIdsForTestimonials();
    // If seedTestimonials relied on seededAdminIds, it would be called after prepareAdminIdsForTestimonials.
    // However, the current seedTestimonials directly fetches user details.
}

runAllSeeders();

