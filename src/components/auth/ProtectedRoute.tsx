
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
       // Allow access to auth pages even if not logged in
      if (!pathname.startsWith('/auth/') && pathname !== '/' && !pathname.startsWith('/about') && !pathname.startsWith('/contact') && !pathname.startsWith('/privacy') && !pathname.startsWith('/terms')) {
          const loginPath = `/auth/login?redirectTo=${encodeURIComponent(pathname)}`;
          router.replace(loginPath);
      }
      return;
    }


    if (currentUser.status === 'pending_verification') {
      if (pathname !== '/auth/pending-verification') {
        router.replace('/auth/pending-verification');
      }
      return; 
    }
    
    // Admin Onboarding Flow Logic
    if (currentUser.role === 'admin') {
      const currentOnboardingStep = currentUser.onboardingStep;
      const isOnboardingPath = pathname.startsWith('/admin/onboarding-flow');

      if (currentOnboardingStep !== null && currentOnboardingStep !== undefined) { // Steps 0-4
        const expectedPath = onboardingStepPaths[currentOnboardingStep];
        
        if (expectedPath) {
          if (pathname !== expectedPath) {
            router.replace(expectedPath);
            return; 
          }
          return; 
        } else {
          router.replace(onboardingStepPaths[0]);
          return;
        }
      } else { 
        if (isOnboardingPath) {
          router.replace('/admin/dashboard');
          return;
        }
      }
    }

    // Student Onboarding Flow Logic
    if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
      if (pathname !== '/student/onboarding' && pathname !== '/student/profile') { 
        router.replace('/student/onboarding');
        return;
      }
      if (pathname === '/student/onboarding' || pathname === '/student/profile') {
        return;
      }
    }
    
    // General Role-based access for main app sections
    let canAccess = false;
    if (allowedRoles.includes('admin') && (currentUser.role === 'admin' || (currentUser.role === 'teacher' && currentUser.isAdminAlso === true))) {
        canAccess = true;
    } else if (allowedRoles.includes(currentUser.role!)) { // Added ! to assert role is not null here
        canAccess = true;
    }

    if (!canAccess) {
      let defaultDashboard = '/';
      if (currentUser.role === 'admin') defaultDashboard = '/admin/dashboard';
      else if (currentUser.role === 'teacher') defaultDashboard = '/teacher/dashboard';
      else if (currentUser.role === 'student') defaultDashboard = '/student/dashboard';
      else if (currentUser.role === 'parent') defaultDashboard = '/parent/dashboard';
      router.replace(defaultDashboard);
      return;
    }

  }, [currentUser, loading, router, allowedRoles, pathname]);


  if (loading || (!currentUser && !pathname.startsWith('/auth/') && pathname !== '/' && !pathname.startsWith('/about') && !pathname.startsWith('/contact') && !pathname.startsWith('/privacy') && !pathname.startsWith('/terms'))) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
       <Loader message="Authenticating..." size="large" />
      </div>
    );
  }
  
  if (!currentUser && (pathname.startsWith('/auth/') || pathname === '/' || pathname.startsWith('/about') || pathname.startsWith('/contact') || pathname.startsWith('/privacy') || pathname.startsWith('/terms'))) {
    return <>{children}</>; 
  }
  
  if (!currentUser) return null; 

  if (currentUser.status === 'pending_verification') {
    return pathname === '/auth/pending-verification' ? <>{children}</> : (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Checking verification..." size="large" />
      </div>
    );
  }

  // Admin Onboarding UI specific checks (already handled by useEffect redirects if needed)
  if (currentUser.role === 'admin' && currentUser.onboardingStep !== null && currentUser.onboardingStep !== undefined) {
     const expectedPath = onboardingStepPaths[currentUser.onboardingStep];
     if (pathname === expectedPath) { 
       return <>{children}</>;
     }
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader message="Navigating to onboarding step..." size="large" />
        </div>
     );
  }

  // Student Onboarding UI specific checks
  if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
     if (pathname === '/student/onboarding' || pathname === '/student/profile') {
         return <>{children}</>;
     }
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader message="Redirecting to student onboarding..." size="large" />
        </div>
     );
  }
  
  let canAccessCurrentPage = false;
  if (allowedRoles.includes('admin') && (currentUser.role === 'admin' || (currentUser.role === 'teacher' && currentUser.isAdminAlso === true))) {
      canAccessCurrentPage = true;
  } else if (currentUser.role && allowedRoles.includes(currentUser.role)) {
      canAccessCurrentPage = true;
  }

  if (!canAccessCurrentPage) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Verifying access..." size="large" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
