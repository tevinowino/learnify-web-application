"use client";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import type { UserRole } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin' as UserRole]}>
      <DashboardLayout userRole="admin">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
