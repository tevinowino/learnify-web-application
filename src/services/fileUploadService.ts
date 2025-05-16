import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames, keep if you want unique names, Cloudinary also provides unique public_ids

/**
 * Uploads a file to Cloudinary and returns its secure URL, original filename, and public ID.
 * @param file The file to upload.
 * @returns An object containing the secure URL, original filename, and public ID of the uploaded file, or null if an error occurs.
 */
export const uploadFileToCloudinaryService = async (
  file: File
): Promise<{ url: string | null; originalFileName: string | null; publicId: string | null }> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!file) {
    console.error("No file provided for upload.");
    return { url: null, originalFileName: null, publicId: null };
  }

  if (!cloudName || !uploadPreset) {
    console.error(
      "Cloudinary cloud name or upload preset is not configured in environment variables."
    );
    return { url: null, originalFileName: null, publicId: null };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  // Optionally, you can add tags, folders, etc.
  // formData.append('folder', 'learnify_uploads'); 

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary upload error:", errorData.error.message);
      return { url: null, originalFileName: file.name, publicId: null };
    }

    const data = await response.json();
    return { url: data.secure_url, originalFileName: file.name, publicId: data.public_id };
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return { url: null, originalFileName: file.name, publicId: null };
  }
};
