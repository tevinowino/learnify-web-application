
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SchoolIcon, UserPlusIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loader from '@/components/shared/Loader'; // Import new Loader
import Logo from '@/components/shared/Logo';

export default function AdminOnboardingPage() {
  const { currentUser, createSchool, joinSchoolWithInviteCode, loading: authLoading, checkAdminOnboardingStatus } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // if (!currentUser || currentUser.role !== 'admin') {
    //    if(!authLoading) router.push('/auth/login'); 
    //    return;
    // }

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
    if (!currentUser || !schoolName.trim()) {
      toast({ title: "Missing School Name", description: "Please enter a name for your school.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    const schoolId = await createSchool(schoolName, currentUser.uid);
    setIsSubmitting(false);
    if (schoolId) {
      toast({ title: "School Created!", description: `School "${schoolName}" has been successfully created.`, duration: 5000 });
      router.push('/admin/dashboard');
    } else {
      toast({ title: "Error", description: "Failed to create school. Please try again.", variant: "destructive" });
    }
  };

  const handleJoinSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inviteCode.trim()) {
       toast({ title: "Missing Invite Code", description: "Please enter the school's invite code.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    const success = await joinSchoolWithInviteCode(inviteCode, currentUser.uid);
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Joined School!", description: "Successfully joined the school.", duration: 5000 });
      router.push('/admin/dashboard');
    } else {
      toast({ title: "Error", description: "Failed to join school. Invalid invite code or an error occurred.", variant: "destructive" });
    }
  };
  
  const pageLoading = authLoading || checkingStatus;

  if (pageLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message={authLoading ? "Authenticating..." : "Checking onboarding status..."} size="large" />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <Card className="w-full max-w-lg shadow-xl card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">Welcome, Admin!</CardTitle>
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
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isSubmitting || !schoolName.trim()}>
                  {isSubmitting && <Loader size="small" className="mr-2" />}
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
                    placeholder="Enter school invite code"
                    required
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground button-shadow" disabled={isSubmitting || !inviteCode.trim()}>
                  {isSubmitting && <Loader size="small" className="mr-2" />}
                  Join with Code
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            If you're creating a new school, an invite code will be generated for you to share.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
