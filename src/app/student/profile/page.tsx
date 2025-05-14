
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Save, ShieldCheck, Copy } from 'lucide-react'; // Added ShieldCheck, Copy
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Loader from '@/components/shared/Loader'; 
import { Label } from '@/components/ui/label'; // Added Label

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function StudentProfilePage() {
  const { currentUser, updateUserDisplayName, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({ displayName: currentUser.displayName || "" });
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

  const handleCopyStudentId = () => {
    if (currentUser?.uid) {
        navigator.clipboard.writeText(currentUser.uid);
        setCopiedStudentId(true);
        toast({ title: "Copied!", description: "Student ID copied to clipboard." });
        setTimeout(() => setCopiedStudentId(false), 2000);
    }
  };
  
  if (authLoading && !currentUser) {
    return <div className="flex h-full items-center justify-center"><Loader message="Loading profile..." size="large" /></div>;
  }

  if (!currentUser) {
    return <div className="p-4 text-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/> Personal Information</CardTitle>
          <CardDescription>Update your display name. Your Student ID is shown below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(handleUpdateDisplayName)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" {...form.register("displayName")} />
              {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="email_display">Email (Display Only)</Label>
                <Input id="email_display" value={currentUser.email || ""} readOnly className="bg-muted/50"/>
            </div>
            <Button type="submit" disabled={isSubmittingName || !form.formState.isDirty} className="button-shadow">
              {isSubmittingName && <Loader size="small" className="mr-2" />}
              <Save className="mr-2 h-4 w-4" /> Save Display Name
            </Button>
          </form>
          
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="studentIdDisplay">Your Student ID (Share with Parent)</Label>
            <div className="flex items-center gap-2">
                <Input id="studentIdDisplay" value={currentUser.uid} readOnly className="bg-muted/50 flex-grow font-mono text-sm"/>
                <Button variant="outline" size="icon" onClick={handleCopyStudentId} disabled={copiedStudentId} title="Copy Student ID">
                    {copiedStudentId ? <ShieldCheck className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4"/>}
                </Button>
            </div>
          </div>
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
