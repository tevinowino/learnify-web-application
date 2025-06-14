
import "dotenv/config";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Import individual seeder functions
import { seedSchoolsInFirestore } from './seeders/seedSchools';
import { seedUsersInFirestore } from './seeders/seedUsers';
import { seedSubjectsInFirestore } from './seeders/seedSubjects';
import { seedClassesInFirestore } from './seeders/seedClasses';
import { seedLearningMaterialsInFirestore } from './seeders/seedLearningMaterials';
import { seedAssignmentsAndSubmissionsInFirestore } from './seeders/seedAssignments';
import { seedExamPeriodsInFirestore } from './seeders/seedExamPeriods';
import { seedExamResultsInFirestore } from './seeders/seedExamResults';
import { seedAttendanceRecordsInFirestore } from './seeders/seedAttendance';
import { seedTestimonialsInFirestore } from './seeders/seedTestimonials';

// Import necessary service functions if seeders need to fetch existing data when run standalone
import { getAllSchoolsService } from '../src/services/schoolService'; // Assuming this exists or will be added
import { getAllUsersService } from '../src/services/userService'; // Assuming this exists or will be added
import { getAllSubjectsService } from '../src/services/subjectService'; // Assuming this exists or will be added
import { getAllClassesService } from '../src/services/classService'; // Assuming this exists or will be added
import { getAllExamPeriodsService } from '../src/services/examService'; // Assuming this exists or will be added

import type { School, UserProfileWithId, Subject, ClassWithTeacherInfo, ExamPeriod } from '../src/types';


// --- Configuration ---
const NUM_SCHOOLS = 1;
const NUM_ADMINS_PER_SCHOOL = 1;
const NUM_TEACHERS_PER_SCHOOL = 3;
const NUM_STUDENTS_PER_SCHOOL = 10;
const NUM_PARENTS_PER_SCHOOL = 5;
const NUM_SUBJECTS_PER_SCHOOL = 5;
const NUM_MAIN_CLASSES_PER_SCHOOL = 2;
const NUM_MATERIALS_PER_CLASS_SUBJECT = 1;
const NUM_ASSIGNMENTS_PER_CLASS_SUBJECT = 1;
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.5;
const NUM_EXAM_PERIODS_PER_SCHOOL = 1;
const NUM_ATTENDANCE_DAYS_TO_SEED = 3;
const NUM_TESTIMONIALS_TO_SEED = 2;


// --- Firebase Admin Setup ---
const LEARNIFY_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "learnify-project-e7f59";
let serviceAccountJson: ServiceAccount | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
    if (typeof serviceAccountJson.private_key === "string") {
      serviceAccountJson.private_key = serviceAccountJson.private_key.replace(/\\n/g, "\n");
    }
    initializeApp({ credential: cert(serviceAccountJson), projectId: LEARNIFY_PROJECT_ID });
    console.log("Initialized Firebase Admin SDK with provided service account JSON.");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ projectId: LEARNIFY_PROJECT_ID });
    console.log("Initialized Firebase Admin SDK with GOOGLE_APPLICATION_CREDENTIALS.");
  } else {
    console.warn("Neither FIREBASE_SERVICE_ACCOUNT_JSON_STRING nor GOOGLE_APPLICATION_CREDENTIALS found. Attempting with project ID only.");
    initializeApp({ projectId: LEARNIFY_PROJECT_ID });
  }
} catch (e) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", e);
  process.exit(1);
}

const db = getFirestore();
const adminAuth = getAuth();
const specificSeederToRun = process.argv[2]?.toLowerCase();

async function seedAll() {
  console.log("🚀 Starting FULL database seed Orchestration...");
  try {
    const schools = await seedSchoolsInFirestore(db, NUM_SCHOOLS);
    if (schools.length === 0) {
        console.error("No schools seeded. Aborting further seeding.");
        return;
    }
    
    const { users: seededUsers, updatedSchools } = await seedUsersInFirestore(
      db, adminAuth, schools, 
      NUM_ADMINS_PER_SCHOOL, NUM_TEACHERS_PER_SCHOOL, 
      NUM_STUDENTS_PER_SCHOOL, NUM_PARENTS_PER_SCHOOL
    );
    if (seededUsers.length === 0) {
        console.warn("No users were seeded. Subsequent data might be incomplete.");
    }

    const seededSubjects = await seedSubjectsInFirestore(db, updatedSchools, NUM_SUBJECTS_PER_SCHOOL);
    if (seededSubjects.length === 0 && NUM_SUBJECTS_PER_SCHOOL > 0) {
        console.warn("No subjects were seeded.");
    }

    const seededClasses = await seedClassesInFirestore(db, updatedSchools, seededUsers, seededSubjects, NUM_MAIN_CLASSES_PER_SCHOOL);
    if (seededClasses.length === 0 && NUM_MAIN_CLASSES_PER_SCHOOL > 0) {
        console.warn("No classes were seeded.");
    }
    
    const seededExamPeriods = await seedExamPeriodsInFirestore(db, updatedSchools, seededClasses, NUM_EXAM_PERIODS_PER_SCHOOL);
    
    await seedLearningMaterialsInFirestore(db, seededClasses, seededUsers, seededSubjects, updatedSchools, NUM_MATERIALS_PER_CLASS_SUBJECT);
    
    await seedAssignmentsAndSubmissionsInFirestore(
      db, seededClasses, seededUsers, seededSubjects, updatedSchools,
      NUM_ASSIGNMENTS_PER_CLASS_SUBJECT, SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE
    );
    
    await seedExamResultsInFirestore(db, seededExamPeriods, seededClasses, seededUsers, seededSubjects, updatedSchools);
    
    await seedAttendanceRecordsInFirestore(db, updatedSchools, seededClasses, seededUsers, NUM_ATTENDANCE_DAYS_TO_SEED);
    
    await seedTestimonialsInFirestore(db, updatedSchools, seededUsers, NUM_TESTIMONIALS_TO_SEED);

    console.log("✅ Full database seeding orchestration complete!");
  } catch (error) {
    console.error("❌ Error during full database seeding orchestration:", error);
  }
}

