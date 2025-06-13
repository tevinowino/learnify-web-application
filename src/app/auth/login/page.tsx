
import AuthForm from '@/components/auth/AuthForm';
import Logo from '@/components/shared/Logo';
import { Card, CardContent } from '@/components/ui/card';
import React, { Suspense } from 'react'; 
import Loader from '@/components/shared/Loader'; 
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

export const metadata: Metadata = {
  title: `Login to ${siteConfig.name}`,
  description: `Access your ${siteConfig.name} dashboard. Log in as an admin, teacher, student, or parent to manage your educational activities.`,
  keywords: ["Learnify login", "education platform login", "school account access", "AI learning login"],
  alternates: {
    canonical: '/auth/login',
  },
  openGraph: {
    title: `Login - ${siteConfig.name}`,
    description: `Securely log in to your ${siteConfig.name} account.`,
    url: `${APP_URL}/auth/login`,
  },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
       <div className="mb-8 text-center">
        <Logo />
      </div>
      <Suspense fallback={<div className="flex justify-center items-center h-64 pt-10"><Loader message="Loading form..." /></div>}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
