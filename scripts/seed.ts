
import "dotenv/config"; // Must be at the very top
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue, doc, setDoc, updateDoc, collection, writeBatch, getDoc } from "firebase-admin/firestore"; // Added getDoc, writeBatch, doc, setDoc, updateDoc, collection
import { getAuth } from "firebase-admin/auth";
import { faker } from "@faker-js/faker";
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
  UserProfileWithId,
  ClassWithTeacherInfo,
  Submission // Added Submission
} from "../src/types"; // Adjusted import path
import { v4 as uuidv4 } from "uuid";

// --- Configuration ---
const NUM_SCHOOLS = 1;
const NUM_ADMINS_PER_SCHOOL = 1;
const NUM_TEACHERS_PER_SCHOOL = 5; // Reduced for faster seeding in dev
const NUM_STUDENTS_PER_SCHOOL = 20; // Reduced
const NUM_PARENTS_PER_SCHOOL = 10; 
const NUM_SUBJECTS_PER_SCHOOL = 6;
const NUM_MAIN_CLASSES_PER_SCHOOL = 2; // e.g., Form 1, Form 2
const NUM_MATERIALS_PER_ASSIGNED_CLASS_SUBJECT = 1; // Reduced
const NUM_ASSIGNMENTS_PER_ASSIGNED_CLASS_SUBJECT = 1; // Reduced
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.6; // Reduced
const NUM_EXAM_PERIODS_PER_SCHOOL = 2;
const NUM_ATTENDANCE_DAYS_TO_SEED = 5; // Reduced
const NUM_TESTIMONIALS_TO_SEED = 3;


// --- Firebase Admin Setup ---
const LEARNIFY_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "learnify-project-e7f59";
let serviceAccountJson: ServiceAccount | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    console.log("Attempting to use FIREBASE_SERVICE_ACCOUNT_JSON_STRING...");
    serviceAccountJson = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING
    );
    if (typeof serviceAccountJson.private_key === "string") {
      serviceAccountJson.private_key = serviceAccountJson.private_key.replace(
        /\\n/g,
        "\n"
      );
    }
    initializeApp({
      credential: cert(serviceAccountJson),
      projectId: LEARNIFY_PROJECT_ID,
    });
    console.log("Successfully initialized Firebase Admin SDK with provided service account JSON.");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("Attempting to use GOOGLE_APPLICATION_CREDENTIALS...");
    initializeApp({
        projectId: LEARNIFY_PROJECT_ID,
    }); 
    console.log("Successfully initialized Firebase Admin SDK with GOOGLE_APPLICATION_CREDENTIALS.");
  } else {
    console.warn(
      "Neither FIREBASE_SERVICE_ACCOUNT_JSON_STRING nor GOOGLE_APPLICATION_CREDENTIALS found. " +
      "Attempting to initialize with project ID only (may work in some GCP environments)."
    );
    initializeApp({ projectId: LEARNIFY_PROJECT_ID });
  }
} catch (e) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", e);
  process.exit(1); 
}


const db = getFirestore();
const adminAuth = getAuth();


const createFirebaseUser = async (
  email: string,
  pass: string,
  displayName: string
): Promise<string | null> => {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password: pass,
      displayName,
      emailVerified: true, 
    });
    return userRecord.uid;
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      console.warn(
        `User with email ${email} already exists in Firebase Auth. Fetching existing UID.`
      );
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

// Global arrays for seeded data
const seededSchools: School[] = [];
const seededUsers: UserProfileWithId[] = [];
const seededSubjects: Subject[] = [];
const seededClasses: ClassWithTeacherInfo[] = [];
const seededExamPeriods: ExamPeriod[] = [];


