
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookCopy, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import type { OnboardingClassData, Subject, ClassType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const classSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters."),
  type: z.enum(["main", "subject_based"], { required_error: "Please select a class type." }),
  subjectId: z.string().optional(),
  compulsorySubjectIds: z.array(z.string()).optional(),
  // classTeacherId removed
}).superRefine((data, ctx) => {
  if (data.type === 'subject_based' && !data.subjectId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Subject is required for subject-based classes.",
      path: ["subjectId"],
    });
  }
});

const createClassesSchema = z.object({
  classes: z.array(classSchema).min(1, "Please add at least one class."),
});

type CreateClassesFormValues = z.infer<typeof createClassesSchema>;

const NO_SUBJECT_VALUE = "__NO_SUBJECT_FOR_CLASS__";

export default function CreateClassesPage() {
  const { currentUser, getSubjectsBySchool, onboardingCreateClasses, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<CreateClassesFormValues>({
    resolver: zodResolver(createClassesSchema),
    defaultValues: {
      classes: [{ name: "", type: "main", compulsorySubjectIds: [], subjectId: NO_SUBJECT_VALUE }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "classes",
  });

  const fetchSchoolData = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingData(true);
      try {
        const subjects = await getSubjectsBySchool(currentUser.schoolId);
        setSchoolSubjects(subjects.sort((a,b) => a.name.localeCompare(b.name)));
      } catch (error) {
        toast({ title: "Error", description: "Could not load school subjects.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [currentUser, getSubjectsBySchool, toast]);

  const onboardingStepPaths: Record<number, string> = {
    0: '/admin/onboarding-flow/create-school',
    1: '/admin/onboarding-flow/add-subjects',
    2: '/admin/onboarding-flow/create-classes',
    3: '/admin/onboarding-flow/invite-users',
    4: '/admin/onboarding-flow/configure-settings',
  };

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin' || !currentUser.schoolId || currentUser.onboardingStep !== 2)) {
      router.push(currentUser?.schoolId && currentUser.onboardingStep !== null ? `/admin/onboarding-flow/${onboardingStepPaths[currentUser.onboardingStep!]}` : '/admin/dashboard');
      return;
    }
    if (currentUser?.schoolId) {
        fetchSchoolData();
    }
  }, [currentUser, authLoading, router, fetchSchoolData]);

  const onSubmit = async (data: CreateClassesFormValues) => {
    if (!currentUser?.schoolId) return;
    setIsSubmitting(true);

    const classesToSave: OnboardingClassData[] = data.classes.map(c => ({
        name: c.name,
        type: c.type,
        subjectId: c.type === 'subject_based' ? (c.subjectId === NO_SUBJECT_VALUE ? undefined : c.subjectId) : undefined,
        compulsorySubjectIds: c.type === 'main' ? c.compulsorySubjectIds : undefined,
    }));

    const success = await onboardingCreateClasses(currentUser.schoolId, classesToSave);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Classes Created!", description: "You can now proceed to invite users." });
    } else {
      toast({ title: "Error", description: "Failed to create classes. Please try again.", variant: "destructive" });
    }
  };

  const isLoadingPage = authLoading || isLoadingData;

  if (isLoadingPage && !currentUser) {
    return <div className="flex h-screen items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }
  
  return (
    <Card className="w-full card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><BookCopy className="mr-2 h-6 w-6 text-primary"/>Create Initial Classes</CardTitle>
        <CardDescription>Set up the main classes (e.g., Form 1A) and any initial subject-specific classes (e.g., Mathematics - Form 1).</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <ScrollArea className="max-h-[60vh] pr-3">
              {fields.map((item, index) => {
                const classType = form.watch(`classes.${index}.type`);
                return (
                  <div key={item.id} className="p-4 border rounded-lg mb-4 space-y-4 bg-card shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg text-foreground">Class #{index + 1}</h4>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={isLoadingPage || isSubmitting || fields.length <= 1}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Class</span>
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <FormField
                          control={form.control}
                          name={`classes.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Form 1 Alpha" {...field} disabled={isLoadingPage || isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`classes.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Type</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value as ClassType);
                                  form.setValue(`classes.${index}.subjectId`, NO_SUBJECT_VALUE);
                                  form.setValue(`classes.${index}.compulsorySubjectIds`, []);
                                }} 
                                value={field.value} 
                                disabled={isLoadingPage || isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select class type" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="main">Main Class (e.g., Form 1)</SelectItem>
                                  <SelectItem value="subject_based">Subject-Based (e.g., Math - Form 1)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                    {classType === 'subject_based' && (
                       <FormField
                          control={form.control}
                          name={`classes.${index}.subjectId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject for this Class</FormLabel>
                               <Select 
                                onValueChange={field.onChange} 
                                value={field.value || NO_SUBJECT_VALUE} 
                                disabled={isLoadingPage || isSubmitting || schoolSubjects.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {schoolSubjects.map(sub => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              {schoolSubjects.length === 0 && <p className="text-xs text-muted-foreground mt-1">No subjects defined for the school yet.</p>}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    )}

                    {classType === 'main' && (
                       <FormField
                          control={form.control}
                          name={`classes.${index}.compulsorySubjectIds`}
                          render={() => (
                            <FormItem>
                              <FormLabel>Compulsory Subjects (Optional)</FormLabel>
                               {schoolSubjects.length === 0 ? (
                                 <p className="text-xs text-muted-foreground py-2">No subjects defined to select from.</p>
                               ) : (
                                <ScrollArea className="h-32 border rounded-md p-3">
                                  <div className="space-y-2">
                                  {schoolSubjects.map((subject) => (
                                    <FormField
                                      key={subject.id}
                                      control={form.control}
                                      name={`classes.${index}.compulsorySubjectIds`}
                                      render={({ field }) => {
                                        return (
                                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(subject.id)}
                                                onCheckedChange={(checked) => {
                                                  const currentSubs = field.value || [];
                                                  return checked
                                                    ? field.onChange([...currentSubs, subject.id])
                                                    : field.onChange(currentSubs.filter((value) => value !== subject.id));
                                                }}
                                                disabled={isLoadingPage || isSubmitting}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer">
                                              {subject.name}
                                            </FormLabel>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))}
                                  </div>
                                </ScrollArea>
                               )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    )}
                  </div>
                );
              })}
            </ScrollArea>
            {form.formState.errors.classes && form.formState.errors.classes.root?.message && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.classes.root.message}</p>
            )}
             <Button type="button" variant="outline" onClick={() => append({ name: "", type: "main", compulsorySubjectIds: [], subjectId: NO_SUBJECT_VALUE })} disabled={isLoadingPage || isSubmitting} className="w-full sm:w-auto button-shadow mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Class
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 border-t">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/onboarding-flow/add-subjects')} disabled={isLoadingPage || isSubmitting}>
              Back to Subjects
            </Button>
            <Button type="submit" className="w-full sm:w-auto button-shadow" disabled={isLoadingPage || isSubmitting}>
              {isSubmitting ? <Loader size="small" className="mr-2"/> : <ArrowRight className="mr-2 h-4 w-4" />}
              Save Classes & Continue
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

