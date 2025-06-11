
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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookCopy, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import type { OnboardingClassData, Subject, UserProfileWithId, ClassType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const classSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters."),
  type: z.enum(["main", "subject_based"], { required_error: "Please select a class type." }),
  subjectId: z.string().optional(),
  compulsorySubjectIds: z.array(z.string()).optional(),
  classTeacherId: z.string().optional(),
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

const NO_TEACHER_VALUE = "__NO_TEACHER__";

export default function CreateClassesPage() {
  const { currentUser, getSubjectsBySchool, getUsersBySchoolAndRole, onboardingCreateClasses, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [schoolTeachers, setSchoolTeachers] = useState<UserProfileWithId[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<CreateClassesFormValues>({
    resolver: zodResolver(createClassesSchema),
    defaultValues: {
      classes: [{ name: "", type: "main", compulsorySubjectIds: [] }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "classes",
  });

  const fetchSchoolData = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingData(true);
      try {
        const [subjects, teachers] = await Promise.all([
          getSubjectsBySchool(currentUser.schoolId),
          getUsersBySchoolAndRole(currentUser.schoolId, 'teacher')
        ]);
        setSchoolSubjects(subjects);
        setSchoolTeachers(teachers);
      } catch (error) {
        toast({ title: "Error", description: "Could not load school subjects or teachers.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [currentUser, getSubjectsBySchool, getUsersBySchoolAndRole, toast]);

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
        subjectId: c.type === 'subject_based' ? c.subjectId : undefined,
        compulsorySubjectIds: c.type === 'main' ? c.compulsorySubjectIds : undefined,
        classTeacherId: c.classTeacherId === NO_TEACHER_VALUE ? undefined : c.classTeacherId,
    }));

    const success = await onboardingCreateClasses(currentUser.schoolId, classesToSave);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Classes Created!", description: "You can now proceed to invite users." });
    } else {
      toast({ title: "Error", description: "Failed to create classes. Please try again.", variant: "destructive" });
    }
  };

  const isLoading = authLoading || isSubmitting || isLoadingData;

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
        <CardTitle className="flex items-center"><BookCopy className="mr-2 h-6 w-6 text-primary"/>Create Initial Classes</CardTitle>
        <CardDescription>Set up the main classes (e.g., Form 1A) and any initial subject-specific classes (e.g., Mathematics - Form 1).</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <ScrollArea className="max-h-[60vh] pr-3">
              {fields.map((field, index) => {
                const classType = form.watch(`classes.${index}.type`);
                return (
                  <div key={field.id} className="p-4 border rounded-md mb-4 space-y-3 bg-muted/20">
                    <div className="flex justify-between items-center">
                        <Label htmlFor={`classes.${index}.name`} className="font-semibold">Class #{index + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isLoading || fields.length <= 1} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Class</span>
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor={`classes.${index}.name`}>Class Name</Label>
                            <Input id={`classes.${index}.name`} {...form.register(`classes.${index}.name`)} placeholder="e.g., Form 1 Alpha" disabled={isLoading} />
                            {form.formState.errors.classes?.[index]?.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.classes[index]?.name?.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor={`classes.${index}.type`}>Class Type</Label>
                             <Controller
                                name={`classes.${index}.type`}
                                control={form.control}
                                render={({ field: controllerField }) => (
                                    <Select onValueChange={(value) => { controllerField.onChange(value as ClassType); update(index, { ...form.getValues(`classes.${index}`), type: value as ClassType, subjectId: undefined, compulsorySubjectIds: [] }); }} value={controllerField.value} disabled={isLoading}>
                                        <SelectTrigger id={`classes.${index}.type`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="main">Main Class</SelectItem>
                                            <SelectItem value="subject_based">Subject-Based Class</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    {classType === 'subject_based' && (
                        <div>
                            <Label htmlFor={`classes.${index}.subjectId`}>Subject for this Class</Label>
                             <Controller
                                name={`classes.${index}.subjectId`}
                                control={form.control}
                                render={({ field: controllerField }) => (
                                    <Select onValueChange={controllerField.onChange} value={controllerField.value} disabled={isLoading || schoolSubjects.length === 0}>
                                        <SelectTrigger id={`classes.${index}.subjectId`}><SelectValue placeholder="Select subject..." /></SelectTrigger>
                                        <SelectContent>
                                            {schoolSubjects.map(sub => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.classes?.[index]?.subjectId && <p className="text-xs text-destructive mt-1">{form.formState.errors.classes[index]?.subjectId?.message}</p>}
                        </div>
                    )}

                    {classType === 'main' && (
                        <div className="space-y-2">
                            <Label>Compulsory Subjects for this Main Class (Optional)</Label>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                {schoolSubjects.length === 0 && <p className="text-xs text-muted-foreground">No subjects defined yet.</p>}
                                {schoolSubjects.map(sub => (
                                    <div key={sub.id} className="flex items-center space-x-2">
                                    <Controller
                                        name={`classes.${index}.compulsorySubjectIds`}
                                        control={form.control}
                                        render={({ field: controllerField }) => (
                                            <Checkbox
                                                id={`classes.${index}.compulsory.${sub.id}`}
                                                checked={controllerField.value?.includes(sub.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentSubs = controllerField.value || [];
                                                    return checked ? controllerField.onChange([...currentSubs, sub.id]) : controllerField.onChange(currentSubs.filter(id => id !== sub.id));
                                                }}
                                                disabled={isLoading}
                                            />
                                        )}
                                    />
                                    <Label htmlFor={`classes.${index}.compulsory.${sub.id}`} className="font-normal cursor-pointer">{sub.name}</Label>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    )}
                    <div>
                        <Label htmlFor={`classes.${index}.classTeacherId`}>Class Teacher (Optional)</Label>
                        <Controller
                            name={`classes.${index}.classTeacherId`}
                            control={form.control}
                            render={({ field: controllerField }) => (
                                <Select onValueChange={controllerField.onChange} value={controllerField.value ?? NO_TEACHER_VALUE} disabled={isLoading || schoolTeachers.length === 0}>
                                    <SelectTrigger id={`classes.${index}.classTeacherId`}><SelectValue placeholder="Assign a teacher..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_TEACHER_VALUE}>No Specific Teacher</SelectItem>
                                        {schoolTeachers.map(teacher => (<SelectItem key={teacher.id} value={teacher.id}>{teacher.displayName}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
            {form.formState.errors.classes && form.formState.errors.classes.message && <p className="text-sm text-destructive mt-2">{form.formState.errors.classes.message}</p>}
             <Button type="button" variant="outline" onClick={() => append({ name: "", type: "main", compulsorySubjectIds: [] })} disabled={isLoading} className="w-full sm:w-auto button-shadow">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Class
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/onboarding-flow/add-subjects')} disabled={isLoading}>
              Back to Subjects
            </Button>
            <Button type="submit" className="w-full sm:w-auto button-shadow" disabled={isLoading}>
              {isLoading ? <Loader size="small" className="mr-2"/> : <ArrowRight className="mr-2 h-4 w-4" />}
              Save Classes & Continue
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
