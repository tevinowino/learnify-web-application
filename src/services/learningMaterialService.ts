
import { doc, collection, query, where, getDocs, addDoc, Timestamp, orderBy, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LearningMaterial, LearningMaterialWithTeacherInfo, LearningMaterialType } from '@/types';
import type { getUserProfileService as GetUserProfileServiceType } from './userService';
import type { getClassDetailsService as GetClassDetailsServiceType } from './classService';


export const addLearningMaterialService = async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    // Create a new object for Firestore, excluding any fields that are undefined.
    const dataToSave: any = {
      title: materialData.title,
      content: materialData.content,
      materialType: materialData.materialType,
      schoolId: materialData.schoolId,
      teacherId: materialData.teacherId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (materialData.classId !== undefined) {
      dataToSave.classId = materialData.classId;
    }
    if (materialData.subjectId !== undefined) {
      dataToSave.subjectId = materialData.subjectId;
    }
    if (materialData.attachmentUrl !== undefined) {
      dataToSave.attachmentUrl = materialData.attachmentUrl;
    } else if (materialData.materialType === 'pdf_upload' && materialData.content.startsWith('[Uploaded File:')) {
      // If attachmentUrl is undefined but it's a pdf_upload with placeholder content, use content as attachmentUrl
      dataToSave.attachmentUrl = materialData.content;
    }


    const docRef = await addDoc(collection(db, "learningMaterials"), dataToSave);
    await updateDoc(doc(db, "learningMaterials", docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding learning material in service:", error);
    return null;
  }
};

export const getLearningMaterialsByTeacherService = async (teacherId: string, classId?: string): Promise<LearningMaterial[]> => {
  if (!teacherId) return [];
  try {
    const materialsRef = collection(db, "learningMaterials");
    let q;
    if (classId) {
      q = query(materialsRef, where("teacherId", "==", teacherId), where("classId", "==", classId));
    } else {
      q = query(materialsRef, where("teacherId", "==", teacherId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningMaterial));
  } catch (error) {
    console.error("Error fetching learning materials by teacher in service:", error);
    return [];
  }
};

export const getLearningMaterialsByClassService = async (classId: string): Promise<LearningMaterial[]> => {
  if (!classId) return [];
  try {
      const materialsRef = collection(db, "learningMaterials");
      const q = query(materialsRef, where("classId", "==", classId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningMaterial));
  } catch (error) {
      console.error("Error fetching materials by class in service:", error);
      return [];
  }
};

export const getLearningMaterialsBySchoolService = async (
  schoolId: string,
  getUserProfile: typeof GetUserProfileServiceType,
  getClassDetails: typeof GetClassDetailsServiceType
): Promise<LearningMaterialWithTeacherInfo[]> => {
  if (!schoolId) return [];
  try {
    const materialsRef = collection(db, "learningMaterials");
    const q = query(materialsRef, where("schoolId", "==", schoolId));
    const querySnapshot = await getDocs(q);
    
    const materialsPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const material = { id: docSnapshot.id, ...docSnapshot.data() } as LearningMaterial;
      let teacherDisplayName = 'N/A';
      let className = 'General';
      if (material.teacherId) {
        const teacherProfile = await getUserProfile(material.teacherId);
        teacherDisplayName = teacherProfile?.displayName || 'N/A';
      }
      if (material.classId) {
          const classInfo = await getClassDetails(material.classId, getUserProfile); 
          className = classInfo?.name || 'Unknown Class';
      }
      return { ...material, teacherDisplayName, className };
    });
    return Promise.all(materialsPromises);
  } catch (error) {
    console.error("Error fetching learning materials by school in service:", error);
    return [];
  }
};

export const deleteLearningMaterialService = async (materialId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "learningMaterials", materialId));
    return true;
  } catch (error) {
    console.error("Error deleting learning material in service:", error);
    return false;
  }
};

export const updateLearningMaterialService = async (
  materialId: string,
  data: Partial<Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId'>>
): Promise<boolean> => {
  try {
    const materialRef = doc(db, "learningMaterials", materialId);
    // Create a clean object for Firestore, ensuring no undefined values are passed.
    // If a field is intended to be removed, it should be passed as `null` from the component.
    const cleanData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = (data as any)[key];
        if (value !== undefined) {
          cleanData[key] = value;
        }
      }
    }
    
    await updateDoc(materialRef, { ...cleanData, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    console.error("Error updating learning material in service:", error);
    return false;
  }
};

export const getLearningMaterialByIdService = async (materialId: string): Promise<LearningMaterial | null> => {
  try {
    const materialRef = doc(db, "learningMaterials", materialId);
    const materialSnap = await getDoc(materialRef);
    return materialSnap.exists() ? { id: materialSnap.id, ...materialSnap.data() } as LearningMaterial : null;
  } catch (error) {
    console.error("Error fetching learning material by ID in service:", error);
    return null;
  }
};
