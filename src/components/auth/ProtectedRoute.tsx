
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation'; 
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import type { UserProfile, UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

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
      if (pathname !== '/student/onboarding') {
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
      else if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0)) defaultDashboard = '/student/onboarding'; // Should be caught by above
      router.replace(defaultDashboard);
    }
  }, [currentUser, loading, router, allowedRoles, pathname]);


  if (loading || (!currentUser && pathname !== '/auth/login' && pathname !== '/auth/signup')) { // Allow login/signup pages during loading
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser) return null; // Should be redirected by useEffect

  if (currentUser.status === 'pending_verification') {
    return pathname === '/auth/pending-verification' ? <>{children}</> : (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
     return pathname === '/student/onboarding' ? <>{children}</> : (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
