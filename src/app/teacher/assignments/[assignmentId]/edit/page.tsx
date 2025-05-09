
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, CalendarIcon, CheckSquare, Square, Edit3, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClassWithTeacherInfo, SubmissionFormat, Assignment } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const assignmentEditSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  classId: z.string().min(1, "Please select a class."), // Class cannot be changed after creation for simplicity
  deadlineDate: z.date({ required_error: "Deadline date is required." }),
  deadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  allowedSubmissionFormats: z.array(z.enum(['text_entry', 'file_link'])).min(1, "Select at least one submission format."),
});

type AssignmentEditFormValues = z.infer<typeof assignmentEditSchema>;

const availableSubmissionFormats: { id: SubmissionFormat; label: string }[] = [
  { id: 'text_entry', label: 'Text Entry' },
  { id: 'file_link', label: 'File Link (e.g., Google Drive, Dropbox)' },
];

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const { currentUser, getAssignmentById, updateAssignment, getClassesByTeacher, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignmentEditFormValues>({
    resolver: zodResolver(assignmentEditSchema),
    defaultValues: {
      title: '',
      description: '',
      classId: '',
      deadlineDate: undefined,
      deadlineTime: '23:59',
      allowedSubmissionFormats: ['text_entry'],
    },
  });

  const fetchAssignmentAndClasses = useCallback(async () => {
    if (!currentUser?.uid || !assignmentId) {
        setIsLoadingPage(false);
        return;
    }
    setIsLoadingPage(true);
    try {
      const [fetchedAssignment, fetchedClasses] = await Promise.all([
        getAssignmentById(assignmentId),
        getClassesByTeacher(currentUser.uid)
      ]);
      
      if (fetchedAssignment) {
        if (fetchedAssignment.teacherId !== currentUser.uid && currentUser.role !== 'admin') {
          toast({ title: "Unauthorized", description: "You cannot edit this assignment.", variant: "destructive" });
          router.push('/teacher/assignments');
          return;
        }
        setCurrentAssignment(fetchedAssignment);
        const deadlineDate = fetchedAssignment.deadline.toDate();
        form.reset({
          title: fetchedAssignment.title,
          description: fetchedAssignment.description,
          classId: fetchedAssignment.classId,
          deadlineDate: deadlineDate,
          deadlineTime: format(deadlineDate, "HH:mm"),
          allowedSubmissionFormats: fetchedAssignment.allowedSubmissionFormats,
        });
      } else {
        toast({ title: "Not Found", description: "Assignment not found.", variant: "destructive" });
        router.push('/teacher/assignments');
      }
      setTeacherClasses(fetchedClasses);

    } catch (error) {
        toast({ title: "Error", description: "Failed to load assignment data.", variant: "destructive" });
    } finally {
        setIsLoadingPage(false);
    }
  }, [currentUser, assignmentId, getAssignmentById, getClassesByTeacher, form, router, toast]);

  useEffect(() => {
    fetchAssignmentAndClasses();
  }, [fetchAssignmentAndClasses]);

  async function onSubmit(values: AssignmentEditFormValues) {
    if (!currentAssignment) return;
    setIsSubmitting(true);

    const [hours, minutes] = values.deadlineTime.split(':').map(Number);
    const deadline = new Date(values.deadlineDate);
    deadline.setHours(hours, minutes, 0, 0);

    const updatedData = {
      title: values.title,
      description: values.description,
      // classId is not changeable in this form for simplicity, could be added
      deadline: deadline,
      allowedSubmissionFormats: values.allowedSubmissionFormats,
    };

    const success = await updateAssignment(currentAssignment.id, updatedData);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Assignment Updated!", description: `"${values.title}" has been successfully updated.` });
      router.push(`/teacher/assignments/${currentAssignment.id}`);
    } else {
      toast({ title: "Update Failed", description: "Could not update assignment. Please try again.", variant: "destructive" });
    }
  }
  
  const pageOverallLoading = authLoading || isLoadingPage;

   if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentAssignment) {
    return <div className="text-center p-4">Assignment data could not be loaded.</div>;
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()} className="mb-4 button-shadow">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      <Card className="w-full max-w-2xl mx-auto card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><Edit3 className="mr-2 h-6 w-6 text-primary"/>Edit Assignment</CardTitle>
          <CardDescription>Modify the details for the assignment: {currentAssignment.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description / Instructions</Label>
              <Textarea id="description" {...form.register("description")} rows={5} />
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="classId">Class (Cannot be changed)</Label>
               <Input id="classIdDisplay" value={teacherClasses.find(c => c.id === form.getValues("classId"))?.name || 'N/A'} readOnly className="bg-muted/50" />
               {form.formState.errors.classId && <p className="text-sm text-destructive mt-1">{form.formState.errors.classId.message}</p>}
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
                <Label>Allowed Submission Formats</Label>
                <Controller
                    name="allowedSubmissionFormats"
                    control={form.control}
                    render={({ field }) => (
                        <div className="space-y-2 mt-1">
                        {availableSubmissionFormats.map((formatOption) => (
                            <div key={formatOption.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`format-edit-${formatOption.id}`}
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
                            <Label htmlFor={`format-edit-${formatOption.id}`} className="font-normal">
                                {formatOption.label}
                            </Label>
                            </div>
                        ))}
                        </div>
                    )}
                />
                {form.formState.errors.allowedSubmissionFormats && <p className="text-sm text-destructive mt-1">{form.formState.errors.allowedSubmissionFormats.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isSubmitting || pageOverallLoading || !form.formState.isDirty}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
