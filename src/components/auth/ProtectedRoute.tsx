"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import type { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/auth/login');
    } else if (!loading && currentUser && !allowedRoles.includes(currentUser.role)) {
      // If role not allowed, redirect to a generic dashboard or home
      // This logic can be more sophisticated, e.g. redirect to their own dashboard
      router.replace('/'); 
    }
  }, [currentUser, loading, router, allowedRoles]);

  if (loading || !currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
