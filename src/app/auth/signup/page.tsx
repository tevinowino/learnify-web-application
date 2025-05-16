
import AuthForm from '@/components/auth/AuthForm';
import Logo from '@/components/shared/Logo';
import { Card, CardContent } from '@/components/ui/card';
import React, { Suspense } from 'react'; // Import Suspense
import Loader from '@/components/shared/Loader'; // A fallback for Suspense

export const metadata = {
  title: 'Sign Up',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <Suspense fallback={<div className="flex justify-center items-center h-64 pt-10"><Loader message="Loading form..." /></div>}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
