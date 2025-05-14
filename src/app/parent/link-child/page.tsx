
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Loader from '@/components/shared/Loader'; 
import Logo from '@/components/shared/Logo';

export default function LinkChildPage() {
  const { currentUser, linkChildAccount, loading: authLoading } = useAuth(); 
  const { toast } = useToast();
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !currentUser) return;
    setIsSubmitting(true);
    const success = await linkChildAccount(studentId); 
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Account Linked!", description: "You can now view your child's progress." });
      router.push('/parent/dashboard');
    } else {
      // Specific error toasts are handled within linkChildAccount, but a general one can be here if needed.
      // toast({ title: "Linking Failed", description: "Invalid Student ID or an error occurred.", variant: "destructive" });
    }
  };

  if (authLoading && !currentUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message="Loading..." size="large" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-xl card-shadow">
        <CardHeader className="text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-2xl">Link to Your Child's Account</CardTitle>
          <CardDescription>Enter your child's unique Student ID to connect accounts and view their academic progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-foreground mb-1">Student ID</label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Child's Student ID"
                required
                disabled={isSubmitting || authLoading}
                className="text-center tracking-wider"
              />
               <p className="text-xs text-muted-foreground mt-1 text-center">This is usually their unique user ID provided by the school.</p>
            </div>
            <Button type="submit" className="w-full button-shadow bg-primary hover:bg-primary/90" disabled={isSubmitting || !studentId.trim() || authLoading}>
              {isSubmitting && <Loader size="small" className="mr-2" />}
              Link Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

