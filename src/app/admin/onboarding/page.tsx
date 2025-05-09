"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SchoolIcon, UserPlusIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminOnboardingPage() {
  const { currentUser, createSchool, joinSchoolWithInviteCode, loading: authLoading, checkAdminOnboardingStatus } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
       if(!authLoading) router.push('/auth/login'); // Not an admin or not logged in
       return;
    }

    const checkStatus = async () => {
      setCheckingStatus(true);
      const { isOnboarded } = await checkAdminOnboardingStatus();
      if (isOnboarded) {
        router.push('/admin/dashboard');
      }
      setCheckingStatus(false);
    };
    checkStatus();
  }, [currentUser, router, authLoading, checkAdminOnboardingStatus]);


  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !schoolName) return;
    setIsSubmitting(true);
    const schoolId = await createSchool(schoolName, currentUser.uid);
    setIsSubmitting(false);
    if (schoolId) {
      toast({ title: "School Created!", description: `School "${schoolName}" has been successfully created.` });
      router.push('/admin/dashboard');
    } else {
      toast({ title: "Error", description: "Failed to create school. Please try again.", variant: "destructive" });
    }
  };

  const handleJoinSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inviteCode) return;
    setIsSubmitting(true);
    const success = await joinSchoolWithInviteCode(inviteCode, currentUser.uid);
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Joined School!", description: "Successfully joined the school." });
      router.push('/admin/dashboard');
    } else {
      toast({ title: "Error", description: "Failed to join school. Invalid invite code or an error occurred.", variant: "destructive" });
    }
  };
  
  const isLoading = authLoading || isSubmitting || checkingStatus;

  if (isLoading && (!currentUser || currentUser.role !== 'admin')) { // Show loader if auth is still loading or if user is not admin yet
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (checkingStatus) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Checking onboarding status...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome, Admin!</CardTitle>
          <CardDescription>Let's get your school set up on Learnify.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create"><SchoolIcon className="mr-2 h-4 w-4 inline-block"/>Create School</TabsTrigger>
              <TabsTrigger value="join"><UserPlusIcon className="mr-2 h-4 w-4 inline-block"/>Join School</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="mt-6">
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-foreground mb-1">School Name</label>
                  <Input
                    id="schoolName"
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g., Springfield Elementary"
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isLoading || !schoolName.trim()}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create School
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="join" className="mt-6">
              <form onSubmit={handleJoinSchool} className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground mb-1">Invite Code</label>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground button-shadow" disabled={isLoading || !inviteCode.trim()}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Join with Code
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            If you don't have an invite code and aren't creating a new school, please contact your school administrator.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
