
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CalendarIcon, ArrowLeft, FilePieChart, Users, Building, University } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClassWithTeacherInfo, ExamPeriod } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import Loader from '@/components/shared/Loader';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timestamp } from 'firebase/firestore'; // Added Timestamp import


const examPeriodFormSchema = z.object({
  name: z.string().min(3, "Exam period name must be at least 3 characters."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  assignmentScope: z.enum(['specific_classes', 'form_grade', 'entire_school']).default('specific_classes'),
  selectedFormGrade: z.string().optional(),
  assignedClassIds: z.array(z.string()).optional().default([]),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
}).refine(data => {
    if (data.assignmentScope === 'specific_classes') {
        return data.assignedClassIds && data.assignedClassIds.length > 0;
    }
    return true;
}, {
    message: "At least one class must be assigned for specific class selection.",
    path: ["assignedClassIds"],
}).refine(data => {
    if (data.assignmentScope === 'form_grade') {
        return !!data.selectedFormGrade;
    }
    return true;
}, {
    message: "Please select a form/grade level.",
    path: ["selectedFormGrade"],
});

type ExamPeriodFormValues = z.infer<typeof examPeriodFormSchema>;

// Helper function to extract unique form/grade levels
const getUniqueFormGradeLevels = (classes: ClassWithTeacherInfo[]): string[] => {
    const formGradeSet = new Set<string>();
    classes.forEach(cls => {
        if (cls.classType === 'main') {
            // Attempt to extract a "Form X" or "Grade Y" pattern
            const match = cls.name.match(/^(Form\s*\d+|Grade\s*\d+)/i);
            if (match && match[0]) {
                formGradeSet.add(match[0].trim());
            }
        }
    });
    return Array.from(formGradeSet).sort();
};


export default function CreateExamPeriodPage() {
  const router = useRouter();
  const { currentUser, createExamPeriod, getClassesBySchool, loading: authLoading, addActivity } = useAuth();
  const { toast } = useToast();
  
  const [allSchoolClasses, setAllSchoolClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [formGradeLevels, setFormGradeLevels] = useState<string[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExamPeriodFormValues>({
    resolver: zodResolver(examPeriodFormSchema),
    defaultValues: {
      name: '',
      startDate: undefined,
      endDate: undefined,
      assignmentScope: 'specific_classes',
      selectedFormGrade: undefined,
      assignedClassIds: [],
    },
  });

  const assignmentScope = form.watch("assignmentScope");

  const fetchSchoolClasses = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingPage(true);
      const classes = await getClassesBySchool(currentUser.schoolId);
      const mainClasses = classes.filter(c => c.classType === 'main').sort((a,b) => a.name.localeCompare(b.name));
      setAllSchoolClasses(mainClasses);
      setFormGradeLevels(getUniqueFormGradeLevels(mainClasses));
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getClassesBySchool, authLoading]);

  useEffect(() => {
    fetchSchoolClasses();
  }, [fetchSchoolClasses]);

  async function onSubmit(values: ExamPeriodFormValues) {
    if (!currentUser || !currentUser.schoolId) {
      toast({ title: "Error", description: "User not properly authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    let finalAssignedClassIds: string[] = [];
    if (values.assignmentScope === 'specific_classes') {
        finalAssignedClassIds = values.assignedClassIds || [];
    } else if (values.assignmentScope === 'form_grade' && values.selectedFormGrade) {
        finalAssignedClassIds = allSchoolClasses
            .filter(cls => cls.classType === 'main' && cls.name.toLowerCase().startsWith(values.selectedFormGrade!.toLowerCase()))
            .map(cls => cls.id);
    } else if (values.assignmentScope === 'entire_school') {
        finalAssignedClassIds = allSchoolClasses.filter(cls => cls.classType === 'main').map(cls => cls.id);
    }

    if (finalAssignedClassIds.length === 0) {
        toast({ title: "No Classes Assigned", description: "Please ensure classes are selected or correctly configured for the chosen scope.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const examPeriodData: Omit<ExamPeriod, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
      name: values.name,
      schoolId: currentUser.schoolId,
      startDate: Timestamp.fromDate(values.startDate),
      endDate: Timestamp.fromDate(values.endDate),
      assignedClassIds: finalAssignedClassIds,
      assignmentScope: values.assignmentScope,
      scopeDetail: values.assignmentScope === 'form_grade' ? values.selectedFormGrade : null,
    };

    const examPeriodId = await createExamPeriod(examPeriodData);
    setIsSubmitting(false);

    if (examPeriodId) {
      toast({ title: "Exam Period Created!", description: `"${values.name}" has been successfully created.` });
        if (currentUser.displayName && currentUser.schoolId) {
            addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                type: 'exam_period_created',
                message: `${currentUser.displayName} created exam period "${values.name}". Scope: ${values.assignmentScope.replace('_', ' ')}.`,
                link: `/admin/exams/${examPeriodId}`
            });
        }
      router.push('/admin/exams');
    } else {
      toast({ title: "Creation Failed", description: "Could not create exam period. Please try again.", variant: "destructive" });
    }
  }
  
  const pageOverallLoading = authLoading || isLoadingPage;

   if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading..." size="large" />
      </div>
    );
  }
  
  if (!currentUser?.schoolId) {
    return <div className="text-center p-4 text-destructive">You must be an admin of a school to create exam periods.</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/admin/exams')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exam Periods
      </Button>
      <Card className="w-full max-w-2xl mx-auto card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><FilePieChart className="mr-2 h-6 w-6 text-primary"/>Create New Exam Period</CardTitle>
          <CardDescription>Define a new period for exams and assign it appropriately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Exam Period Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g., Mid-Term Exams Fall 2024" />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                 <Controller
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    )}
                 />
                {form.formState.errors.startDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.startDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Controller
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => form.getValues("startDate") ? date < form.getValues("startDate") : false}/>
                            </PopoverContent>
                        </Popover>
                    )}
                 />
                {form.formState.errors.endDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.endDate.message}</p>}
              </div>
            </div>

            <div>
                <Label>Assignment Scope</Label>
                <Controller
                    control={form.control}
                    name="assignmentScope"
                    render={({ field }) => (
                        <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('assignedClassIds', []); // Reset specific class selection
                                form.setValue('selectedFormGrade', undefined); // Reset form/grade
                            }}
                            value={field.value}
                            className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                            <Label htmlFor="scope-specific" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="specific_classes" id="scope-specific" />
                                <Users className="h-4 w-4 mr-1"/> Specific Classes
                            </Label>
                            <Label htmlFor="scope-form" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="form_grade" id="scope-form" />
                                <Building className="h-4 w-4 mr-1"/> Form/Grade
                            </Label>
                            <Label htmlFor="scope-school" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="entire_school" id="scope-school" />
                                <University className="h-4 w-4 mr-1"/> Entire School
                            </Label>
                        </RadioGroup>
                    )}
                />
            </div>

            {assignmentScope === 'specific_classes' && (
              <div>
                <Label>Assign to Specific Classes</Label>
                {allSchoolClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">No classes available in your school to assign.</p>
                ) : (
                  <ScrollArea className="h-40 border rounded-md p-2 mt-1">
                    <div className="space-y-2">
                    <Controller
                        name="assignedClassIds"
                        control={form.control}
                        render={({ field }) => (
                          <>
                            {allSchoolClasses.map((cls) => (
                              <div key={cls.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`class-${cls.id}`}
                                  checked={field.value?.includes(cls.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), cls.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== cls.id
                                          )
                                        );
                                  }}
                                />
                                <Label htmlFor={`class-${cls.id}`} className="font-normal cursor-pointer">
                                  {cls.name} {cls.teacherDisplayName && `(Teacher: ${cls.teacherDisplayName})`}
                                </Label>
                              </div>
                            ))}
                          </>
                        )}
                      />
                    </div>
                  </ScrollArea>
                )}
                {form.formState.errors.assignedClassIds && <p className="text-sm text-destructive mt-1">{form.formState.errors.assignedClassIds.message}</p>}
              </div>
            )}

            {assignmentScope === 'form_grade' && (
                <div>
                    <Label htmlFor="selectedFormGrade">Select Form/Grade Level</Label>
                    <Controller
                        name="selectedFormGrade"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={formGradeLevels.length === 0}>
                                <SelectTrigger id="selectedFormGrade">
                                    <SelectValue placeholder="Choose a form/grade..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {formGradeLevels.map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {formGradeLevels.length === 0 && <p className="text-xs text-muted-foreground mt-1">No distinct form/grade levels found from main class names.</p>}
                     {form.formState.errors.selectedFormGrade && <p className="text-sm text-destructive mt-1">{form.formState.errors.selectedFormGrade.message}</p>}
                </div>
            )}
            {assignmentScope === 'entire_school' && (
                 <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">This exam period will be assigned to all main classes in the school.</p>
            )}


            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isSubmitting || pageOverallLoading || allSchoolClasses.length === 0}>
              {isSubmitting ? <Loader size="small" className="mr-2" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Create Exam Period
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

