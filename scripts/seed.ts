
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
  UserProfileWithId,
  ClassWithTeacherInfo
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
const NUM_MATERIALS_PER_ASSIGNED_CLASS_SUBJECT = 2;
const NUM_ASSIGNMENTS_PER_ASSIGNED_CLASS_SUBJECT = 2;
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.75;
const NUM_EXAM_PERIODS_PER_SCHOOL = 2;
const NUM_ATTENDANCE_DAYS_TO_SEED = 10;
const NUM_TESTIMONIALS_TO_SEED = 5;

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
    }); // Relies on ADC
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
  process.exit(1); // Stop execution if Firebase is not initialized
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

const seededSchools: School[] = [];
const seededUsers: UserProfileWithId[] = [];
const seededSubjects: Subject[] = [];
const seededClasses: ClassWithTeacherInfo[] = []; // Store enriched class info
const seededExamPeriods: ExamPeriod[] = [];


async function seedSchools() {
  console.log("Seeding schools...");
  for (let i = 0; i < NUM_SCHOOLS; i++) {
    const schoolName = faker.company.name() + " Academy";
    const schoolRef = doc(db, "schools", uuidv4()); // Use uuid for Firestore doc ID
    const schoolInviteCode = `SCH-${faker.string
      .alphanumeric(6)
      .toUpperCase()}`;
    
    // Admin will be created later and adminId updated on the school
    const school: School = {
      id: schoolRef.id,
      name: schoolName,
      adminId: '', // Placeholder, will be updated
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
  console.log("Seeding users (admins, teachers, students, parents)...");
  for (const school of seededSchools) {
    
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
          id: uid, // Use UID as the Firestore document ID for users
          uid,
          email,
          displayName,
          role: "admin",
          schoolId: school.id,
          schoolName: school.name,
          onboardingStep: null, // Completed onboarding
          status: "active",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          lastTestimonialSurveyAt: faker.datatype.boolean(0.1) ? Timestamp.fromDate(faker.date.recent({ days: 30 })) : null,
        };
        await setDoc(doc(db, "users", uid), userProfile);
        seededUsers.push(userProfile);
        if (i === 0) { // Assign first admin as the main school admin
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
        seededUsers.push(userProfile);
        console.log(`    Teacher for ${school.name}: ${displayName} (${email})`);
      }
    }

    // Students
    const studentsForThisSchool: UserProfileWithId[] = [];
    for (let i = 0; i < NUM_STUDENTS_PER_SCHOOL; i++) {
      const studentFirstName = faker.person.firstName();
      const studentLastName = faker.person.lastName();
      const studentDisplayName = `${studentFirstName} ${studentLastName}`;
      const studentEmail = faker.internet.email({
        firstName: studentFirstName,
        lastName: studentLastName,
        provider: "learnify.student.dev",
      });
      const studentUid = await createFirebaseUser(
        studentEmail,
        "password123",
        studentDisplayName
      );
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
          onboardingStep: null, // Will be updated after class enrollment
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
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
    "Mathematics", "English Language", "Integrated Science", "Social Studies",
    "Creative Arts", "Physical Education", "Computing", "Religious & Moral Education",
    "French", "Career Technology", "History", "Geography", "Biology", "Chemistry", "Physics"
  ];
  for (const school of seededSchools) {
    const subjectsToSeed = faker.helpers.arrayElements(
      commonSubjects,
      NUM_SUBJECTS_PER_SCHOOL
    );
    for (const subjectName of subjectsToSeed) {
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
    console.log(`  Seeded ${subjectsToSeed.length} subjects for school ${school.name}`);
  }
}

async function seedClasses() {
  console.log("Seeding classes...");
  for (const school of seededSchools) {
    const schoolTeachers = seededUsers.filter(u => u.schoolId === school.id && u.role === 'teacher');
    const schoolStudents = seededUsers.filter(u => u.schoolId === school.id && u.role === 'student');
    const schoolSpecificSubjects = seededSubjects.filter(s => s.schoolId === school.id);

    if (schoolTeachers.length === 0 || schoolStudents.length === 0 || schoolSpecificSubjects.length === 0) {
      console.warn(`  Insufficient teachers, students, or subjects for school ${school.name}, skipping class creation.`);
      continue;
    }

    const studentsPerMainClass = Math.max(1, Math.ceil(schoolStudents.length / NUM_MAIN_CLASSES_PER_SCHOOL));

    for (let i = 0; i < NUM_MAIN_CLASSES_PER_SCHOOL; i++) {
      const classRef = doc(db, "classes", uuidv4());
      const mainClassName = `Form ${i + 1} ${faker.helpers.arrayElement(["Gold", "Blue", "Green", "Red"])}`;
      const assignedTeacher = schoolTeachers[i % schoolTeachers.length];
      
      const compulsorySubjectsForThisClass = faker.helpers.arrayElements(
        schoolSpecificSubjects,
        faker.number.int({ min: 1, max: Math.min(3, schoolSpecificSubjects.length) })
      );
      const compulsorySubjectIds = compulsorySubjectsForThisClass.map(s => s.id);

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
      await setDoc(classRef, classData);
      seededClasses.push({ ...classData, teacherDisplayName: assignedTeacher.displayName, compulsorySubjectNames: compulsorySubjectsForThisClass.map(s=>s.name) });
      console.log(`    Created main class: ${mainClassName} for ${school.name} with ${enrolledStudentIds.length} students. Teacher: ${assignedTeacher.displayName}`);

      // Update enrolled students
      for (const student of enrolledStudentBatch) {
        const studentRef = doc(db, "users", student.id);
        await updateDoc(studentRef, {
          classIds: FieldValue.arrayUnion(classRef.id),
          subjects: FieldValue.arrayUnion(...compulsorySubjectIds),
          onboardingStep: null, // Mark onboarding as complete
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
          studentIds: [], // Students will be enrolled next
          classInviteCode: `SC-${faker.string.alphanumeric(6).toUpperCase()}`,
          compulsorySubjectIds: [],
          subjectId: subject.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await setDoc(subjectClassRef, subjectClassData);
        seededClasses.push({ ...subjectClassData, teacherDisplayName: subjectTeacher.displayName, subjectName: subject.name });
        console.log(`      Created subject class: ${subjectClassName} for ${school.name}. Teacher: ${subjectTeacher.displayName}`);

        let enrolledInSubjectClassCount = 0;
        for (const student of enrolledStudentBatch) {
          // All students take compulsory subjects. For electives, 60% chance.
          const isCompulsory = compulsorySubjectIds.includes(subject.id);
          if (isCompulsory || faker.datatype.boolean(0.6)) {
            const studentRef = doc(db, "users", student.id);
            await updateDoc(studentRef, {
              classIds: FieldValue.arrayUnion(subjectClassRef.id),
              subjects: FieldValue.arrayUnion(subject.id),
              updatedAt: Timestamp.now(),
            });
            await updateDoc(subjectClassRef, {
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
}


async function seedLearningMaterials() {
  console.log("Seeding learning materials...");
  for (const schoolId of seededSchoolIds) {
    const teachers = seededTeacherIds[schoolId] || [];
    const schoolSpecificSubjects = allCreatedSubjects.filter(
      (s) => s.schoolId === schoolId
    );

    for (const teacherId of teachers) {
      const teacherProfileDoc = await db
        .collection("users")
        .doc(teacherId)
        .get();
      const teacherProfile = teacherProfileDoc.data() as
        | UserProfile
        | undefined;
      if (!teacherProfile) continue;

      const classesTaughtByTeacher = allCreatedClasses.filter(
        (c) => c.schoolId === schoolId && c.teacherId === teacherId
      );

      for (const classData of classesTaughtByTeacher) {
        const subjectsRelevantToClass =
          classData.classType === "main"
            ? classData.compulsorySubjectIds &&
              classData.compulsorySubjectIds.length > 0
              ? (classData.compulsorySubjectIds
                  .map((csId) =>
                    schoolSpecificSubjects.find((s) => s.id === csId)
                  )
                  .filter(Boolean) as Subject[])
              : faker.helpers.arrayElements(
                  schoolSpecificSubjects,
                  Math.min(2, schoolSpecificSubjects.length)
                )
            : schoolSpecificSubjects.filter(
                (s) => s.id === classData.subjectId
              );

        for (const subject of subjectsRelevantToClass) {
          for (
            let i = 0;
            i < NUM_MATERIALS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT;
            i++
          ) {
            const materialType =
              faker.helpers.arrayElement<LearningMaterialType>([
                "text",
                "link",
                "pdf_link",
                "video_link",
              ]);
            const materialRef = db.collection("learningMaterials").doc();
            const material: Omit<
              LearningMaterial,
              "id" | "originalFileName" | "attachmentUrl"
            > = {
              title: `${subject.name} - ${faker.lorem.words(3)}`,
              content:
                materialType === "text"
                  ? faker.lorem.paragraphs(2)
                  : faker.internet.url(),
              materialType,
              schoolId,
              teacherId,
              classId: classData.id,
              subjectId: subject.id,
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
  console.log("Seeding assignments and submissions...");
  for (const schoolId of seededSchoolIds) {
    const teachers = seededTeacherIds[schoolId] || [];
    const schoolSpecificSubjects = allCreatedSubjects.filter(
      (s) => s.schoolId === schoolId
    );

    for (const teacherId of teachers) {
      const classesTaughtByTeacher = allCreatedClasses.filter(
        (c) => c.schoolId === schoolId && c.teacherId === teacherId
      );

      for (const classData of classesTaughtByTeacher) {
        const studentsInClass = classData.studentIds || [];
        if (studentsInClass.length === 0) continue;

        const subjectsRelevantToClass =
          classData.classType === "main"
            ? classData.compulsorySubjectIds &&
              classData.compulsorySubjectIds.length > 0
              ? (classData.compulsorySubjectIds
                  .map((csId) =>
                    schoolSpecificSubjects.find((s) => s.id === csId)
                  )
                  .filter(Boolean) as Subject[])
              : faker.helpers.arrayElements(
                  schoolSpecificSubjects,
                  Math.min(2, schoolSpecificSubjects.length)
                )
            : schoolSpecificSubjects.filter(
                (s) => s.id === classData.subjectId
              );

        for (const subject of subjectsRelevantToClass) {
          for (
            let i = 0;
            i < NUM_ASSIGNMENTS_PER_TEACHER_ASSIGNED_CLASS_SUBJECT;
            i++
          ) {
            const assignmentRef = db.collection("assignments").doc();
            const deadline = Timestamp.fromDate(faker.date.soon({ days: 14 }));
            const assignment: Omit<Assignment, "id" | "totalSubmissions"> = {
              classId: classData.id,
              teacherId,
              schoolId,
              subjectId: subject.id,
              title: `Assignment: ${subject.name} - ${faker.lorem.words(2)}`,
              description: faker.lorem.paragraph(),
              deadline,
              allowedSubmissionFormats:
                faker.helpers.arrayElements<SubmissionFormat>(
                  ["text_entry", "file_link", "file_upload"],
                  faker.number.int({ min: 1, max: 2 })
                ),
              createdAt: Timestamp.fromDate(
                faker.date.recent({ days: 7, refDate: deadline.toDate() })
              ),
              updatedAt: Timestamp.fromDate(
                faker.date.recent({ days: 3, refDate: deadline.toDate() })
              ),
            };
            await assignmentRef.set({
              ...assignment,
              id: assignmentRef.id,
              totalSubmissions: 0,
            });

            let submissionsCount = 0;
            for (const studentId of studentsInClass) {
              if (Math.random() < SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE) {
                const submissionRef = db.collection("submissions").doc();
                const submittedAt = Timestamp.fromDate(
                  faker.date.between({
                    from: assignment.createdAt.toDate(),
                    to: deadline.toDate(),
                  })
                );
                const submissionType = faker.helpers.arrayElement(
                  assignment.allowedSubmissionFormats
                );
                const status = faker.datatype.boolean(0.6)
                  ? "graded"
                  : submittedAt > deadline
                  ? "late"
                  : "submitted";

                const submission: Omit<Submission, "id"> = {
                  assignmentId: assignmentRef.id,
                  classId: classData.id,
                  studentId,
                  submittedAt,
                  submissionType,
                  content:
                    submissionType === "text_entry"
                      ? faker.lorem.paragraph()
                      : submissionType === "file_link"
                      ? faker.internet.url()
                      : `https://placehold.co/300x200.png?text=${faker.system.fileName()}`,
                  originalFileName:
                    submissionType === "file_upload"
                      ? faker.system.commonFileName("pdf")
                      : undefined,
                  grade:
                    status === "graded"
                      ? faker.number.int({ min: 60, max: 100 }).toString() + "%"
                      : undefined,
                  feedback:
                    status === "graded" ? faker.lorem.sentence() : undefined,
                  status,
                  updatedAt: Timestamp.now(),
                };
                await submissionRef.set({
                  ...submission,
                  id: submissionRef.id,
                });
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
  console.log("Seeding exam periods...");
  for (const schoolId of seededSchoolIds) {
    seededExamPeriodIds[schoolId] = [];
    const mainClassesInSchool = allCreatedClasses.filter(
      (c) => c.schoolId === schoolId && c.classType === "main"
    );
    if (mainClassesInSchool.length === 0) continue;

    for (let i = 0; i < NUM_EXAM_PERIODS_PER_SCHOOL; i++) {
      const examPeriodRef = db.collection("examPeriods").doc();
      const startDate = faker.date.soon({ days: 10 });
      const endDate = faker.date.soon({ days: 5, refDate: startDate });
      const statusOptions: ExamPeriodStatus[] = [
        "upcoming",
        "active",
        "grading",
        "completed",
      ];
      const examPeriod: Omit<ExamPeriod, "id"> = {
        name: `${faker.helpers.arrayElement([
          "Mid-Term",
          "End-Term",
          "Final",
        ])} Exams ${startDate.getFullYear()} Term ${i + 1}`,
        schoolId,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        assignedClassIds: faker.helpers.arrayElements(
          mainClassesInSchool.map((c) => c.id),
          faker.number.int({
            min: 1,
            max: Math.min(mainClassesInSchool.length, 3),
          })
        ),
        status: faker.helpers.arrayElement(statusOptions),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await examPeriodRef.set({ ...examPeriod, id: examPeriodRef.id });
      seededExamPeriodIds[schoolId].push(examPeriodRef.id);
    }
    console.log(`  Seeded exam periods for school ${schoolId}`);
  }
}

async function seedExamResults() {
  console.log("Seeding exam results...");
  for (const schoolId of seededSchoolIds) {
    const periods = seededExamPeriodIds[schoolId] || [];
    const schoolSpecificSubjects = allCreatedSubjects.filter(
      (s) => s.schoolId === schoolId
    );
    if (periods.length === 0 || schoolSpecificSubjects.length === 0) continue;

    for (const periodId of periods) {
      const periodDoc = await db.collection("examPeriods").doc(periodId).get();
      const examPeriod = periodDoc.data() as ExamPeriod | undefined;
      if (
        !examPeriod ||
        examPeriod.status === "upcoming" ||
        examPeriod.status === "completed"
      )
        continue;

      for (const classId of examPeriod.assignedClassIds) {
        const classDoc = allCreatedClasses.find((c) => c.id === classId);
        if (
          !classDoc ||
          !classDoc.studentIds ||
          classDoc.studentIds.length === 0
        )
          continue;

        const classSubjects =
          classDoc.classType === "main"
            ? classDoc.compulsorySubjectIds &&
              classDoc.compulsorySubjectIds.length > 0
              ? (classDoc.compulsorySubjectIds
                  .map((csId) =>
                    schoolSpecificSubjects.find((s) => s.id === csId)
                  )
                  .filter(Boolean) as Subject[])
              : schoolSpecificSubjects // if no compulsory, use all school subjects for main class results for more data
            : schoolSpecificSubjects.filter((s) => s.id === classDoc.subjectId);

        const teacherId = classDoc.teacherId || seededTeacherIds[schoolId]?.[0];
        if (!teacherId) continue;

        for (const studentId of classDoc.studentIds) {
          for (const subject of classSubjects) {
            if (faker.datatype.boolean(0.8)) {
              const resultRef = db.collection("examResults").doc();
              const result: Omit<ExamResult, "id"> = {
                studentId,
                examPeriodId: periodId,
                classId,
                schoolId,
                subjectId: subject.id,
                marks: faker.number.int({ min: 40, max: 100 }).toString() + "%",
                remarks: faker.lorem.sentence(),
                teacherId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
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

// Helper to ensure date is at start of day for consistent querying
const startOfDayTimestamp = (date: Date): Timestamp => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
};

async function seedAttendanceRecords() {
  console.log("Seeding attendance records...");
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
          await setDoc(recordRef, record);
        }
      }
    }
    console.log(`  Seeded attendance for school ${school.name} for ${NUM_ATTENDANCE_DAYS_TO_SEED} days.`);
  }
}

async function seedTestimonials() {
  console.log("Seeding testimonials...");
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
      await setDoc(testimonialRef, testimonial);
    }
    console.log(`  Seeded testimonials for school ${school.name}.`);
  }
}


async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    await seedSchools();
    await seedUsers(); // Admins, Teachers, Students, Parents
    await seedSubjects();
    await seedClasses(); // Main classes, subject-based classes, student enrollments
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

seedDatabase();
