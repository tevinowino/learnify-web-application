import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param file The file to upload.
 * @param path The desired path in Firebase Storage (e.g., "schools/{schoolId}/materials").
 * @returns The download URL of the uploaded file, or null if an error occurs.
 */
export const uploadFileToStorageService = async (file: File, path: string): Promise<string | null> => {
  if (!file || !path) return null;

  try {
    // Create a unique filename to avoid overwrites, or use original if preferred with caution
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}${fileExtension ? '.' + fileExtension : ''}`;
    const storageRef = ref(storage, `${path}/${uniqueFileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    return null;
  }
};