"use client";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import type { UserRole } from '@/types';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['student' as UserRole]}>
      <DashboardLayout userRole="student">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
