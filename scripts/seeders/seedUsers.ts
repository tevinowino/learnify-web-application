
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth as AdminAuth } from 'firebase-admin/auth';
import { doc, setDoc, Timestamp, updateDoc } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, UserProfile, UserProfileWithId, UserRole, UserStatus } from '../../src/types'; // Adjusted import path

async function createFirebaseUserWithRetry(
  adminAuth: AdminAuth,
  email: string,
  pass: string,
  displayName: string
): Promise<string | null> {
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
        `User with email ${email} already exists. Attempting to fetch UID.`
      );
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        return userRecord.uid;
      } catch (fetchError) {
        console.error(`Failed to fetch existing user ${email}:`, fetchError);
        return null;
      }
    }
    // For other errors, especially rate limits like "auth/quota-exceeded", we might retry
    if (error.code === 'auth/quota-exceeded' || error.message?.includes('rate limit')) {
        console.warn(`Rate limit hit for ${email}. Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return createFirebaseUserWithRetry(adminAuth, email, pass, displayName); // Recursive call
    }
    console.error(`Error creating Firebase Auth user ${email}:`, error);
    return null;
  }
}


export async function seedUsersInFirestore(
  db: Firestore,
  adminAuth: AdminAuth,
  schools: School[],
  numAdminsPerSchool: number,
  numTeachersPerSchool: number,
  numStudentsPerSchool: number,
  numParentsPerSchool: number
): Promise<{ users: UserProfileWithId[], updatedSchools: School[] }> {
  console.log("👤 Seeding users (admins, teachers, students, parents)...");
  const allUsers: UserProfileWithId[] = [];
  const updatedSchools = [...schools];

  for (const school of updatedSchools) {
    const usersForThisSchool: UserProfileWithId[] = [];

    // Admins
    for (let i = 0; i < numAdminsPerSchool; i++) {
      const email = faker.internet.email({
        firstName: `admin${i}`,
        lastName: school.id.substring(0, 4),
        provider: "learnify.dev",
      });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUserWithRetry(adminAuth, email, "password123", displayName);
      if (uid) {
        const userProfile: UserProfileWithId = {
          id: uid,
          uid,
          email,
          displayName,
          role: "admin" as UserRole,
          schoolId: school.id,
          schoolName: school.name,
          status: "active" as UserStatus,
          onboardingStep: null, // Admins created by seeder are considered fully onboarded
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          isAdminAlso: false,
          lastTestimonialSurveyAt: faker.datatype.boolean(0.1) ? Timestamp.fromDate(faker.date.recent({ days: 30 })) : null,
        };
        await setDoc(doc(db, "users", uid), userProfile);
        usersForThisSchool.push(userProfile);
        if (i === 0 && school.adminId === '') { 
          school.adminId = uid; // Assign first admin as the main school admin
          await updateDoc(doc(db, "schools", school.id), { adminId: uid });
        }
        console.log(`  Admin for ${school.name}: ${displayName} (${email})`);
      }
    }

    // Teachers
    for (let i = 0; i < numTeachersPerSchool; i++) {
      const email = faker.internet.email({
        firstName: `teacher${i}`,
        lastName: school.id.substring(0, 4),
        provider: "learnify.dev",
      });
      const displayName = faker.person.fullName();
      const uid = await createFirebaseUserWithRetry(adminAuth, email, "password123", displayName);
      if (uid) {
        const userProfile: UserProfileWithId = {
          id: uid,
          uid,
          email,
          displayName,
          role: "teacher" as UserRole,
          schoolId: school.id,
          schoolName: school.name,
          status: "active" as UserStatus, // Teachers are active by default in seeder
          onboardingStep: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          isAdminAlso: faker.datatype.boolean(0.1), // 10% chance a teacher also has admin rights
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2) ? Timestamp.fromDate(faker.date.recent({ days: 30 })) : null,
        };
        await setDoc(doc(db, "users", uid), userProfile);
        usersForThisSchool.push(userProfile);
        console.log(`    Teacher for ${school.name}: ${displayName} (${email})`);
      }
    }

    // Students
    const studentsCreatedInThisSchool: UserProfileWithId[] = [];
    for (let i = 0; i < numStudentsPerSchool; i++) {
      const studentFirstName = faker.person.firstName();
      const studentLastName = faker.person.lastName();
      const studentDisplayName = `${studentFirstName} ${studentLastName}`;
      const studentEmail = faker.internet.email({
        firstName: studentFirstName.toLowerCase(),
        lastName: studentLastName.toLowerCase(),
        provider: "learnify.student.dev",
      });
      const studentUid = await createFirebaseUserWithRetry(adminAuth, studentEmail, "password123", studentDisplayName);
      if (studentUid) {
        const userProfile: UserProfileWithId = {
          id: studentUid,
          uid: studentUid,
          email: studentEmail,
          displayName: studentDisplayName,
          role: "student" as UserRole,
          schoolId: school.id,
          schoolName: school.name,
          status: "active" as UserStatus, // Students are active & "onboarded" by seeder
          onboardingStep: null, 
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [], // Will be populated by class seeder
          subjects: [], // Will be populated by class seeder
          isAdminAlso: false,
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2) ? Timestamp.fromDate(faker.date.recent({ days: 20 })) : null,
        };
        await setDoc(doc(db, "users", studentUid), userProfile);
        usersForThisSchool.push(userProfile);
        studentsCreatedInThisSchool.push(userProfile);
        console.log(`    Student for ${school.name}: ${studentDisplayName} (${studentEmail})`);
      }
    }

    // Parents
    for (let i = 0; i < Math.min(numParentsPerSchool, studentsCreatedInThisSchool.length); i++) {
      const childToLink = studentsCreatedInThisSchool[i];
      const parentFirstName = faker.person.firstName();
      const parentLastName = childToLink.displayName!.split(' ').pop() || faker.person.lastName();
      const parentDisplayName = `${parentFirstName} ${parentLastName}`;
      const parentEmail = faker.internet.email({
        firstName: parentFirstName.toLowerCase(),
        lastName: parentLastName.toLowerCase(),
        provider: "learnify.parent.dev",
      });
      const parentUid = await createFirebaseUserWithRetry(adminAuth, parentEmail, "password123", parentDisplayName);
      if (parentUid) {
        const parentProfile: UserProfileWithId = {
          id: parentUid,
          uid: parentUid,
          email: parentEmail,
          displayName: parentDisplayName,
          role: "parent" as UserRole,
          schoolId: school.id,
          schoolName: school.name,
          childStudentId: childToLink.id,
          status: "active" as UserStatus,
          onboardingStep: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          classIds: [],
          subjects: [],
          isAdminAlso: false,
          lastTestimonialSurveyAt: faker.datatype.boolean(0.2) ? Timestamp.fromDate(faker.date.recent({ days: 20 })) : null,
        };
        await setDoc(doc(db, "users", parentUid), parentProfile);
        usersForThisSchool.push(parentProfile);
        console.log(`      Parent for ${childToLink.displayName}: ${parentDisplayName} (${parentEmail})`);
      }
    }
    allUsers.push(...usersForThisSchool);
    console.log(`  Completed seeding users for school: ${school.name}`);
  }
  console.log("Finished seeding all users.");
  return { users: allUsers, updatedSchools };
}
