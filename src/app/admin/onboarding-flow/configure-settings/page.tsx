
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, CheckCircle, ArrowRight } from 'lucide-react';
import Loader from '@/components/shared/Loader';

const configureSettingsSchema = z.object({
  isExamModeActive: z.boolean().default(false),
});

type ConfigureSettingsFormValues = z.infer<typeof configureSettingsSchema>;

export default function ConfigureSettingsPage() {
  const { currentUser, onboardingCompleteSchoolSetup, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConfigureSettingsFormValues>({
    resolver: zodResolver(configureSettingsSchema),
    defaultValues: {
      isExamModeActive: false,
    },
  });
  
  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId || currentUser.onboardingStep !== 4)) {
       router.push(currentUser?.schoolId && currentUser.onboardingStep !== null ? `/admin/onboarding-flow/${onboardingStepPaths[currentUser.onboardingStep!]}` : '/admin/dashboard');
    }
  }, [currentUser, authLoading, router]);

  const onSubmit = async (data: ConfigureSettingsFormValues) => {
    if (!currentUser?.schoolId) {
      toast({ title: "Error", description: "School information is missing.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const success = await onboardingCompleteSchoolSetup(currentUser.schoolId, data.isExamModeActive);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Setup Complete!", description: "Your school is now fully set up. Redirecting to dashboard..." });
      // ProtectedRoute will handle redirection as onboardingStep will become null
    } else {
      toast({ title: "Error", description: "Failed to finalize settings. Please try again.", variant: "destructive" });
    }
  };

  const isLoading = authLoading || isSubmitting;

  const onboardingStepPaths: Record<number, string> = {
    0: '/admin/onboarding-flow/create-school',
    1: '/admin/onboarding-flow/add-subjects',
    2: '/admin/onboarding-flow/create-classes',
    3: '/admin/onboarding-flow/invite-users',
    4: '/admin/onboarding-flow/configure-settings',
  };

  if (authLoading && !currentUser) {
    return <div className="flex h-screen items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }

  return (
    <Card className="w-full card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-primary"/>Final School Configuration</CardTitle>
        <CardDescription>One last step! Configure initial settings for your school.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Controller
                control={form.control}
                name="isExamModeActive"
                render={({ field }) => (
                  <Switch
                    id="exam-mode-toggle"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-label="Toggle Exam Mode"
                  />
                )}
              />
              <div className="space-y-0.5">
                <Label htmlFor="exam-mode-toggle" className="text-base">
                  Activate Exam Mode Initially?
                </Label>
                <p className="text-xs text-muted-foreground">
                  If ON, teachers can start entering exam results if an exam period is active. Can be changed later.
                </p>
              </div>
            </div>
            {form.formState.errors.isExamModeActive && <p className="text-sm text-destructive">{form.formState.errors.isExamModeActive.message}</p>}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
             <Button type="button" variant="ghost" onClick={() => router.push('/admin/onboarding-flow/invite-users')} disabled={isLoading}>
              Back to Inviting Users
            </Button>
            <Button type="submit" className="w-full sm:w-auto button-shadow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? <Loader size="small" className="mr-2"/> : <CheckCircle className="mr-2 h-4 w-4" />}
              Finish Setup & Go to Dashboard
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
