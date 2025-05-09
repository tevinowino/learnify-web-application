"use client";

import type { ReactNode }from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole, School, LearningMaterial, UserProfileWithId } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signUp: (email: string, pass: string, role: UserRole, displayName: string) => Promise<UserProfile | null>;
  logIn: (email: string, pass: string) => Promise<UserProfile | null>;
  logOut: () => Promise<void>;
  createSchool: (schoolName: string, adminId: string) => Promise<string | null>; // Returns schoolId or null
  joinSchoolWithInviteCode: (inviteCode: string, userId: string) => Promise<boolean>;
  checkAdminOnboardingStatus: () => Promise<{ isOnboarded: boolean; schoolId?: string }>;
  getUsersBySchool: (schoolId: string) => Promise<UserProfileWithId[]>;
  getSchoolDetails: (schoolId: string) => Promise<School | null>;
  regenerateInviteCode: (schoolId: string) => Promise<string | null>;
  addLearningMaterial: (material: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  getLearningMaterialsBySchool: (schoolId: string) => Promise<LearningMaterial[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            ...user,
            displayName: userData.displayName || user.displayName,
            email: userData.email || user.email,
            uid: user.uid,
            role: userData.role as UserRole,
            schoolId: userData.schoolId,
          } as UserProfile);
        } else {
          setCurrentUser({ ...user, role: null } as UserProfile);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string, role: UserRole, displayName: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser) {
        const userProfileData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          role: role,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
        const profile: UserProfile = { ...firebaseUser, ...userProfileData } as UserProfile;
        setCurrentUser(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error("Error signing up:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const profile: UserProfile = {
            ...firebaseUser,
            displayName: userData.displayName || firebaseUser.displayName,
            email: userData.email || firebaseUser.email,
            uid: firebaseUser.uid,
            role: userData.role as UserRole,
            schoolId: userData.schoolId,
          } as UserProfile;
          setCurrentUser(profile);
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/'); 
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSchool = async (schoolName: string, adminId: string): Promise<string | null> => {
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const schoolRef = doc(collection(db, "schools"));
      const schoolData: School = {
        name: schoolName,
        adminId: adminId,
        inviteCode: inviteCode,
        id: schoolRef.id,
      };
      
      const batch = writeBatch(db);
      batch.set(schoolRef, schoolData);
      
      const userRef = doc(db, "users", adminId);
      batch.update(userRef, { schoolId: schoolRef.id });
      
      await batch.commit();

      if (currentUser && currentUser.uid === adminId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolRef.id }) : null);
      }
      
      return schoolRef.id;
    } catch (error) {
      console.error("Error creating school:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinSchoolWithInviteCode = async (inviteCode: string, userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const schoolsRef = collection(db, "schools");
      const q = query(schoolsRef, where("inviteCode", "==", inviteCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("Invalid invite code");
        return false;
      }

      const schoolDoc = querySnapshot.docs[0];
      const schoolId = schoolDoc.id;

      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { schoolId: schoolId }, { merge: true });
      
      if (currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? ({ ...prev, schoolId: schoolId }) : null);
      }

      return true;
    } catch (error) {
      console.error("Error joining school:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const checkAdminOnboardingStatus = async (): Promise<{ isOnboarded: boolean; schoolId?: string }> => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { isOnboarded: false };
    }
    // Re-fetch to ensure freshness, currentUser might be stale if schoolId was just set
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists() && userDocSnap.data().schoolId) {
      // also update currentUser state if it's different
      const schoolId = userDocSnap.data().schoolId;
      if (currentUser.schoolId !== schoolId) {
        setCurrentUser(prev => prev ? { ...prev, schoolId } : null);
      }
      return { isOnboarded: true, schoolId: schoolId };
    }
    return { isOnboarded: false };
  };

  const getUsersBySchool = async (schoolId: string): Promise<UserProfileWithId[]> => {
    if (!schoolId) return [];
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("schoolId", "==", schoolId));
      const querySnapshot = await getDocs(q);
      const users: UserProfileWithId[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfileWithId);
      });
      return users;
    } catch (error) {
      console.error("Error fetching users by school:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSchoolDetails = async (schoolId: string): Promise<School | null> => {
    if (!schoolId) return null;
    setLoading(true);
    try {
      const schoolRef = doc(db, "schools", schoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        return schoolSnap.data() as School;
      }
      return null;
    } catch (error) {
      console.error("Error fetching school details:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const regenerateInviteCode = async (schoolId: string): Promise<string | null> => {
    if (!schoolId || (currentUser && currentUser.role !== 'admin')) return null;
    setLoading(true);
    try {
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const schoolRef = doc(db, "schools", schoolId);
      await updateDoc(schoolRef, { inviteCode: newInviteCode });
      return newInviteCode;
    } catch (error) {
      console.error("Error regenerating invite code:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addLearningMaterial = async (materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "learningMaterials"), {
        ...materialData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding learning material:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLearningMaterialsBySchool = async (schoolId: string): Promise<LearningMaterial[]> => {
    if (!schoolId) return [];
    setLoading(true);
    try {
      const materialsRef = collection(db, "learningMaterials");
      const q = query(materialsRef, where("schoolId", "==", schoolId), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const materials: LearningMaterial[] = [];
      querySnapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() } as LearningMaterial);
      });
      return materials;
    } catch (error) {
      console.error("Error fetching learning materials:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    logIn,
    logOut,
    createSchool,
    joinSchoolWithInviteCode,
    checkAdminOnboardingStatus,
    getUsersBySchool,
    getSchoolDetails,
    regenerateInviteCode,
    addLearningMaterial,
    getLearningMaterialsBySchool,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
