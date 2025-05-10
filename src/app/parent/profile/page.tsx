"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle, Save, KeyRound, Mail, LinkIcon as LinkChildIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ParentProfilePage() {
  const { currentUser, updateUserDisplayName, loading: authLoading } = useAuth(); // Assuming email/pass update functions exist
  const { toast } = useToast();
  
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  // Add states for email/password update if implementing full flow
  // const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  // const [newEmail, setNewEmail] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({ displayName: currentUser.displayName || "" });
      // setNewEmail(currentUser.email || '');
    }
  }, [currentUser, form]);

  const handleUpdateDisplayName = async (data: ProfileFormValues) => {
    if (!currentUser) return;
    setIsSubmittingName(true);
    const success = await updateUserDisplayName(currentUser.uid, data.displayName);
    if (success) {
      toast({ title: "Success", description: "Display name updated successfully." });
      form.reset({ displayName: data.displayName }, { keepValues: true }); 
    } else {
      toast({ title: "Error", description: "Failed to update display name.", variant: "destructive" });
    }
    setIsSubmittingName(false);
  };
  
  if (authLoading && !currentUser) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
    return <div className="p-4 text-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/> Personal Information</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleUpdateDisplayName)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground">Display Name</label>
              <Input id="displayName" {...form.register("displayName")} />
              {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
                <label htmlFor="email_display" className="block text-sm font-medium text-foreground">Email (Display Only)</label>
                <Input id="email_display" value={currentUser.email || ""} readOnly className="bg-muted/50"/>
            </div>
            <Button type="submit" disabled={isSubmittingName || !form.formState.isDirty} className="button-shadow w-full sm:w-auto">
              {isSubmittingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Display Name
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
            <CardTitle className="flex items-center"><LinkChildIcon className="mr-2 h-5 w-5 text-primary"/>Linked Child Account</CardTitle>
            <CardDescription>Manage the link to your child's account.</CardDescription>
        </CardHeader>
         <CardContent>
            {currentUser.childStudentId ? (
                <p className="text-sm text-muted-foreground">Currently linked to student ID: <span className="font-semibold text-foreground">{currentUser.childStudentId}</span></p>
                // Add option to unlink or change linked child if needed
            ) : (
                <p className="text-sm text-muted-foreground">
                    No child account linked. 
                    <Button variant="link" asChild className="p-0 ml-1">
                        <Link href="/parent/link-child">Link your child's account now.</Link>
                    </Button>
                </p>
            )}
        </CardContent>
      </Card>
      
      <Card className="card-shadow">
        <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>For email or password changes, please contact support or use your provider's account management tools if applicable.</CardDescription>
        </CardHeader>
         <CardContent>
            <p className="text-sm text-muted-foreground">
                If you signed up directly with an email and password on this platform, password reset options might be available through the login page if you forget your password.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
