
# Firestore Data Seeder Script

This script is used to populate your Firestore database with mock data for testing and development purposes. It uses the `@faker-js/faker` library to generate realistic-looking data and `firebase-admin` to interact directly with Firestore and Firebase Authentication.

## Prerequisites

1.  **Node.js and pnpm:** Ensure you have Node.js (v18 or later recommended) and pnpm installed.
2.  **Firebase Project:** You must have a Firebase project set up. It's **highly recommended** to run this script against a development or staging Firebase project, not your production project.
3.  **Firebase Admin SDK Credentials:**
    *   Go to your Firebase project settings in the Firebase Console.
    *   Navigate to the "Service accounts" tab.
    *   Click on "Generate new private key" and download the JSON file.
    *   **Important:** Keep this file secure and do **NOT** commit it to your Git repository.
    *   You need to make these credentials available to the script. There are two main ways:
        *   **Recommended for Local Development: `GOOGLE_APPLICATION_CREDENTIALS` Environment Variable**
            *   Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the absolute path of the downloaded JSON key file.
                *   On macOS/Linux: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"`
                *   On Windows (PowerShell): `$env:GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"`
                *   (Replace `/path/to/your/serviceAccountKey.json` with the actual path to your file).
            *   This is the most common method for local development with Firebase Admin SDK.
        *   **Alternative: `FIREBASE_SERVICE_ACCOUNT_JSON_STRING` Environment Variable**
            *   If you are running in an environment where you can securely store a JSON string (e.g., Vercel environment variables, GitHub Actions secrets), you can set `FIREBASE_SERVICE_ACCOUNT_JSON_STRING` to the stringified content of the service account JSON file. The script will attempt to parse this.
            *   To get the stringified content: `cat /path/to/your/serviceAccountKey.json | jq -c .` (requires `jq`) or copy-paste the content of the JSON file, ensuring it's a valid single-line JSON string.

## Setup

1.  **Install Dependencies:**
    If you haven't already, install the necessary development dependencies:
    ```bash
    pnpm install @faker-js/faker firebase-admin tsx --save-dev
    ```
    (Note: `tsx` allows running TypeScript files directly, similar to `ts-node`)

2.  **Review and Customize `scripts/seed.ts`:**
    *   Open the `scripts/seed.ts` file.
    *   **Configuration Constants:** At the top of the file, you'll find constants like `NUM_SCHOOLS`, `NUM_TEACHERS_PER_SCHOOL`, etc. Adjust these numbers to control how much data is generated.
    *   **Data Structures:** The script uses type definitions from `../src/types`. If you've changed these types, you might need to adjust the seeding logic accordingly.
    *   **Faker Logic:** Review how Faker.js is used to generate data. You can customize this to create data that is more specific to your testing scenarios.
    *   **Relationships:** The script attempts to create data in a logical order to maintain relationships (e.g., a teacher is assigned to an existing school). Ensure this order makes sense for your needs.

## Running the Seeder

1.  **Set Up Credentials:** Make sure your Firebase Admin SDK credentials are set up as described in the "Prerequisites" section. **For local development, setting `GOOGLE_APPLICATION_CREDENTIALS` is usually the simplest and most reliable method if `FIREBASE_SERVICE_ACCOUNT_JSON_STRING` is not being used.**

2.  **Execute the Script:**
    From the root of your project, run:
    ```bash
    pnpm seed
    ```
    This command is defined in your `package.json` and uses `tsx` to execute the `scripts/seed.ts` file.

    Alternatively, if you prefer `ts-node`:
    ```bash
    npx ts-node scripts/seed.ts
    ```

3.  **Monitor Output:** The script will log its progress to the console, indicating which collections are being seeded and when it's complete. Check for any error messages.

## Troubleshooting

*   **"Could not load the default credentials" Error:**
    *   This means the script cannot find authentication credentials for your Firebase project.
    *   Ensure your `GOOGLE_APPLICATION_CREDENTIALS` environment variable is correctly set to the **absolute path** of your downloaded service account JSON key file.
    *   Verify the JSON file itself is valid and has not been corrupted.
    *   If using `FIREBASE_SERVICE_ACCOUNT_JSON_STRING`, ensure it's a valid, single-line JSON string.
    *   Ensure the service account has the necessary Firestore and Authentication permissions in your Firebase project (usually "Firebase Admin SDK Administrator Service Agent" or at least "Editor" or specific Firestore/Auth admin roles).
*   **"Unable to detect a Project Id" Error:**
    *   This usually means the `projectId` could not be inferred from the credentials. The script now explicitly sets the Project ID during initialization, which should mitigate this. However, if it persists, double-check that your service account JSON file contains a `project_id` field or that the Project ID specified in `scripts/seed.ts` (`LEARNIFY_PROJECT_ID`) matches your Firebase project.

## Important Notes

*   **Data Overwriting/Duplication:**
    *   The script attempts to avoid creating duplicate Firebase Authentication users if an email already exists by fetching the existing user's UID.
    *   For Firestore data, the script generally creates new documents with unique IDs. If you run the script multiple times, it will add *new* data, not overwrite existing mock data (unless you modify the script to specifically do so by querying for existing mock data and updating it, which is more complex).
    *   If you need to clear old mock data, you might need to do so manually via the Firebase console or write a separate cleanup script.
*   **Security:**
    *   **Never commit your Firebase Admin SDK service account key to your repository.**
    *   Be cautious about the data Faker.js generates if you have very specific data validation rules in your Firestore security rules that the mock data might not meet.
*   **Performance:** For very large datasets, seeding can take time. Run it on a powerful machine if possible, or seed data in smaller batches.
*   **Idempotency:** This script is not fully idempotent by default (meaning running it multiple times might produce slightly different states or more data). For true idempotency, you would need to add logic to check for existing data before creating new entries, which significantly increases script complexity.
*   **Error Handling:** The script includes basic error handling. Monitor the console for any issues.

By following these steps, you should be able to populate your Firestore database with mock data to facilitate comprehensive testing of your Learnify application.
