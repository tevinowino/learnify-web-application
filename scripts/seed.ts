
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

// --- Configuration ---
const NUM_SCHOOLS = 1;
const NUM_ADMINS_PER_SCHOOL = 1;
const NUM_TEACHERS_PER_SCHOOL = 3; // Reduced for faster seeding
const NUM_STUDENTS_PER_SCHOOL = 10; // Reduced
const NUM_PARENTS_PER_SCHOOL = 5;  // Reduced
const NUM_SUBJECTS_PER_SCHOOL = 5; // Reduced
const NUM_MAIN_CLASSES_PER_SCHOOL = 2;
const NUM_MATERIALS_PER_CLASS_SUBJECT = 1; // Reduced
const NUM_ASSIGNMENTS_PER_CLASS_SUBJECT = 1; // Reduced
const SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE = 0.5; // Reduced
const NUM_EXAM_PERIODS_PER_SCHOOL = 1; // Reduced
const NUM_ATTENDANCE_DAYS_TO_SEED = 3; // Reduced
const NUM_TESTIMONIALS_TO_SEED = 2; // Reduced


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

async function seedDatabase() {
  try {
    console.log("🚀 Starting database seed Orchestration...");

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
        console.warn("No subjects were seeded. Subsequent data related to subjects might be incomplete.");
    }

    const seededClasses = await seedClassesInFirestore(db, updatedSchools, seededUsers, seededSubjects, NUM_MAIN_CLASSES_PER_SCHOOL);
    if (seededClasses.length === 0 && NUM_MAIN_CLASSES_PER_SCHOOL > 0) {
        console.warn("No classes were seeded. Subsequent data related to classes might be incomplete.");
    }
    
    const seededExamPeriods = await seedExamPeriodsInFirestore(db, updatedSchools, seededClasses, NUM_EXAM_PERIODS_PER_SCHOOL);
    // Exam periods can be empty if no classes were available to assign them to.
    
    await seedLearningMaterialsInFirestore(db, seededClasses, seededUsers, seededSubjects, updatedSchools, NUM_MATERIALS_PER_CLASS_SUBJECT);
    
    await seedAssignmentsAndSubmissionsInFirestore(
      db, seededClasses, seededUsers, seededSubjects, updatedSchools,
      NUM_ASSIGNMENTS_PER_CLASS_SUBJECT, SUBMISSIONS_PER_ASSIGNMENT_PERCENTAGE
    );
    
    await seedExamResultsInFirestore(db, seededExamPeriods, seededClasses, seededUsers, seededSubjects, updatedSchools);
    
    await seedAttendanceRecordsInFirestore(db, updatedSchools, seededClasses, seededUsers, NUM_ATTENDANCE_DAYS_TO_SEED);
    
    await seedTestimonialsInFirestore(db, updatedSchools, seededUsers, NUM_TESTIMONIALS_TO_SEED);

    console.log("✅ Database seeding orchestration complete!");
  } catch (error) {
    console.error("❌ Error during database seeding orchestration:", error);
  }
}

seedDatabase();
