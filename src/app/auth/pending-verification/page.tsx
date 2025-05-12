
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Logo from '@/components/shared/Logo';

export default function PendingVerificationPage() {
  const { logOut, currentUser } = useAuth();
  const router = useRouter();

  const handleLogoutAndHome = async () => {
    await logOut();
    // router.push('/'); // logOut in AuthProvider already redirects to home
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-xl card-shadow">
        <CardHeader className="items-center text-center">
          <MailCheck className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl">Account Pending Verification</CardTitle>
          <CardDescription>
            Thank you for signing up, {currentUser?.displayName || "user"}!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your account request to join {currentUser?.schoolName ? `"${currentUser.schoolName}"` : 'your school'} has been sent. 
            It needs to be approved by a school administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            You will be able to log in and access your dashboard once your account is approved. Please check back later or contact your school admin.
          </p>
          <Button onClick={handleLogoutAndHome} className="w-full button-shadow">
            Log Out & Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