async function seedSchools() {
  console.log("🏫 Seeding schools...");
  for (let i = 0; i < NUM_SCHOOLS; i++) {
    const schoolName = faker.company.name() + " Academy";
    const schoolRef = doc(db, "schools", uuidv4());
    const schoolInviteCode = `SCH-${faker.string
      .alphanumeric(6)
      .toUpperCase()}`;
    
    const school: School = {
      id: schoolRef.id,
      name: schoolName,
      adminId: '', 
      inviteCode: schoolInviteCode,
      schoolType: faker.helpers.arrayElement(["Primary", "Secondary", "K-12"]),
      country: faker.location.country(),
      phoneNumber: faker.phone.number(),
      setupComplete: true,
      isExamModeActive: faker.datatype.boolean(0.3),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(schoolRef, school);
    seededSchools.push(school);
    console.log(`  Created school: ${school.name} (ID: ${school.id})`);
  }
}

async function seedUsers() {
  console.log("👤 Seeding users (admins, teachers, students, parents)...");
  for (const school of seededSchools) {
    const usersForThisSchool: UserProfileWithId[] = [];

    // Admins
    for (let i = 0; i < NUM_ADMINS_PER_SCHOOL; i++) {
      const email = faker.internet.email({
        firstName: `admin${i}`,
        lastName: school.id.substring(0, 4),
        provider: "learnify.dev",
      });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUser(email, "password123", displayName);
      if (uid) {
        const userProfile: UserProfileWithId = {
          id: uid,
          uid,
          email,
          displayName,
          role: "admin",
          schoolId: school.id,
          schoolName: school.name,
          status: "active",
          onboardingStep: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          lastTestimonialSurveyAt: faker.datatype.boolean(0.1) ? Timestamp.fromDate(faker.date.recent({ days: 30 })) : null,
        };
        await setDoc(doc(db, "users", uid), userProfile);
        usersForThisSchool.push(userProfile);
        if (i === 0) { 
          await updateDoc(doc(db, "schools", school.id), { adminId: uid });
          const schoolIndex = seededSchools.findIndex(s => s.id === school.id);
          if (schoolIndex !== -1) seededSchools[schoolIndex].adminId = uid;
        }
        console.log(`  Admin for ${school.name}: ${displayName} (${email})`);
      }
    }

    // Teachers
    for (let i = 0; i < NUM_TEACHERS_PER_SCHOOL; i++) {
      const email = faker.internet.email({
        firstName: `teacher${i}`,
        lastName: school.id.substring(0, 4),
        provider: "learnify.dev",
      });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUser(email, "password123", displayName);
      if (uid) {
        const userProfile: UserProfileWithId = {
          id: uid,
          uid,
          email,
          displayName,
          role: "teacher",
          schoolId: school.id,
          schoolName: school.name,
          status: "active",
          onboardingStep: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2) ? Timestamp.fromDate(faker.date.recent({ days: 30 })) : null,
        };
        await setDoc(doc(db, "users", uid), userProfile);
        usersForThisSchool.push(userProfile);
        console.log(`    Teacher for ${school.name}: ${displayName} (${email})`);
      }
    }

    // Students
    const studentsCreatedInThisSchool: UserProfileWithId[] = [];
    for (let i = 0; i < NUM_STUDENTS_PER_SCHOOL; i++) {
      const studentFirstName = faker.person.firstName();
      const studentLastName = faker.person.lastName();
      const studentDisplayName = `${studentFirstName} ${studentLastName}`;
      const studentEmail = faker.internet.email({
        firstName: studentFirstName.toLowerCase(),
        lastName: studentLastName.toLowerCase(),
        provider: "learnify.student.dev",
      });
      const studentUid = await createFirebaseUser(studentEmail, "password123", studentDisplayName);
      if (studentUid) {
        const userProfile: UserProfileWithId = {
          id: studentUid,
          uid: studentUid,
          email: studentEmail,
          displayName: studentDisplayName,
          role: "student",
          schoolId: school.id,
          schoolName: school.name,
          status: "active",
          onboardingStep: null, 
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2) ? Timestamp.fromDate(faker.date.recent({ days: 20 })) : null,
        };
        await setDoc(doc(db, "users", studentUid), userProfile);
        usersForThisSchool.push(userProfile);
        studentsCreatedInThisSchool.push(userProfile);
        console.log(`    Student for ${school.name}: ${studentDisplayName} (${studentEmail})`);
      }
    }

    // Parents (link to some of the students created above)
    for (let i = 0; i < Math.min(NUM_PARENTS_PER_SCHOOL, studentsCreatedInThisSchool.length); i++) {
      const childToLink = studentsCreatedInThisSchool[i];
      const parentFirstName = faker.person.firstName();
      const parentLastName = childToLink.displayName!.split(' ').pop() || faker.person.lastName();
      const parentDisplayName = `${parentFirstName} ${parentLastName}`;
      const parentEmail = faker.internet.email({
        firstName: parentFirstName.toLowerCase(),
        lastName: parentLastName.toLowerCase(),
        provider: "learnify.parent.dev",
      });
      const parentUid = await createFirebaseUser(parentEmail, "password123", parentDisplayName);
      if (parentUid) {
        const parentProfile: UserProfileWithId = {
          id: parentUid,
          uid: parentUid,
          email: parentEmail,
          displayName: parentDisplayName,
          role: "parent",
          schoolId: school.id,
          schoolName: school.name,
          childStudentId: childToLink.id,
          status: "active",
          onboardingStep: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2) ? Timestamp.fromDate(faker.date.recent({ days: 20 })) : null,
        };
        await setDoc(doc(db, "users", parentUid), parentProfile);
        usersForThisSchool.push(parentProfile);
        console.log(`      Parent for ${childToLink.displayName}: ${parentDisplayName} (${parentEmail})`);
      }
    }
    seededUsers.push(...usersForThisSchool);
    console.log(`Completed seeding users for school: ${school.name}`);
  }
  console.log("Finished seeding all users.");
}

