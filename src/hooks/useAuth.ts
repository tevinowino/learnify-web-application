"use client";

import { useContext } from 'react';
// This file is a convention, but the actual useAuth hook is defined within AuthContext.tsx
// to avoid circular dependencies and keep related logic together.
// For this project, useAuth is exported directly from '@/contexts/AuthContext'.
// This file can be removed if not adding further auth-related hooks.

// If you prefer a separate file for the hook:
// import { AuthContext } from '@/contexts/AuthContext'; // Assuming AuthContext is exported
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// For now, let's re-export from AuthContext to satisfy component imports
export { useAuth } from '@/contexts/AuthContext';
