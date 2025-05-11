
"use client";

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext';

/**
 * Custom hook to access the authentication context.
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

