
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, PlusCircle, Trash2, ArrowRight, Users, SkipForward } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import type { OnboardingInvitedUserData, UserRole } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from '@/components/ui/form';

const userInviteSchema = z.object({
  email: z.string().email("Invalid email address."),
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  role: z.enum(["teacher", "student"], { required_error: "Please select a role." }),
});

const inviteUsersSchema = z.object({
  users: z.array(userInviteSchema).min(1, "Please add at least one user if you are inviting users now. Otherwise, you can skip this step."),
});

type InviteUsersFormValues = z.infer<typeof inviteUsersSchema>;

export default function InviteUsersPage() {
  const { currentUser, onboardingInviteUsers, updateAdminOnboardingStep, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const form = useForm<InviteUsersFormValues>({
    resolver: zodResolver(inviteUsersSchema),
    defaultValues: {
      users: [{ email: "", displayName: "", role: "teacher" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "users",
  });
  
  const onboardingStepPaths: Record<number, string> = {
    0: '/admin/onboarding-flow/create-school',
    1: '/admin/onboarding-flow/add-subjects',
    2: '/admin/onboarding-flow/create-classes',
    3: '/admin/onboarding-flow/invite-users',
    4: '/admin/onboarding-flow/configure-settings',
  };

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId || currentUser.onboardingStep !== 3)) {
       router.push(currentUser?.schoolId && currentUser.onboardingStep !== null ? `/admin/onboarding-flow/${onboardingStepPaths[currentUser.onboardingStep!]}` : '/admin/dashboard');
    }
  }, [currentUser, authLoading, router]);

  const onSubmit = async (data: InviteUsersFormValues) => {
    if (!currentUser?.schoolId || !currentUser.schoolName) {
      toast({ title: "Error", description: "School information is missing.", variant: "destructive" });
      return;
    }
    if (data.users.length === 0) { // If form submitted with no users, treat as skip
        handleSkip();
        return;
    }
    setIsSubmitting(true);
    
    const usersToInvite: OnboardingInvitedUserData[] = data.users.map(u => ({
        email: u.email,
        displayName: u.displayName,
        role: u.role as 'teacher' | 'student',
    }));

    const success = await onboardingInviteUsers(currentUser.schoolId, currentUser.schoolName, usersToInvite);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Users Invited (Profiles Created)!", description: "Invited users can now be found in 'Pending Verification' or an 'Invited' status. They will need to complete their own registration if they don't have an account, or will be linked if they do." });
      // ProtectedRoute will handle redirection
    } else {
      toast({ title: "Error", description: "Failed to invite users. Please try again.", variant: "destructive" });
    }
  };

  const handleSkip = async () => {
    if (!currentUser?.uid) return;
    setIsSkipping(true);
    const success = await updateAdminOnboardingStep(currentUser.uid, 4); // Move to configure settings
    setIsSkipping(false);
    if (success) {
      toast({ title: "Step Skipped", description: "Proceeding to final configuration." });
      // ProtectedRoute will handle redirection
    } else {
      toast({ title: "Error", description: "Could not skip step. Please try again.", variant: "destructive" });
    }
  };


  const isLoading = authLoading || isSubmitting || isSkipping;

  if (authLoading && !currentUser) {
    return <div className="flex h-screen items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }

  return (
    <Card className="w-full card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6 text-primary"/>Invite Initial Teachers & Students (Optional)</CardTitle>
        <CardDescription>
          Add some initial teachers and students. They will be set to 'pending verification'. You can always add more users later from the admin dashboard.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <ScrollArea className="max-h-[50vh] pr-3">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 border rounded-md mb-3 space-y-2 bg-muted/20">
                <div className="flex justify-between items-center">
                    <Label htmlFor={`users.${index}.email`} className="font-semibold">User #{index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isLoading || fields.length <= 1} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove User</span>
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor={`users.${index}.displayName`}>Full Name</Label>
                        <Input id={`users.${index}.displayName`} {...form.register(`users.${index}.displayName`)} placeholder="e.g., Jane Teacher" disabled={isLoading} />
                        {form.formState.errors.users?.[index]?.displayName && <p className="text-xs text-destructive mt-1">{form.formState.errors.users[index]?.displayName?.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor={`users.${index}.email`}>Email Address</Label>
                        <Input id={`users.${index}.email`} type="email" {...form.register(`users.${index}.email`)} placeholder="user@example.com" disabled={isLoading} />
                        {form.formState.errors.users?.[index]?.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.users[index]?.email?.message}</p>}
                    </div>
                </div>
                 <div>
                    <Label htmlFor={`users.${index}.role`}>Role</Label>
                    <Controller
                        name={`users.${index}.role`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                             <Select onValueChange={controllerField.onChange} value={controllerField.value} disabled={isLoading}>
                                <SelectTrigger id={`users.${index}.role`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {form.formState.errors.users?.[index]?.role && <p className="text-xs text-destructive mt-1">{form.formState.errors.users[index]?.role?.message}</p>}
                </div>
              </div>
            ))}
            </ScrollArea>
            {form.formState.errors.users && form.formState.errors.users.message && fields.length > 0 && <p className="text-sm text-destructive mt-2">{form.formState.errors.users.message}</p>}
             <Button type="button" variant="outline" onClick={() => append({ email: "", displayName: "", role: "teacher" })} disabled={isLoading} className="w-full sm:w-auto button-shadow">
              <UserPlus className="mr-2 h-4 w-4" /> Add Another User
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 border-t">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/onboarding-flow/create-classes')} disabled={isLoading}>
              Back to Classes
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button type="button" variant="secondary" onClick={handleSkip} disabled={isLoading} className="w-full sm:w-auto button-shadow">
                  {isSkipping ? <Loader size="small" className="mr-2"/> : <SkipForward className="mr-2 h-4 w-4" />}
                  Skip & Continue to Settings
                </Button>
                <Button type="submit" className="w-full sm:w-auto button-shadow" disabled={isLoading}>
                  {isSubmitting ? <Loader size="small" className="mr-2"/> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Invite Users & Continue
                </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
