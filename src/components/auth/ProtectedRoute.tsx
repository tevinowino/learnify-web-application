
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation'; 
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import type { UserProfile, UserRole } from '@/types';
import Loader from '@/components/shared/Loader'; 

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const onboardingStepPaths: Record<number, string> = {
  0: '/admin/onboarding-flow/create-school',
  1: '/admin/onboarding-flow/add-subjects',
  2: '/admin/onboarding-flow/create-classes',
  3: '/admin/onboarding-flow/invite-users',
  4: '/admin/onboarding-flow/configure-settings',
};

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
    
    // Admin Onboarding Flow
    if (currentUser.role === 'admin' && currentUser.onboardingStep !== null && currentUser.onboardingStep !== undefined) {
      const expectedPath = onboardingStepPaths[currentUser.onboardingStep];
      if (expectedPath && pathname !== expectedPath) {
        router.replace(expectedPath);
        return;
      }
      // If on the correct onboarding step page, allow rendering
      if (pathname.startsWith('/admin/onboarding-flow')) {
        return;
      }
    } else if (currentUser.role === 'admin' && (currentUser.onboardingStep === null || currentUser.onboardingStep === undefined) && pathname.startsWith('/admin/onboarding-flow')) {
      // If onboarding is complete but user tries to access onboarding URLs, redirect to dashboard
      router.replace('/admin/dashboard');
      return;
    }


    // Student Onboarding Flow
    if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
      if (pathname !== '/student/onboarding' && pathname !== '/student/profile') {
        router.replace('/student/onboarding');
        return;
      }
    }
    
    // Role-based access for main app sections
    if (!pathname.startsWith('/admin/onboarding-flow') && !pathname.startsWith('/student/onboarding') && !allowedRoles.includes(currentUser.role)) {
      let defaultDashboard = '/';
      if (currentUser.role === 'admin' && currentUser.schoolId) defaultDashboard = '/admin/dashboard';
      // Admin without schoolId is handled by onboardingStep check above
      else if (currentUser.role === 'teacher') defaultDashboard = '/teacher/dashboard';
      else if (currentUser.role === 'student' && currentUser.classIds && currentUser.classIds.length > 0) defaultDashboard = '/student/dashboard';
      else if (currentUser.role === 'parent') defaultDashboard = '/parent/dashboard';
      router.replace(defaultDashboard);
    }
  }, [currentUser, loading, router, allowedRoles, pathname]);


  if (loading || (!currentUser && !pathname.startsWith('/auth/'))) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
       <Loader message="Authenticating..." size="large" />
      </div>
    );
  }
  
  if (!currentUser && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return <>{children}</>; // Allow rendering login/signup pages
  }
  
  if (!currentUser) return null; // Should be redirected by now if not on auth pages

  if (currentUser.status === 'pending_verification') {
    return pathname === '/auth/pending-verification' ? <>{children}</> : (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Checking verification..." size="large" />
      </div>
    );
  }

  if (currentUser.role === 'admin' && currentUser.onboardingStep !== null && currentUser.onboardingStep !== undefined) {
     const expectedPath = onboardingStepPaths[currentUser.onboardingStep];
     if (pathname === expectedPath) {
       return <>{children}</>;
     }
     // If not on expected onboarding path, ProtectedRoute's useEffect should redirect.
     // Show loader while redirecting.
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader message="Navigating to onboarding..." size="large" />
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
  
  if (!allowedRoles.includes(currentUser.role) && !pathname.startsWith('/admin/onboarding-flow') && !pathname.startsWith('/student/onboarding')) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Verifying access..." size="large" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
