"use client";

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext';

/**
 * Custom hook to access the authentication context.
 * The `loading` state provided by this hook now specifically indicates
 * the loading status of authentication processes (e.g., initial auth check, login, signup, logout).
 * For loading states related to data fetching, use the `isLoading` property from specific dashboard hooks
 * (e.g., useStudentDashboard, useAdminDashboard) or manage local loading states in components.
 * @returns The authentication context.
 * @throws Error if used outside of an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

