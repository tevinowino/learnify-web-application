
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookText, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import type { OnboardingSubjectData } from '@/types';
import { Form } from '@/components/ui/form'; // Added this import

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters."),
  isCompulsory: z.boolean().default(false),
});

const addSubjectsSchema = z.object({
  subjects: z.array(subjectSchema).min(1, "Please add at least one subject."),
});

type AddSubjectsFormValues = z.infer<typeof addSubjectsSchema>;

export default function AddSubjectsPage() {
  const { currentUser, onboardingAddSubjects, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddSubjectsFormValues>({
    resolver: zodResolver(addSubjectsSchema),
    defaultValues: {
      subjects: [{ name: "", isCompulsory: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId || currentUser.onboardingStep !== 1)) {
      // Redirect if not on the correct step or not authorized
      router.push(currentUser?.schoolId ? '/admin/dashboard' : '/auth/login');
    }
  }, [currentUser, authLoading, router]);

  const onSubmit = async (data: AddSubjectsFormValues) => {
    if (!currentUser?.schoolId) {
      toast({ title: "Error", description: "School information is missing.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const subjectsToSave: OnboardingSubjectData[] = data.subjects.map(s => ({
        name: s.name,
        isCompulsory: s.isCompulsory,
    }));

    const success = await onboardingAddSubjects(currentUser.schoolId, subjectsToSave);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Subjects Added!", description: "You can now proceed to create classes." });
      // ProtectedRoute will handle redirection
    } else {
      toast({ title: "Error", description: "Failed to add subjects. Please try again.", variant: "destructive" });
    }
  };

  const isLoading = authLoading || isSubmitting;

  if (authLoading && !currentUser) {
    return <div className="flex h-screen items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }

  return (
    <Card className="w-full card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><BookText className="mr-2 h-6 w-6 text-primary"/>Add Subjects Offered</CardTitle>
        <CardDescription>Define the subjects taught at your school. You can mark some as compulsory for all students.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 border rounded-md">
                <div className="flex-grow space-y-1">
                  <Label htmlFor={`subjects.${index}.name`} className="sr-only">Subject Name</Label>
                  <Input 
                    id={`subjects.${index}.name`}
                    {...form.register(`subjects.${index}.name`)} 
                    placeholder={`Subject ${index + 1} Name`} 
                    disabled={isLoading}
                    className="w-full"
                  />
                  {form.formState.errors.subjects?.[index]?.name && <p className="text-xs text-destructive">{form.formState.errors.subjects[index]?.name?.message}</p>}
                </div>
                <div className="flex items-center space-x-2 self-center sm:self-end py-2">
                  <Controller
                    name={`subjects.${index}.isCompulsory`}
                    control={form.control}
                    render={({ field: { onChange, value, ref }}) => (
                        <Checkbox
                        id={`subjects.${index}.isCompulsory`}
                        checked={value}
                        onCheckedChange={onChange}
                        ref={ref}
                        disabled={isLoading}
                        />
                    )}
                   />
                  <Label htmlFor={`subjects.${index}.isCompulsory`} className="text-sm font-normal cursor-pointer">Compulsory?</Label>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isLoading || fields.length <= 1} className="text-destructive hover:bg-destructive/10 flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove Subject</span>
                </Button>
              </div>
            ))}
             {form.formState.errors.subjects && !form.formState.errors.subjects.root?.message && form.formState.errors.subjects.message && (
                <p className="text-sm text-destructive">{form.formState.errors.subjects.message}</p>
            )}

            <Button type="button" variant="outline" onClick={() => append({ name: "", isCompulsory: false })} disabled={isLoading} className="w-full sm:w-auto button-shadow">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Subject
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/onboarding-flow/create-school')} disabled={isLoading}>
              Back to School Details
            </Button>
            <Button type="submit" className="w-full sm:w-auto button-shadow" disabled={isLoading}>
              {isLoading ? <Loader size="small" className="mr-2"/> : <ArrowRight className="mr-2 h-4 w-4" />}
              Save Subjects & Continue
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
