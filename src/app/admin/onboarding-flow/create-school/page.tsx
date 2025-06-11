
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Ensure Controller is imported
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
import { School, UploadCloud, Building, MapPin, Phone } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import type { OnboardingSchoolData } from '@/types';
import { Form } from '@/components/ui/form'; // Added this import

const createSchoolSchema = z.object({
  schoolName: z.string().min(3, "School name must be at least 3 characters."),
  schoolType: z.enum(["Primary", "Secondary", "K-12", "Higher Education", "Vocational", "Other"], { required_error: "Please select a school type." }),
  country: z.string().min(2, "Country is required."),
  phoneNumber: z.string().min(5, "Phone number is required.").optional().or(z.literal("")), // Optional
  logoFile: z.instanceof(File).optional(),
});

type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>;

export default function CreateSchoolPage() {
  const { currentUser, onboardingCreateSchool, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateSchoolFormValues>({
    resolver: zodResolver(createSchoolSchema),
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
    
    const result = await onboardingCreateSchool(schoolDetails, currentUser.uid, data.logoFile);
    setIsSubmitting(false);

    if (result) {
      toast({ title: "School Created!", description: `Invite code: ${result.inviteCode}. Proceed to the next step.` });
      // ProtectedRoute will handle redirection based on updated onboardingStep
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
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/>School Name</Label>
              <Input id="schoolName" {...form.register("schoolName")} placeholder="e.g., Learnify Academy" disabled={isLoading} />
              {form.formState.errors.schoolName && <p className="text-sm text-destructive">{form.formState.errors.schoolName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolType" className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/>School Type</Label>
              <Controller
                control={form.control}
                name="schoolType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <SelectTrigger id="schoolType"><SelectValue placeholder="Select school type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary">Primary School</SelectItem>
                      <SelectItem value="Secondary">Secondary School</SelectItem>
                      <SelectItem value="K-12">K-12 School</SelectItem>
                      <SelectItem value="Higher Education">Higher Education</SelectItem>
                      <SelectItem value="Vocational">Vocational/Technical</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.schoolType && <p className="text-sm text-destructive">{form.formState.errors.schoolType.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Country</Label>
                <Input id="country" {...form.register("country")} placeholder="e.g., Kenya" disabled={isLoading} />
                {form.formState.errors.country && <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/>Phone Number (Optional)</Label>
                <Input id="phoneNumber" {...form.register("phoneNumber")} placeholder="e.g., +254 7XX XXX XXX" disabled={isLoading} />
                {form.formState.errors.phoneNumber && <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoFile" className="flex items-center"><UploadCloud className="mr-2 h-4 w-4 text-muted-foreground"/>School Logo (Optional)</Label>
              <Input id="logoFile" type="file" {...form.register("logoFile")} accept="image/*" disabled={isLoading} />
              <p className="text-xs text-muted-foreground">Upload your school's logo. Recommended: PNG, JPG, max 2MB.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full button-shadow" disabled={isLoading}>
              {isLoading ? <Loader size="small" className="mr-2"/> : <School className="mr-2 h-4 w-4" />}
              Create School & Continue
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
