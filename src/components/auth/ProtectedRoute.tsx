
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
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
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    if (loading) return; // Wait until loading is false

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
    
    // User is active, now check role
    if (!allowedRoles.includes(currentUser.role)) {
      let defaultDashboard = '/';
      if (currentUser.role === 'admin' && currentUser.schoolId) defaultDashboard = '/admin/dashboard';
      else if (currentUser.role === 'admin' && !currentUser.schoolId) defaultDashboard = '/admin/onboarding';
      else if (currentUser.role === 'teacher') defaultDashboard = '/teacher/dashboard';
      else if (currentUser.role === 'student') defaultDashboard = '/student/dashboard';
      router.replace(defaultDashboard);
    }
  }, [currentUser, loading, router, allowedRoles, pathname]);


  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser.status === 'pending_verification') {
    // If on the pending page, render children (the pending page itself)
    // Otherwise, show loader while redirecting
    return pathname === '/auth/pending-verification' ? <>{children}</> : (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
    // Role not allowed for this page, show loader while redirecting
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

