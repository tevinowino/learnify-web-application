
"use client";

import React from 'react';
import Logo from '@/components/shared/Logo';
import { Progress } from '@/components/ui/progress';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const onboardingSteps = [
  { path: '/admin/onboarding-flow/create-school', title: 'Step 1: Create Your School', progress: 0 },
  { path: '/admin/onboarding-flow/add-subjects', title: 'Step 2: Add School Subjects', progress: 20 },
  { path: '/admin/onboarding-flow/create-classes', title: 'Step 3: Create Initial Classes', progress: 40 },
  { path: '/admin/onboarding-flow/invite-users', title: 'Step 4: Invite Initial Users', progress: 60 },
  { path: '/admin/onboarding-flow/configure-settings', title: 'Step 5: Final Configuration', progress: 80 },
];

export default function AdminOnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const currentStepDetails = onboardingSteps.find(step => pathname.startsWith(step.path));
  const progressValue = currentUser?.onboardingStep !== null && currentUser?.onboardingStep !== undefined 
                        ? onboardingSteps.find(s => s.path.includes(onboardingSteps[currentUser.onboardingStep!].path))?.progress ?? 0
                        : (pathname === '/admin/onboarding-flow/create-school' ? 0 : 100);


  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8 sm:py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-2xl space-y-6">
        {currentStepDetails && (
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{currentStepDetails.title}</h1>
            <Progress value={progressValue} className="w-full h-2.5" />
            <p className="text-sm text-muted-foreground">
                {currentStepDetails.progress < 100 ? `Progress: ${progressValue}%` : "Finalizing..."}
            </p>
          </div>
        )}
        <main>{children}</main>
      </div>
       <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Learnify. All rights reserved.</p>
        <p>Follow the steps to get your school set up and running smoothly.</p>
      </footer>
    </div>
  );
}
