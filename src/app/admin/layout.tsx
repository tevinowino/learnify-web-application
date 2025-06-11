"use client";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import type { UserRole } from '@/types';
import { usePathname } from 'next/navigation'; // Import usePathname

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get the current path
  const isOnboardingFlow = pathname.startsWith('/admin/onboarding-flow');

  return (
    <ProtectedRoute allowedRoles={['admin' as UserRole]}>
      {isOnboardingFlow ? (
        <>{children}</> // Onboarding flow has its own layout, don't wrap with DashboardLayout
      ) : (
        <DashboardLayout userRole="admin">
          {children}
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
