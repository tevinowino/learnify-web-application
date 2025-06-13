const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
};

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

const clearAllUsers = async () => {
  const listUsersResult = await auth.listUsers(1000);
  for (const user of listUsersResult.users) {
    console.log(`Deleting user: ${user.uid}`);
    await auth.deleteUser(user.uid);
  }
  console.log("All users deleted.");
};

clearAllUsers().catch(console.error);