async function runSpecificSeeder(seederName: string) {
    console.log(`🚀 Attempting to run specific seeder: ${seederName}`);
    // IMPORTANT: Running seeders individually requires dependencies to be met
    // either by prior standalone runs or existing data.
    // This version will attempt to fetch minimal prerequisites.

    let schools: School[] = [];
    let users: UserProfileWithId[] = [];
    let subjects: Subject[] = [];
    let classes: ClassWithTeacherInfo[] = [];
    let examPeriods: ExamPeriod[] = [];

    try {
        switch (seederName) {
            case 'schools':
                await seedSchoolsInFirestore(db, NUM_SCHOOLS);
                break;
            case 'users':
                schools = await getAllSchoolsService(db);
                if (!schools.length) { console.error("❌ Schools must exist to seed users. Run `pnpm seed:schools` first."); break; }
                await seedUsersInFirestore(db, adminAuth, schools, NUM_ADMINS_PER_SCHOOL, NUM_TEACHERS_PER_SCHOOL, NUM_STUDENTS_PER_SCHOOL, NUM_PARENTS_PER_SCHOOL);
                break;
            case 'subjects':
                schools = await getAllSchoolsService(db);
                if (!schools.length) { console.error("❌ Schools must exist to seed subjects. Run `pnpm seed:schools` first."); break; }
                await seedSubjectsInFirestore(db, schools, NUM_SUBJECTS_PER_SCHOOL);
                break;
            case 'classes':
                schools = await getAllSchoolsService(db);
                if (!schools.length) { console.error("❌ Schools must exist. Run `pnpm seed:schools` first."); break; }
                users = await getAllUsersService(db); // Assuming this fetches all users across all schools, or filter by schoolId if needed.
                if (!users.length) { console.error("❌ Users must exist. Run `pnpm seed:users` first."); break; }
                subjects = await getAllSubjectsService(db); // Assuming this fetches all subjects
                if (!subjects.length) { console.error("❌ Subjects must exist. Run `pnpm seed:subjects` first."); break; }
                await seedClassesInFirestore(db, schools, users, subjects, NUM_MAIN_CLASSES_PER_SCHOOL);
                break;
            case 'learningmaterials':
                schools = await getAllSchoolsService(db);
                classes = await getAllClassesService(db); 
                users = await getAllUsersService(db);
                subjects = await getAllSubjectsService(db);
                if (!schools.length || !classes.length || !users.length || !subjects.length) { console.error("❌ Prerequisites (schools, classes, users, subjects) missing for learning materials."); break;}
                await seedLearningMaterialsInFirestore(db, classes, users, subjects, schools, NUM_MATERIALS_PER_CLASS_SUBJECT);
                break;
            case 'assignments':
                schools = await getAllSchoolsService(db);
                classes = await getAllClassesService(db);
                users = await getAllUsersService(db);
                subjects = await getAllSubjectsService(db);
                if (!schools.length || !classes.length || !users.length || !subjects.length) { console.error("❌ Prerequisites missing for assignments."); break;}
                await seedAssignmentsAndSubmissionsInFirestore(db, classes, users, subjects, schools, NUM_ASSIGNMENTS_PER_CLASS_SUBJECT, SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE);
                break;
            case 'examperiods':
                schools = await getAllSchoolsService(db);
                classes = await getAllClassesService(db);
                if (!schools.length || !classes.length) { console.error("❌ Prerequisites (schools, classes) missing for exam periods."); break;}
                await seedExamPeriodsInFirestore(db, schools, classes, NUM_EXAM_PERIODS_PER_SCHOOL);
                break;
            case 'examresults':
                schools = await getAllSchoolsService(db);
                examPeriods = await getAllExamPeriodsService(db);
                classes = await getAllClassesService(db);
                users = await getAllUsersService(db);
                subjects = await getAllSubjectsService(db);
                 if (!schools.length || !examPeriods.length || !classes.length || !users.length || !subjects.length) { console.error("❌ Prerequisites missing for exam results."); break;}
                await seedExamResultsInFirestore(db, examPeriods, classes, users, subjects, schools);
                break;
            case 'attendance':
                schools = await getAllSchoolsService(db);
                classes = await getAllClassesService(db);
                users = await getAllUsersService(db);
                if (!schools.length || !classes.length || !users.length) { console.error("❌ Prerequisites (schools, classes, users) missing for attendance."); break;}
                await seedAttendanceRecordsInFirestore(db, schools, classes, users, NUM_ATTENDANCE_DAYS_TO_SEED);
                break;
            case 'testimonials':
                schools = await getAllSchoolsService(db);
                users = await getAllUsersService(db);
                 if (!schools.length || !users.length ) { console.error("❌ Prerequisites (schools, users) missing for testimonials."); break;}
                await seedTestimonialsInFirestore(db, schools, users, NUM_TESTIMONIALS_TO_SEED);
                break;
            default:
                console.log(`❌ Unknown seeder: ${seederName}. Available: schools, users, subjects, classes, learningmaterials, assignments, examperiods, examresults, attendance, testimonials, or 'all'.`);
                return;
        }
        console.log(`✅ Specific seeding for "${seederName}" complete!`);
    } catch (error) {
        console.error(`❌ Error during specific seeding for "${seederName}":`, error);
    }
}

if (specificSeederToRun && specificSeederToRun !== 'all') {
    runSpecificSeeder(specificSeederToRun);
} else {
    seedAll();
}