async function seedSubjects() {
  console.log("📚 Seeding subjects...");
  const commonSubjects = [
    "Mathematics", "English Language", "Integrated Science", "Social Studies",
    "Creative Arts", "Physical Education", "Computing", "Religious & Moral Education",
    "French", "Career Technology", "History", "Geography", "Biology", "Chemistry", "Physics"
  ];
  for (const school of seededSchools) {
    const subjectsToSeedNames = faker.helpers.arrayElements(commonSubjects, NUM_SUBJECTS_PER_SCHOOL);
    for (const subjectName of subjectsToSeedNames) {
      const subjectRef = doc(db, "subjects", uuidv4());
      const subject: Subject = {
        id: subjectRef.id,
        name: subjectName,
        schoolId: school.id,
        isCompulsory: faker.datatype.boolean(0.3),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(subjectRef, subject);
      seededSubjects.push(subject);
    }
    console.log(`  Seeded ${subjectsToSeedNames.length} subjects for school ${school.name}`);
  }
}

async function seedClasses() {
  console.log("🏛️ Seeding classes and enrollments...");
  const batch = writeBatch(db);

  for (const school of seededSchools) {
    const schoolTeachers = seededUsers.filter(u => u.schoolId === school.id && u.role === 'teacher');
    const schoolStudents = seededUsers.filter(u => u.schoolId === school.id && u.role === 'student');
    const schoolSpecificSubjects = seededSubjects.filter(s => s.schoolId === school.id);

    if (schoolTeachers.length === 0 || schoolStudents.length === 0 || schoolSpecificSubjects.length === 0) {
      console.warn(`  Skipping class creation for ${school.name}: Insufficient teachers, students, or subjects.`);
      continue;
    }

    const studentsPerMainClass = Math.max(1, Math.floor(schoolStudents.length / NUM_MAIN_CLASSES_PER_SCHOOL));

    for (let i = 0; i < NUM_MAIN_CLASSES_PER_SCHOOL; i++) {
      const classRef = doc(db, "classes", uuidv4());
      const mainClassName = `Form ${i + 1}${faker.helpers.arrayElement(["A", "B", "C", "D"])}`;
      const assignedTeacher = schoolTeachers[i % schoolTeachers.length];
      
      const compulsorySubjectsForThisClass = faker.helpers.arrayElements(
        schoolSpecificSubjects.filter(s => s.isCompulsory), // Prioritize subjects marked as compulsory
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
      const classWithInfo: ClassWithTeacherInfo = { ...classData, teacherDisplayName: assignedTeacher.displayName, compulsorySubjectNames };
      seededClasses.push(classWithInfo);
      console.log(`    Created main class: ${mainClassName} for ${school.name} with ${enrolledStudentIds.length} students. Teacher: ${assignedTeacher.displayName}`);

      for (const student of enrolledStudentBatch) {
        const studentRef = doc(db, "users", student.id);
        batch.update(studentRef, {
          classIds: FieldValue.arrayUnion(classRef.id),
          subjects: FieldValue.arrayUnion(...compulsorySubjectIds),
          onboardingStep: null,
          updatedAt: Timestamp.now(),
        });
      }

      // Create subject-based classes for this main class level
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
        seededClasses.push({ ...subjectClassData, teacherDisplayName: subjectTeacher.displayName, subjectName: subject.name });
        console.log(`      Created subject class: ${subjectClassName} for ${school.name}. Teacher: ${subjectTeacher.displayName}`);

        let enrolledInSubjectClassCount = 0;
        for (const student of enrolledStudentBatch) {
          const isCompulsoryForMain = compulsorySubjectIds.includes(subject.id);
          if (isCompulsoryForMain || faker.datatype.boolean(0.6)) { // All students take compulsory, 60% chance for others in this subject class
            const studentRef = doc(db, "users", student.id);
            batch.update(studentRef, {
              classIds: FieldValue.arrayUnion(subjectClassRef.id),
              subjects: FieldValue.arrayUnion(subject.id), // Add subject to student's list
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
}


async function seedLearningMaterials() {
  console.log("📄 Seeding learning materials...");
  const batch = writeBatch(db);
  for (const classData of seededClasses) {
    const school = seededSchools.find(s => s.id === classData.schoolId);
    if (!school) continue;

    const teacher = seededUsers.find(u => u.id === classData.teacherId);
    if (!teacher) continue;

    let relevantSubjects: Subject[] = [];
    if (classData.classType === 'main' && classData.compulsorySubjectIds) {
      relevantSubjects = seededSubjects.filter(s => classData.compulsorySubjectIds!.includes(s.id));
    } else if (classData.classType === 'subject_based' && classData.subjectId) {
      const sub = seededSubjects.find(s => s.id === classData.subjectId);
      if (sub) relevantSubjects.push(sub);
    }
    relevantSubjects = relevantSubjects.length > 0 ? relevantSubjects : faker.helpers.arrayElements(seededSubjects.filter(s => s.schoolId === school.id), 1);


    for (const subject of relevantSubjects) {
      for (let i = 0; i < NUM_MATERIALS_PER_ASSIGNED_CLASS_SUBJECT; i++) {
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

async function seedAssignmentsAndSubmissions() {
  console.log("📝 Seeding assignments and submissions...");
  const batch = writeBatch(db);

  for (const classData of seededClasses) {
    const school = seededSchools.find(s => s.id === classData.schoolId);
    if (!school) continue;
    const teacher = seededUsers.find(u => u.id === classData.teacherId);
    if (!teacher) continue;

    const studentsInClass = seededUsers.filter(u => u.schoolId === school.id && u.role === 'student' && classData.studentIds?.includes(u.id));
    if (studentsInClass.length === 0) continue;

    let relevantSubjects: Subject[] = [];
    if (classData.classType === 'main' && classData.compulsorySubjectIds) {
      relevantSubjects = seededSubjects.filter(s => classData.compulsorySubjectIds!.includes(s.id) && s.schoolId === school.id);
    } else if (classData.classType === 'subject_based' && classData.subjectId) {
      const sub = seededSubjects.find(s => s.id === classData.subjectId && s.schoolId === school.id);
      if (sub) relevantSubjects.push(sub);
    }
    relevantSubjects = relevantSubjects.length > 0 ? relevantSubjects : faker.helpers.arrayElements(seededSubjects.filter(s => s.schoolId === school.id), 1);


    for (const subject of relevantSubjects) {
      for (let i = 0; i < NUM_ASSIGNMENTS_PER_ASSIGNED_CLASS_SUBJECT; i++) {
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
          totalSubmissions: 0,
        };
        batch.set(assignmentRef, assignment);

        let submissionsCount = 0;
        for (const student of studentsInClass) {
          if (Math.random() < SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE) {
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
        batch.update(assignmentRef, { totalSubmissions: submissionsCount });
      }
    }
  }
  await batch.commit();
  console.log("Finished seeding assignments & submissions.");
}

async function seedExamPeriods() {
  console.log("📅 Seeding exam periods...");
  const batch = writeBatch(db);
  for (const school of seededSchools) {
    const mainClassesInSchool = seededClasses.filter(c => c.schoolId === school.id && c.classType === "main");
    if (mainClassesInSchool.length === 0) continue;

    for (let i = 0; i < NUM_EXAM_PERIODS_PER_SCHOOL; i++) {
      const examPeriodRef = doc(db, "examPeriods", uuidv4());
      const startDate = faker.date.soon({ days: (i * 30) + 10 }); // Stagger start dates
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
      seededExamPeriods.push(examPeriod);
    }
  }
  await batch.commit();
  console.log("Finished seeding exam periods.");
}

async function seedExamResults() {
  console.log("📊 Seeding exam results...");
  const batch = writeBatch(db);

  for (const examPeriod of seededExamPeriods) {
    if (examPeriod.status === "upcoming") continue;

    for (const classId of examPeriod.assignedClassIds) {
      const classInfo = seededClasses.find(c => c.id === classId);
      if (!classInfo || !classInfo.studentIds || classInfo.studentIds.length === 0) continue;

      const school = seededSchools.find(s => s.id === classInfo.schoolId);
      if (!school) continue;

      const teacherForClass = seededUsers.find(u => u.id === classInfo.teacherId);
      if (!teacherForClass) continue; // Need a teacher to assign as marker

      // Determine relevant subjects for this class
      let relevantSubjectIds: string[] = [];
      if (classInfo.classType === 'main' && classInfo.compulsorySubjectIds) {
        relevantSubjectIds.push(...classInfo.compulsorySubjectIds);
      }
      
      // Add some electives the students in this main class might be taking
      const schoolSpecificSubjects = seededSubjects.filter(s => s.schoolId === school.id);
      const electiveSubjects = schoolSpecificSubjects.filter(s => !relevantSubjectIds.includes(s.id));
      relevantSubjectIds.push(...faker.helpers.arrayElements(electiveSubjects.map(s=>s.id), Math.min(2, electiveSubjects.length)));
      relevantSubjectIds = Array.from(new Set(relevantSubjectIds)); // Ensure unique subjects


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

const startOfDayTimestamp = (date: Date): Timestamp => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
};

async function seedAttendanceRecords() {
  console.log("🗓️ Seeding attendance records...");
  const batch = writeBatch(db);
  for (const school of seededSchools) {
    const mainClassesInSchool = seededClasses.filter(c => c.schoolId === school.id && c.classType === "main");
    if (mainClassesInSchool.length === 0) continue;

    for (let dayOffset = 0; dayOffset < NUM_ATTENDANCE_DAYS_TO_SEED; dayOffset++) {
      const attendanceDateRaw = faker.date.recent({ days: dayOffset + 1 });
      const attendanceDate = startOfDayTimestamp(attendanceDateRaw);

      for (const classData of mainClassesInSchool) {
        if (!classData.studentIds || classData.studentIds.length === 0 || !classData.teacherId) continue;
        
        const teacherProfile = seededUsers.find(u => u.id === classData.teacherId);
        if (!teacherProfile) continue;

        for (const studentId of classData.studentIds) {
          const studentProfile = seededUsers.find(u => u.id === studentId);
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
  console.log(`Finished seeding attendance for ${NUM_ATTENDANCE_DAYS_TO_SEED} days.`);
}

async function seedTestimonials() {
  console.log("🌟 Seeding testimonials...");
  const batch = writeBatch(db);
  for (const school of seededSchools) {
    const userPoolForSchool = seededUsers.filter(u => u.schoolId === school.id && (u.role === 'teacher' || u.role === 'student' || u.role === 'parent'));
    if (userPoolForSchool.length === 0) continue;

    for (let i = 0; i < Math.min(NUM_TESTIMONIALS_TO_SEED, userPoolForSchool.length); i++) {
      const randomUser = faker.helpers.arrayElement(userPoolForSchool);
      const testimonialRef = doc(db, "testimonials", uuidv4());
      const testimonial: Testimonial = {
        id: testimonialRef.id,
        userId: randomUser.id,
        userName: randomUser.displayName || "Anonymous User",
        userRole: randomUser.role,
        schoolId: randomUser.schoolId,
        schoolName: randomUser.schoolName,
        rating: faker.number.int({ min: 4, max: 5 }),
        feedbackText: faker.lorem.paragraph(faker.number.int({ min: 2, max: 4 })),
        isApprovedForDisplay: faker.datatype.boolean(0.7),
        submittedAt: Timestamp.fromDate(faker.date.recent({ days: 60 })),
      };
      batch.set(testimonialRef, testimonial);
    }
  }
  await batch.commit();
  console.log("Finished seeding testimonials.");
}

async function seedDatabase() {
  try {
    console.log("🚀 Starting database seed...");

    await seedSchools();
    await seedUsers(); 
    await seedSubjects();
    await seedClasses(); 
    await seedExamPeriods(); // Before results
    await seedLearningMaterials();
    await seedAssignmentsAndSubmissions(); // Needs classes and students
    await seedExamResults(); // After exam periods, classes, students, subjects
    await seedAttendanceRecords();
    await seedTestimonials();

    console.log("✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
  }
}

seedDatabase();


