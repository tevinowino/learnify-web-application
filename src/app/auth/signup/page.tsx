
import AuthForm from '@/components/auth/AuthForm';
import Logo from '@/components/shared/Logo';
import { Card, CardContent } from '@/components/ui/card';
import React, { Suspense } from 'react'; 
import Loader from '@/components/shared/Loader'; 
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

export const metadata: Metadata = {
  title: `Sign Up for ${siteConfig.name}`,
  description: `Create your account on ${siteConfig.name}. Join as an admin, teacher, student, or parent to access our AI-powered educational platform.`,
  keywords: ["Learnify signup", "create school account", "education platform registration", "AI learning signup", "join Learnify"],
  alternates: {
    canonical: '/auth/signup',
  },
  openGraph: {
    title: `Sign Up - ${siteConfig.name}`,
    description: `Join ${siteConfig.name} today and transform your educational experience with AI.`,
    url: `${APP_URL}/auth/signup`,
  },
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
