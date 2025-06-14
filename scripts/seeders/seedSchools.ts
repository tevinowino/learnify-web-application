
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedSchoolsInFirestore(
  db: Firestore,
  numSchools: number
): Promise<School[]> {
  console.log(`🏫 Seeding ${numSchools} schools...`);
  const schools: School[] = [];
  for (let i = 0; i < numSchools; i++) {
    const schoolName = faker.company.name() + " Academy";
    const schoolRef = doc(db, "schools", uuidv4());
    const schoolInviteCode = `SCH-${faker.string
      .alphanumeric(6)
      .toUpperCase()}`;
    
    const school: School = {
      id: schoolRef.id,
      name: schoolName,
      adminId: '', // Will be updated after admin user is created
      inviteCode: schoolInviteCode,
      schoolType: faker.helpers.arrayElement(["Primary", "Secondary", "K-12"]),
      country: faker.location.country(),
      phoneNumber: faker.phone.number(),
      setupComplete: false, // Initially false, admin onboarding will complete this
      isExamModeActive: faker.datatype.boolean(0.3),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(schoolRef, school);
    schools.push(school);
    console.log(`  Created school: ${school.name} (ID: ${school.id})`);
  }
  return schools;
}
