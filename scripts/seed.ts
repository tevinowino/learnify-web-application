import "dotenv/config"; // Must be at the very top
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
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
} from "../src/types";
import { v4 as uuidv4 } from "uuid";

// --- Configuration ---
const NUM_SCHOOLS = 1;
const NUM_ADMINS_PER_SCHOOL = 1;
const NUM_TEACHERS_PER_SCHOOL = 10;
const NUM_STUDENTS_PER_SCHOOL = 50;
const NUM_PARENTS_PER_SCHOOL = 30;
const NUM_SUBJECTS_PER_SCHOOL = 8;
const NUM_MAIN_CLASSES_PER_SCHOOL = 4;
const NUM_MATERIALS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT = 2;
const NUM_ASSIGNMENTS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT = 2;
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.75;
const NUM_EXAM_PERIODS_PER_SCHOOL = 2;
const NUM_ATTENDANCE_DAYS_TO_SEED = 10;
const NUM_TESTIMONIALS_TO_SEED = 5;

// --- Firebase Admin Setup ---
const LEARNIFY_PROJECT_ID = "learnify-project-e7f59";
let serviceAccountJson: ServiceAccount | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    serviceAccountJson = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING
    );

    if (typeof serviceAccountJson.private_key === "string") {
      serviceAccountJson.private_key = serviceAccountJson.private_key.replace(
        /\\n/g,
        "\n"
      );
    }

    console.log(
      "Successfully parsed and prepared Firebase service account JSON."
    );
  }
} catch (e) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON_STRING:", e);
}

if (serviceAccountJson) {
  console.log(
    "Initializing Firebase Admin SDK with provided service account JSON."
  );
  initializeApp({
    credential: cert(serviceAccountJson),
    projectId: LEARNIFY_PROJECT_ID,
  });
} else {
  console.error(
    "❌ Failed to initialize Firebase Admin SDK. Service account JSON is missing."
  );
  process.exit(1); // Stop execution if Firebase is not initialized
}

const db = getFirestore();
const adminAuth = getAuth();

// Continue with your seeding logic here...

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
      emailVerified: true, // Assume verified for seeder
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

const seededSchoolIds: string[] = [];
const seededTeacherIds: Record<string, string[]> = {}; // schoolId: [teacherId]
const seededStudentIds: Record<string, string[]> = {}; // schoolId: [studentId]
const seededParentIds: Record<string, string[]> = {}; // schoolId: [parentId]
const seededSubjectIds: Record<string, string[]> = {}; // schoolId: [subjectId]
const seededMainClassIds: Record<string, string[]> = {}; // schoolId: [classId]
const seededSubjectClassIds: Record<string, string[]> = {}; // schoolId: [classId]
const seededExamPeriodIds: Record<string, string[]> = {}; // schoolId: [examPeriodId]

// Store all created class details for later reference (e.g., assigning teachers, subjects)
let allCreatedClasses: (Class & {
  teacherDisplayName?: string;
  subjectName?: string;
})[] = [];
let allCreatedSubjects: Subject[] = [];

async function seedSchools() {
  console.log("Seeding schools...");
  for (let i = 0; i < NUM_SCHOOLS; i++) {
    const schoolName = faker.company.name() + " Academy";
    const schoolRef = db.collection("schools").doc();
    const schoolInviteCode = `SCH-${faker.string
      .alphanumeric(6)
      .toUpperCase()}`;
    const school: Omit<School, "adminId" | "createdAt" | "updatedAt"> & {
      adminId?: string;
      createdAt?: Timestamp;
      updatedAt?: Timestamp;
    } = {
      // Allow adminId to be optional initially
      id: schoolRef.id,
      name: schoolName,
      inviteCode: schoolInviteCode,
      schoolType: faker.helpers.arrayElement(["Primary", "Secondary", "K-12"]),
      country: faker.location.country(),
      phoneNumber: faker.phone.number(),
      setupComplete: true,
      isExamModeActive: faker.datatype.boolean(0.3),
    };
    await schoolRef.set({
      ...school,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }); // Set with timestamps
    seededSchoolIds.push(school.id);
    console.log(`  Created school: ${school.name} (ID: ${school.id})`);
  }
}

