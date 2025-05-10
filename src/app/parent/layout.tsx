"use client";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import type { UserRole } from '@/types';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  // Assuming 'parent' role will be added to UserRole type
  return (
    <ProtectedRoute allowedRoles={['parent' as UserRole]}>
      <DashboardLayout userRole="parent">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
