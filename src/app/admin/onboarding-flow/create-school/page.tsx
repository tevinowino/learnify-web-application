
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { School, Building, MapPin, Phone, ArrowRight } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import type { OnboardingSchoolData } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const createSchoolSchema = z.object({
  schoolName: z.string().min(3, "School name must be at least 3 characters."),
  schoolType: z.enum(["Primary", "Secondary", "K-12", "Higher Education", "Vocational", "Other"], { required_error: "Please select a school type." }),
  country: z.string().min(2, "Country is required."),
  phoneNumber: z.string().min(5, "Phone number must be at least 5 characters if provided.").optional().or(z.literal("")),
});

type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>;

export default function CreateSchoolPage() {
  const { currentUser, onboardingCreateSchool, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateSchoolFormValues>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
        schoolName: "",
        schoolType: undefined,
        country: "",
        phoneNumber: "",
    }
  });

  const onSubmit = async (data: CreateSchoolFormValues) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Authentication Error", description: "User not found. Please log in again.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const schoolDetails: OnboardingSchoolData = {
        schoolName: data.schoolName,
        schoolType: data.schoolType,
        country: data.country,
        phoneNumber: data.phoneNumber || "",
    };
    
    const result = await onboardingCreateSchool(schoolDetails, currentUser.uid); 
    setIsSubmitting(false);

    if (result) {
      toast({ title: "School Created!", description: `Invite code: ${result.inviteCode}. Proceed to the next step.` });
      // ProtectedRoute will handle redirection based on updated onboardingStep in currentUser
    } else {
      toast({ title: "Error", description: "Failed to create school. Please try again.", variant: "destructive" });
    }
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <Card className="w-full card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><School className="mr-2 h-6 w-6 text-primary"/> Tell Us About Your School</CardTitle>
        <CardDescription>Provide some basic information to create your school profile on Learnify.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/>School Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Learnify Academy" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/>School Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select school type..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Primary">Primary School</SelectItem>
                      <SelectItem value="Secondary">Secondary School</SelectItem>
                      <SelectItem value="K-12">K-12 School</SelectItem>
                      <SelectItem value="Higher Education">Higher Education</SelectItem>
                      <SelectItem value="Vocational">Vocational/Technical</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kenya" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +254 7XX XXX XXX" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full button-shadow" disabled={isLoading}>
              {isLoading ? <Loader size="small" className="mr-2"/> : <ArrowRight className="mr-2 h-4 w-4" />}
              Create School & Continue
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

