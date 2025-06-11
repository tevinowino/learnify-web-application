
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
    
    // Admin Onboarding Flow Logic
    if (currentUser.role === 'admin') {
      const currentOnboardingStep = currentUser.onboardingStep;
      const isOnboardingPath = pathname.startsWith('/admin/onboarding-flow');

      if (currentOnboardingStep !== null && currentOnboardingStep !== undefined) { // Steps 0-4
        const expectedPath = onboardingStepPaths[currentOnboardingStep];
        
        if (expectedPath) {
          if (pathname !== expectedPath) {
            // If admin has an active onboarding step but is not on the correct page for that step, redirect them.
            router.replace(expectedPath);
            return; 
          }
          // If they are on the correct onboarding step page, allow rendering.
          return; 
        } else {
          // Should not happen if onboardingStep is a valid 0-4. Fallback: redirect to first step.
          router.replace(onboardingStepPaths[0]);
          return;
        }
      } else { // Onboarding is complete (onboardingStep is null or undefined)
        if (isOnboardingPath) {
          // If onboarding is complete, but they are trying to access an onboarding URL, redirect to dashboard.
          router.replace('/admin/dashboard');
          return;
        }
      }
    }

    // Student Onboarding Flow Logic
    if (currentUser.role === 'student' && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
      if (pathname !== '/student/onboarding' && pathname !== '/student/profile') { // Allow access to profile during student onboarding too
        router.replace('/student/onboarding');
        return;
      }
       // If on student onboarding or profile, allow rendering
      if (pathname === '/student/onboarding' || pathname === '/student/profile') {
        return;
      }
    }
    
    // General Role-based access for main app sections (after onboarding checks)
    if (!allowedRoles.includes(currentUser.role)) {
      let defaultDashboard = '/';
      if (currentUser.role === 'admin') defaultDashboard = '/admin/dashboard';
      else if (currentUser.role === 'teacher') defaultDashboard = '/teacher/dashboard';
      else if (currentUser.role === 'student') defaultDashboard = '/student/dashboard';
      else if (currentUser.role === 'parent') defaultDashboard = '/parent/dashboard';
      router.replace(defaultDashboard);
      return;
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
     if (pathname === expectedPath) { // Only render if on the correct onboarding page
       return <>{children}</>;
     }
     // If not on the expected path, the useEffect will redirect, show loader in meantime.
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
     // If not on student onboarding page, useEffect will redirect.
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader message="Redirecting to student onboarding..." size="large" />
        </div>
     );
  }
  
  // Check if the user's role is allowed for the current route (after onboarding checks)
  if (!allowedRoles.includes(currentUser.role)) {
     // The useEffect should have already redirected. This is a fallback loading state.
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Verifying access..." size="large" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
