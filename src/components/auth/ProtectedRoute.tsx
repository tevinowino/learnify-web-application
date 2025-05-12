
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation'; 
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import type { UserProfile, UserRole } from '@/types';
import Loader from '@/components/shared/Loader'; // Import new Loader

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); 

  useEffect(() => {
    if (loading) return; 

    if (!currentUser) {
      const loginPath = `/auth/login?redirectTo=${encodeURIComponent(pathname)}`;
      router.replace(loginPath);
      return;
    }

    if (currentUser.status === 'pending_verification') {
      if (pathname !== '/auth/pending-verification') {
        router.replace('/auth/pending-verification');
      }
      return; 
    }
    
    if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
      // Allow access to profile page during onboarding for name updates
      if (pathname !== '/student/onboarding' && pathname !== '/student/profile') {
        router.replace('/student/onboarding');
        return;
      }
    }
    
    if (!allowedRoles.includes(currentUser.role)) {
      let defaultDashboard = '/';
      if (currentUser.role === 'admin' && currentUser.schoolId) defaultDashboard = '/admin/dashboard';
      else if (currentUser.role === 'admin' && !currentUser.schoolId) defaultDashboard = '/admin/onboarding';
      else if (currentUser.role === 'teacher') defaultDashboard = '/teacher/dashboard';
      else if (currentUser.role === 'student' && currentUser.classIds && currentUser.classIds.length > 0) defaultDashboard = '/student/dashboard';
      // This case for student without classes should be caught by the onboarding redirect above
      else if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0)) defaultDashboard = '/student/onboarding';
      router.replace(defaultDashboard);
    }
  }, [currentUser, loading, router, allowedRoles, pathname]);


  if (loading || (!currentUser && pathname !== '/auth/login' && pathname !== '/auth/signup')) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
       <Loader message="Authenticating..." size="large" />
      </div>
    );
  }
  
  if (!currentUser) return null;

  if (currentUser.status === 'pending_verification') {
    return pathname === '/auth/pending-verification' ? <>{children}</> : (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Checking verification..." size="large" />
      </div>
    );
  }

  if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
     if (pathname === '/student/onboarding' || pathname === '/student/profile') {
         return <>{children}</>;
     }
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader message="Redirecting to onboarding..." size="large" />
        </div>
     );
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Verifying access..." size="large" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
