
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle, Save, KeyRound, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
});

// Schemas for email/password update would be more complex and include currentPassword
// For simplicity, we'll handle them with separate state and basic validation here.

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
  const { currentUser, updateUserDisplayName, updateUserEmail, updateUserPassword, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  // const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState(''); // For re-auth
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  // const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState(''); // For re-auth


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({ displayName: currentUser.displayName || "" });
      setNewEmail(currentUser.email || '');
    }
  }, [currentUser, form]);

  const handleUpdateDisplayName = async (data: ProfileFormValues) => {
    if (!currentUser) return;
    setIsSubmittingName(true);
    const success = await updateUserDisplayName(currentUser.uid, data.displayName);
    if (success) {
      toast({ title: "Success", description: "Display name updated successfully." });
    } else {
      toast({ title: "Error", description: "Failed to update display name.", variant: "destructive" });
    }
    setIsSubmittingName(false);
  };
  
  // Simplified email/password update without full re-auth flow for brevity
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newEmail.trim()) return;
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        return;
    }
    setIsSubmittingEmail(true);
    // In a real app, prompt for currentPassword and re-authenticate before calling updateUserEmail
    const success = await updateUserEmail(newEmail, "dummyCurrentPassword"); // Dummy password
    if (success) {
      toast({ title: "Success", description: "Email update process initiated. Check your new email for verification if required by Firebase." });
    } else {
      toast({ title: "Error", description: "Failed to update email. You might need to re-authenticate.", variant: "destructive" });
    }
    setIsSubmittingEmail(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword.trim()) return;
    if (newPassword.length < 6) {
        toast({ title: "Password Too Short", description: "New password must be at least 6 characters.", variant: "destructive" });
        return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    setIsSubmittingPassword(true);
    // In a real app, prompt for currentPassword and re-authenticate
    const success = await updateUserPassword(newPassword, "dummyCurrentPassword"); // Dummy password
    if (success) {
      toast({ title: "Success", description: "Password updated successfully." });
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      toast({ title: "Error", description: "Failed to update password. You might need to re-authenticate.", variant: "destructive" });
    }
    setIsSubmittingPassword(false);
  };


  if (authLoading && !currentUser) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
    // Should be caught by ProtectedRoute, but as a fallback
    return <div className="p-4 text-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Profile</h1>

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
            <Button type="submit" disabled={isSubmittingName || !form.formState.isDirty} className="button-shadow">
              {isSubmittingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Display Name
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Update - Simplified */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5 text-primary"/> Update Email</CardTitle>
          <CardDescription>Change the email address associated with your account. This is a simplified flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
             <div className="space-y-2">
                <label htmlFor="newEmail" className="block text-sm font-medium text-foreground">New Email Address</label>
                <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new.email@example.com" />
            </div>
            {/* In real app:
            <Input type="password" placeholder="Current Password for re-authentication" value={currentPasswordForEmail} onChange={(e) => setCurrentPasswordForEmail(e.target.value)} />
            */}
            <Button type="submit" disabled={isSubmittingEmail || newEmail === currentUser.email} className="button-shadow">
              {isSubmittingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Update - Simplified */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary"/> Update Password</CardTitle>
          <CardDescription>Change your account password. This is a simplified flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* In real app:
            <Input type="password" placeholder="Current Password for re-authentication" value={currentPasswordForPassword} onChange={(e) => setCurrentPasswordForPassword(e.target.value)} />
            */}
             <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">New Password</label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New strong password" />
            </div>
             <div className="space-y-2">
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-foreground">Confirm New Password</label>
                <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            <Button type="submit" disabled={isSubmittingPassword || !newPassword} className="button-shadow">
              {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