async function seedUsers() {
  console.log("Seeding users (admins, teachers, students, parents)...");
  for (const schoolId of seededSchoolIds) {
    console.log(`Processing school with ID: ${schoolId}`);
    const schoolDoc = await db.collection("schools").doc(schoolId).get();
    const schoolName = schoolDoc.data()?.name || "School";
    console.log(`Retrieved school name: ${schoolName}`);
    seededTeacherIds[schoolId] = [];
    seededStudentIds[schoolId] = [];
    seededParentIds[schoolId] = [];
    seededAdminIds[schoolId] = []; // Initialize admin IDs for the school

    // Admins
    console.log(
      `Starting to seed ${NUM_ADMINS_PER_SCHOOL} admins for ${schoolName}`
    );
    for (let i = 0; i < NUM_ADMINS_PER_SCHOOL; i++) {
      console.log(`Creating admin ${i + 1}/${NUM_ADMINS_PER_SCHOOL}`);
      const email = faker.internet.email({
        firstName: `admin${i}`,
        lastName: schoolId.substring(0, 4),
        provider: "learnify.dev",
      });
      const displayName = faker.person.fullName();
      console.log(`Attempting to create Firebase user for admin: ${email}`);
      const uid = await createFirebaseUser(email, "password123", displayName);
      if (uid) {
        console.log(`Successfully created Firebase user with UID: ${uid}`);
        const userProfile: UserProfile = {
          uid,
          email,
          displayName,
          role: "admin",
          schoolId,
          onboardingStep: null,
          status: "active",
          createdAt: Timestamp.now(),
        };
        console.log({ userProfile });
        await db.collection("users").doc(uid).set(userProfile);
        if (i === 0) {
          // Assign first admin as the main school admin
          console.log(`Setting main admin for school: ${schoolId}`);
          await db.collection("schools").doc(schoolId).update({ adminId: uid });
        }
        seededAdminIds[schoolId].push(uid);
        console.log(`Admin for ${schoolName}: ${displayName} (${email})`);
      }
    }

    // Teachers
    console.log(
      `Starting to seed ${NUM_TEACHERS_PER_SCHOOL} teachers for ${schoolName}`
    );
    for (let i = 0; i < NUM_TEACHERS_PER_SCHOOL; i++) {
      console.log(`Creating teacher ${i + 1}/${NUM_TEACHERS_PER_SCHOOL}`);
      const email = faker.internet.email({
        firstName: `teacher${i}`,
        lastName: schoolId.substring(0, 4),
        provider: "learnify.dev",
      });
      const displayName = faker.person.fullName();
      console.log(`Attempting to create Firebase user for teacher: ${email}`);
      const uid = await createFirebaseUser(email, "password123", displayName);
      if (uid) {
        console.log(`Successfully created Firebase user with UID: ${uid}`);
        const userProfile: UserProfile = {
          uid,
          email,
          displayName,
          role: "teacher",
          schoolId,
          status: "active",
          createdAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          metadata: {
            creationTime: Timestamp.now().toDate().toISOString(),
            lastSignInTime: Timestamp.now().toDate().toISOString(),
          },
          providerId: "password",
          tenantId: null,
          refreshToken: "",
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2)
            ? Timestamp.fromDate(faker.date.recent({ days: 20 }))
            : null,
        };
        await db.collection("users").doc(uid).set(userProfile);
        seededTeacherIds[schoolId].push(uid);
        console.log(`    Teacher for ${schoolName}: ${displayName} (${email})`);
      }
    }

    // Students
    console.log(
      `Starting to seed ${NUM_STUDENTS_PER_SCHOOL} students for ${schoolName}`
    );
    for (let i = 0; i < NUM_STUDENTS_PER_SCHOOL; i++) {
      console.log(`Creating student ${i + 1}/${NUM_STUDENTS_PER_SCHOOL}`);
      const studentFirstName = faker.person.firstName();
      const studentLastName = faker.person.lastName();
      const studentDisplayName = `${studentFirstName} ${studentLastName}`;
      const studentEmail = faker.internet.email({
        firstName: studentFirstName,
        lastName: studentLastName,
        provider: "learnify.student.dev",
      });
      console.log(
        `Attempting to create Firebase user for student: ${studentEmail}`
      );
      const studentUid = await createFirebaseUser(
        studentEmail,
        "password123",
        studentDisplayName
      );
      if (studentUid) {
        console.log(
          `Successfully created Firebase user with UID: ${studentUid}`
        );
        const userProfile: UserProfile = {
          uid: studentUid,
          email: studentEmail,
          displayName: studentDisplayName,
          role: "student",
          schoolId,
          status: "active",
          createdAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          metadata: {
            creationTime: Timestamp.now().toDate().toISOString(),
            lastSignInTime: Timestamp.now().toDate().toISOString(),
          },
          providerId: "password",
          tenantId: null,
          refreshToken: "",
          onboardingStep: null,
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2)
            ? Timestamp.fromDate(faker.date.recent({ days: 20 }))
            : null,
        };
        await db.collection("users").doc(studentUid).set(userProfile);
        seededStudentIds[schoolId].push(studentUid);
        console.log(
          `    Student for ${schoolName}: ${studentDisplayName} (${studentEmail})`
        );

        // Create a parent for some students
        if (i < NUM_PARENTS_PER_SCHOOL) {
          console.log(`Creating parent for student: ${studentDisplayName}`);
          const parentFirstName = faker.person.firstName();
          const parentDisplayName = `${parentFirstName} ${studentLastName}`; // Parent usually shares child's last name
          const parentEmail = faker.internet.email({
            firstName: parentFirstName,
            lastName: studentLastName,
            provider: "learnify.parent.dev",
          });
          console.log(
            `Attempting to create Firebase user for parent: ${parentEmail}`
          );
          const parentUid = await createFirebaseUser(
            parentEmail,
            "password123",
            parentDisplayName
          );
          if (parentUid) {
            console.log(
              `Successfully created Firebase user with UID: ${parentUid}`
            );
            const parentProfile: UserProfile = {
              uid: parentUid,
              email: parentEmail,
              displayName: parentDisplayName,
              role: "parent",
              schoolId,
              childStudentId: studentUid,
              status: "active",
              createdAt: Timestamp.now(),
              classIds: [],
              subjects: [],
              metadata: {
                creationTime: Timestamp.now().toDate().toISOString(),
                lastSignInTime: Timestamp.now().toDate().toISOString(),
              },
              providerData: [],
              providerId: "password",
              tenantId: null,
              refreshToken: "",
              onboardingStep: null,
              lastTestimonialSurveyAt: faker.datatype.boolean(0.2)
                ? Timestamp.fromDate(faker.date.recent({ days: 20 }))
                : null,
            };
            await db.collection("users").doc(parentUid).set(parentProfile);
            seededParentIds[schoolId].push(parentUid);
            console.log(
              `      Parent for ${studentDisplayName}: ${parentDisplayName} (${parentEmail})`
            );
          }
        }
      }
    }
    console.log(`Completed seeding users for school: ${schoolName}`);
  }
  console.log("Finished seeding all users.");
}
async function seedSubjects() {
  console.log("Seeding subjects...");
  const commonSubjects = [
    "Mathematics",
    "English Language",
    "Integrated Science",
    "Social Studies",
    "Creative Arts",
    "Physical Education",
    "Computing",
    "Religious & Moral Education",
    "French",
    "Career Technology",
  ];
  for (const schoolId of seededSchoolIds) {
    seededSubjectIds[schoolId] = [];
    const subjectsToSeed = faker.helpers.arrayElements(
      commonSubjects,
      NUM_SUBJECTS_PER_SCHOOL
    );
    for (const subjectName of subjectsToSeed) {
      const subjectRef = db.collection("subjects").doc();
      const subject: Subject = {
        id: subjectRef.id,
        name: subjectName,
        schoolId,
        isCompulsory: faker.datatype.boolean(0.3), // 30% chance a subject is compulsory
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await subjectRef.set(subject);
      seededSubjectIds[schoolId].push(subject.id);
      allCreatedSubjects.push(subject);
    }
    console.log(
      `  Seeded ${subjectsToSeed.length} subjects for school ${schoolId}`
    );
  }
}

async function seedClasses() {
  console.log("Seeding classes...");
  for (const schoolId of seededSchoolIds) {
    const teachers = seededTeacherIds[schoolId] || [];
    const students = seededStudentIds[schoolId] || [];
    const schoolSpecificSubjects = allCreatedSubjects.filter(
      (s) => s.schoolId === schoolId
    );
    if (
      teachers.length === 0 ||
      students.length === 0 ||
      schoolSpecificSubjects.length === 0
    ) {
      console.warn(
        `  Insufficient teachers, students, or subjects for school ${schoolId}, skipping class creation.`
      );
      continue;
    }
    seededMainClassIds[schoolId] = [];
    seededSubjectClassIds[schoolId] = [];

    const studentsPerMainClass = Math.max(
      1,
      Math.ceil(students.length / NUM_MAIN_CLASSES_PER_SCHOOL)
    );

    for (let i = 0; i < NUM_MAIN_CLASSES_PER_SCHOOL; i++) {
      const classRef = db.collection("classes").doc();
      const mainClassName = `Form ${i + 1} ${faker.helpers.arrayElement([
        "Gold",
        "Blue",
        "Green",
        "Red",
      ])}`;
      const assignedTeacherId = teachers[i % teachers.length];
      const compulsorySubjectsForThisClass = faker.helpers.arrayElements(
        schoolSpecificSubjects.map((s) => s.id),
        faker.number.int({
          min: 1,
          max: Math.min(3, schoolSpecificSubjects.length),
        })
      );

      const enrolledStudentIds = students.slice(
        i * studentsPerMainClass,
        (i + 1) * studentsPerMainClass
      );

      const classData: Class = {
        id: classRef.id,
        name: mainClassName,
        schoolId,
        teacherId: assignedTeacherId,
        classType: "main",
        studentIds: enrolledStudentIds,
        classInviteCode: `MC-${faker.string.alphanumeric(6).toUpperCase()}`,
        compulsorySubjectIds: compulsorySubjectsForThisClass,
        subjectId: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await classRef.set(classData);
      seededMainClassIds[schoolId].push(classRef.id);
      allCreatedClasses.push(classData);
      console.log(
        `    Created main class: ${mainClassName} for school ${schoolId} with ${enrolledStudentIds.length} students. Teacher: ${assignedTeacherId}`
      );

      // Update enrolled students with this main class and its compulsory subjects
      for (const studentId of enrolledStudentIds) {
        await db
          .collection("users")
          .doc(studentId)
          .update({
            classIds: FieldValue.arrayUnion(classRef.id),
            subjects: FieldValue.arrayUnion(...compulsorySubjectsForThisClass), // Students are auto-enrolled in compulsory subjects
            onboardingStep: null, // Mark student onboarding as complete
          });
      }

      // Create subject-based classes for this main class level
      for (const subject of schoolSpecificSubjects) {
        const subjectClassRef = db.collection("classes").doc();
        const subjectClassName = `${subject.name} - ${
          mainClassName.split(" ")[0]
        } ${mainClassName.split(" ")[1]}`;
        const subjectTeacherId =
          teachers[
            (i + schoolSpecificSubjects.indexOf(subject)) % teachers.length
          ];

        const subjectClassData: Class = {
          id: subjectClassRef.id,
          name: subjectClassName,
          schoolId,
          teacherId: subjectTeacherId,
          classType: "subject_based",
          studentIds: [],
          classInviteCode: `SC-${faker.string.alphanumeric(6).toUpperCase()}`,
          compulsorySubjectIds: [],
          subjectId: subject.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await subjectClassRef.set(subjectClassData);
        seededSubjectClassIds[schoolId].push(subjectClassRef.id);
        allCreatedClasses.push(subjectClassData);
        console.log(
          `      Created subject class: ${subjectClassName} for school ${schoolId}. Teacher: ${subjectTeacherId}`
        );

        // Enroll students from the main class into this subject-based class
        // if it's compulsory OR they "elect" it
        let enrolledInSubjectClassCount = 0;
        for (const studentId of enrolledStudentIds) {
          // All students take compulsory subjects. For non-compulsory, 60% chance.
          const isCompulsoryForMainClass =
            compulsorySubjectsForThisClass.includes(subject.id);
          if (isCompulsoryForMainClass || faker.datatype.boolean(0.6)) {
            await db
              .collection("users")
              .doc(studentId)
              .update({
                classIds: FieldValue.arrayUnion(subjectClassRef.id),
                subjects: FieldValue.arrayUnion(subject.id), // Ensure subject is added to student's list
              });
            await subjectClassRef.update({
              studentIds: FieldValue.arrayUnion(studentId),
            });
            enrolledInSubjectClassCount++;
          }
        }
        console.log(
          `        Enrolled ${enrolledInSubjectClassCount} students into ${subjectClassName}.`
        );
      }
    }
  }
}

const startOfDayTimestamp = (date: Date): Timestamp => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
};

async function seedAttendanceRecords() {
  console.log("Seeding attendance records...");
  for (const schoolId of seededSchoolIds) {
    const mainClassesInSchool = allCreatedClasses.filter(
      (c) => c.schoolId === schoolId && c.classType === "main"
    );
    if (mainClassesInSchool.length === 0) continue;

    for (
      let dayOffset = 0;
      dayOffset < NUM_ATTENDANCE_DAYS_TO_SEED;
      dayOffset++
    ) {
      const attendanceDateRaw = faker.date.recent({ days: dayOffset + 1 });
      const attendanceDate = startOfDayTimestamp(attendanceDateRaw);

      for (const classData of mainClassesInSchool) {
        if (
          !classData.studentIds ||
          classData.studentIds.length === 0 ||
          !classData.teacherId
        )
          continue;
        const teacherProfileDoc = await db
          .collection("users")
          .doc(classData.teacherId)
          .get();
        const teacherProfile = teacherProfileDoc.data() as
          | UserProfile
          | undefined;

        for (const studentId of classData.studentIds) {
          const studentProfileDoc = await db
            .collection("users")
            .doc(studentId)
            .get();
          const studentProfile = studentProfileDoc.data() as
            | UserProfile
            | undefined;
          if (!studentProfile) continue;

          const status = faker.helpers.arrayElement<AttendanceStatus>([
            "present",
            "present",
            "present",
            "absent",
            "late",
          ]);
          const recordRef = db.collection("attendanceRecords").doc();
          const record: Omit<AttendanceRecord, "id"> = {
            studentId,
            studentName: studentProfile.displayName,
            classId: classData.id,
            className: classData.name,
            schoolId,
            date: attendanceDate,
            status,
            markedBy: classData.teacherId,
            markedByName: teacherProfile?.displayName,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };
          await recordRef.set({ ...record, id: recordRef.id });
        }
      }
    }
    console.log(
      `  Seeded attendance for school ${schoolId} for ${NUM_ATTENDANCE_DAYS_TO_SEED} days.`
    );
  }
}

async function seedTestimonials() {
  console.log("Seeding testimonials...");
  for (const schoolId of seededSchoolIds) {
    const userPoolForSchool = [
      ...(seededAdminIds[schoolId] || []),
      ...(seededTeacherIds[schoolId] || []),
      ...(seededStudentIds[schoolId] || []),
      ...(seededParentIds[schoolId] || []),
    ].filter(Boolean);

    if (userPoolForSchool.length === 0) {
      console.log(
        `  No users available in school ${schoolId} to create testimonials.`
      );
      continue;
    }

    for (let i = 0; i < NUM_TESTIMONIALS_TO_SEED; i++) {
      if (userPoolForSchool.length === 0) break; // Should not happen if checks above are fine
      const randomUserId = faker.helpers.arrayElement(userPoolForSchool);
      const userDoc = await db.collection("users").doc(randomUserId).get();
      if (!userDoc.exists()) continue;
      const userData = userDoc.data() as UserProfile;

      const testimonialRef = db.collection("testimonials").doc();
      const testimonial: Omit<Testimonial, "id"> = {
        userId: userData.uid,
        userName: userData.displayName || "Anonymous User",
        userRole: userData.role,
        schoolId: userData.schoolId,
        schoolName: userData.schoolName,
        rating: faker.number.int({ min: 4, max: 5 }),
        feedbackText: faker.lorem.paragraph(
          faker.number.int({ min: 2, max: 4 })
        ),
        isApprovedForDisplay: faker.datatype.boolean(0.7),
        submittedAt: Timestamp.fromDate(faker.date.recent({ days: 60 })),
      };
      await testimonialRef.set({ ...testimonial, id: testimonialRef.id });
    }
    console.log(
      `  Seeded ${Math.min(
        NUM_TESTIMONIALS_TO_SEED,
        userPoolForSchool.length
      )} testimonials for school ${schoolId}.`
    );
  }
}

async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    await seedSchools();
    await seedUsers();
    await seedSubjects();
    await seedClasses();
    await seedLearningMaterials();
    await seedAssignmentsAndSubmissions();
    await seedExamPeriods();
    await seedExamResults();
    await seedAttendanceRecords();
    await seedTestimonials();

    console.log("Database seeding complete!");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
}

// Temporary storage for admin IDs for testimonial seeding, as school adminId is set after user creation
const seededAdminIds: Record<string, string[]> = {};

async function runAllSeeders() {
  await seedDatabase();
  // The prepareAdminIdsForTestimonials was removed as admin IDs are now collected during user seeding
}

runAllSeeders();
