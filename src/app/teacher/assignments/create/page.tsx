
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, CalendarIcon, Edit3, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClassWithTeacherInfo, SubmissionFormat, Subject } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Loader from '@/components/shared/Loader';


const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  classId: z.string().min(1, "Please select a class."),
  subjectId: z.string().optional(), 
  deadlineDate: z.date({ required_error: "Deadline date is required." }),
  deadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  allowedSubmissionFormats: z.array(z.enum(['text_entry', 'file_link', 'file_upload'])).min(1, "Select at least one submission format."),
  // Attachment fields are no longer directly uploaded by teacher for assignment creation
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

const availableSubmissionFormats: { id: SubmissionFormat; label: string }[] = [
  { id: 'text_entry', label: 'Text Entry' },
  { id: 'file_link', label: 'File Link (e.g., Google Drive, Dropbox)' },
  { id: 'file_upload', label: 'File Upload (PDF, DOCX, etc.)' },
];

const NO_SUBJECT_VALUE = "__NO_SUBJECT__"; 

export default function CreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');

  const { currentUser, createAssignment, getClassesByTeacher, getSubjectsBySchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]); 
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      classId: preselectedClassId || '',
      subjectId: undefined, 
      deadlineDate: undefined,
      deadlineTime: '23:59',
      allowedSubmissionFormats: ['text_entry'],
    },
  });

  const fetchTeacherData = useCallback(async () => { 
    if (currentUser?.uid && currentUser.schoolId) {
      setIsLoadingPage(true);
      const [classes, subjects] = await Promise.all([ 
        getClassesByTeacher(currentUser.uid),
        getSubjectsBySchool(currentUser.schoolId)
      ]);
      setTeacherClasses(classes);
      setSchoolSubjects(subjects); 
      if (preselectedClassId && classes.find(c => c.id === preselectedClassId)) {
        form.setValue('classId', preselectedClassId);
      }
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getClassesByTeacher, getSubjectsBySchool, authLoading, preselectedClassId, form]); 

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  async function onSubmit(values: AssignmentFormValues) {
    if (!currentUser || !currentUser.uid || !currentUser.schoolId) {
      toast({ title: "Error", description: "User not properly authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const [hours, minutes] = values.deadlineTime.split(':').map(Number);
    const deadline = new Date(values.deadlineDate);
    deadline.setHours(hours, minutes, 0, 0);
    
    const assignmentData = {
      title: values.title,
      description: values.description,
      classId: values.classId,
      teacherId: currentUser.uid, 
      schoolId: currentUser.schoolId,
      deadline: deadline, 
      allowedSubmissionFormats: values.allowedSubmissionFormats,
      subjectId: values.subjectId === NO_SUBJECT_VALUE ? null : values.subjectId, 
      attachmentUrl: null, 
      originalFileName: null, 
    };

    const assignmentId = await createAssignment(assignmentData, undefined); // Pass undefined for file
    setIsSubmitting(false);

    if (assignmentId) {
      toast({ title: "Assignment Created!", description: `"${values.title}" has been successfully created.` });
      router.push(preselectedClassId ? `/teacher/classes/${preselectedClassId}` : '/teacher/assignments');
    } else {
      toast({ title: "Creation Failed", description: "Could not create assignment. Please try again.", variant: "destructive" });
    }
  }
  
  const pageOverallLoading = authLoading || isLoadingPage;

   if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading..." size="large"/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4 button-shadow">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

      <Card className="w-full max-w-2xl mx-auto card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><Edit3 className="mr-2 h-6 w-6 text-primary"/>Create New Assignment</CardTitle>
          <CardDescription>Fill in the details for the new assignment. Assignments are text-based (e.g., textbook exercises).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} placeholder="e.g., Chapter 5 Review Questions" />
              {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description / Instructions</Label>
              <Textarea id="description" {...form.register("description")} placeholder="Provide detailed instructions for the assignment, e.g., 'Read pages 50-55 in the textbook and complete exercises 1-5.'" rows={5} />
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classId">Class</Label>
                <Controller
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!preselectedClassId}>
                      <SelectTrigger id="classId">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.classId && <p className="text-sm text-destructive mt-1">{form.formState.errors.classId.message}</p>}
              </div>
              <div>
                <Label htmlFor="subjectId">Subject (Optional)</Label>
                <Controller
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? NO_SUBJECT_VALUE}>
                      <SelectTrigger id="subjectId">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SUBJECT_VALUE}>No Subject / General</SelectItem>
                        {schoolSubjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.subjectId && <p className="text-sm text-destructive mt-1">{form.formState.errors.subjectId.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadlineDate">Deadline Date</Label>
                 <Controller
                    control={form.control}
                    name="deadlineDate"
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                 />
                {form.formState.errors.deadlineDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.deadlineDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="deadlineTime">Deadline Time (HH:MM)</Label>
                <Input id="deadlineTime" type="time" {...form.register("deadlineTime")} />
                {form.formState.errors.deadlineTime && <p className="text-sm text-destructive mt-1">{form.formState.errors.deadlineTime.message}</p>}
              </div>
            </div>

            <div>
                <Label>Allowed Submission Formats (for students)</Label>
                <Controller
                    name="allowedSubmissionFormats"
                    control={form.control}
                    render={({ field }) => (
                        <div className="space-y-2 mt-1">
                        {availableSubmissionFormats.map((formatOption) => (
                            <div key={formatOption.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`format-${formatOption.id}`}
                                checked={field.value?.includes(formatOption.id)}
                                onCheckedChange={(checked) => {
                                return checked
                                    ? field.onChange([...(field.value || []), formatOption.id])
                                    : field.onChange(
                                        (field.value || []).filter(
                                        (value) => value !== formatOption.id
                                        )
                                    );
                                }}
                            />
                            <Label htmlFor={`format-${formatOption.id}`} className="font-normal cursor-pointer">
                                {formatOption.label}
                            </Label>
                            </div>
                        ))}
                        </div>
                    )}
                />
                {form.formState.errors.allowedSubmissionFormats && <p className="text-sm text-destructive mt-1">{form.formState.errors.allowedSubmissionFormats.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isSubmitting || pageOverallLoading || teacherClasses.length === 0}>
              {isSubmitting ? <Loader size="small" className="mr-2" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Create Assignment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

