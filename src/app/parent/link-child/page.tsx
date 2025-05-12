
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function LinkChildPage() {
  const { currentUser, linkChildAccount } = useAuth(); 
  const { toast } = useToast();
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !currentUser) return;
    setIsSubmitting(true);
    // TODO: Implement actual service call for linkChildAccount
    // const success = await linkChildAccount(currentUser.uid, studentId); 
    const success = true; // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API Call
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Account Linked!", description: "You can now view your child's progress." });
      router.push('/parent/dashboard');
    } else {
      toast({ title: "Linking Failed", description: "Invalid Student ID or an error occurred.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><LinkIcon className="mr-2 h-5 w-5 text-primary"/>Link to Your Child's Account</CardTitle>
          <CardDescription>Enter your child's unique Student ID to connect accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-foreground mb-1">Student ID</label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID"
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full button-shadow" disabled={isSubmitting || !studentId.trim()}>
              {isSubmitting && <Loader size="small" className="mr-2" />}
              Link Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
