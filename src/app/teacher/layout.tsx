"use client";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import type { UserRole } from '@/types';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['teacher' as UserRole]}>
      <DashboardLayout userRole="teacher">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
