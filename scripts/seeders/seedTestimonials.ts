
import type { Firestore } from 'firebase-admin/firestore';
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import type { School, UserProfileWithId, Testimonial } from '../../src/types'; // Adjusted import path
import { v4 as uuidv4 } from 'uuid';

export async function seedTestimonialsInFirestore(
  db: Firestore,
  schools: School[],
  users: UserProfileWithId[],
  numTestimonialsToSeed: number
): Promise<void> {
  console.log("🌟 Seeding testimonials...");
  const batch = writeBatch(db);

  for (const school of schools) {
    const userPoolForSchool = users.filter(u => u.schoolId === school.id && (u.role === 'teacher' || u.role === 'student' || u.role === 'parent'));
    if (userPoolForSchool.length === 0) continue;

    for (let i = 0; i < Math.min(numTestimonialsToSeed, userPoolForSchool.length); i++) {
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
