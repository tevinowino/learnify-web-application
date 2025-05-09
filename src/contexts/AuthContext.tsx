"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/types';
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
          // This case might happen if user doc creation failed or is delayed
          // For now, treat as no role, or try to create a default one if needed
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
    try {
      setLoading(true);
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
    try {
      setLoading(true);
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
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/'); // Redirect to home after logout
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
      const schoolData = {
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

      // Update current user state
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
      
      // Update current user state
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
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists() && userDocSnap.data().schoolId) {
      return { isOnboarded: true, schoolId: userDocSnap.data().schoolId };
    }
    return { isOnboarded: false };
  };


  return (
    <AuthContext.Provider value={{ currentUser, loading, signUp, logIn, logOut, createSchool, joinSchoolWithInviteCode, checkAdminOnboardingStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
