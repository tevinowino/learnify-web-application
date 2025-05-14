
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
import { Loader2, Save, CalendarIcon, CheckSquare, Square, Edit3, ArrowLeft, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClassWithTeacherInfo, SubmissionFormat, Assignment, Subject } from '@/types';
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
import Loader from '@/components/shared/Loader';

const assignmentEditSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  classId: z.string().min(1, "Please select a class."), 
  subjectId: z.string().optional(), 
  deadlineDate: z.date({ required_error: "Deadline date is required." }),
  deadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  allowedSubmissionFormats: z.array(z.enum(['text_entry', 'file_link', 'file_upload'])).min(1, "Select at least one submission format."),
  attachment: z.instanceof(File).optional().nullable(), 
  existingAttachmentUrl: z.string().optional().nullable(),
  originalFileName: z.string().optional().nullable(), // Added
});

type AssignmentEditFormValues = z.infer<typeof assignmentEditSchema>;

const availableSubmissionFormats: { id: SubmissionFormat; label: string }[] = [
  { id: 'text_entry', label: 'Text Entry' },
  { id: 'file_link', label: 'File Link (e.g., Google Drive, Dropbox)' },
  { id: 'file_upload', label: 'File Upload (PDF, DOCX, etc.)' },
];

const NO_SUBJECT_VALUE = "__NO_SUBJECT__";

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const { currentUser, getAssignmentById, updateAssignment, getClassesByTeacher, getSubjectsBySchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]); 
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignmentEditFormValues>({
    resolver: zodResolver(assignmentEditSchema),
    defaultValues: {
      title: '',
      description: '',
      classId: '',
      subjectId: undefined, 
      deadlineDate: undefined,
      deadlineTime: '23:59',
      allowedSubmissionFormats: ['text_entry'],
      attachment: null, 
      existingAttachmentUrl: null,
      originalFileName: null, // Added
    },
  });

  const fetchAssignmentAndRelatedData = useCallback(async () => { 
    if (!currentUser?.uid || !assignmentId) {
        setIsLoadingPage(false);
        return;
    }
    setIsLoadingPage(true);
    try {
      const [fetchedAssignment, fetchedClasses, fetchedSubjects] = await Promise.all([ 
        getAssignmentById(assignmentId),
        getClassesByTeacher(currentUser.uid),
        getSubjectsBySchool(currentUser.schoolId || '') 
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
          subjectId: fetchedAssignment.subjectId || undefined, 
          deadlineDate: deadlineDate,
          deadlineTime: format(deadlineDate, "HH:mm"),
          allowedSubmissionFormats: fetchedAssignment.allowedSubmissionFormats,
          attachment: null, 
          existingAttachmentUrl: fetchedAssignment.attachmentUrl || null,
          originalFileName: fetchedAssignment.originalFileName || null, // Added
        });
      } else {
        toast({ title: "Not Found", description: "Assignment not found.", variant: "destructive" });
        router.push('/teacher/assignments');
      }
      setTeacherClasses(fetchedClasses);
      setSchoolSubjects(fetchedSubjects); 

    } catch (error) {
        toast({ title: "Error", description: "Failed to load assignment data.", variant: "destructive" });
    } finally {
        setIsLoadingPage(false);
    }
  }, [currentUser, assignmentId, getAssignmentById, getClassesByTeacher, getSubjectsBySchool, form, router, toast]); 

  useEffect(() => {
    fetchAssignmentAndRelatedData();
  }, [fetchAssignmentAndRelatedData]);

  async function onSubmit(values: AssignmentEditFormValues) {
    if (!currentAssignment) return;
    setIsSubmitting(true);

    const [hours, minutes] = values.deadlineTime.split(':').map(Number);
    const deadline = new Date(values.deadlineDate);
    deadline.setHours(hours, minutes, 0, 0);

    const updatedData: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'totalSubmissions' | 'attachmentUrl' | 'schoolId'>> = {
      title: values.title,
      description: values.description,
      deadline: deadline,
      allowedSubmissionFormats: values.allowedSubmissionFormats,
      subjectId: values.subjectId === NO_SUBJECT_VALUE ? null : values.subjectId,
      classId: values.classId, 
    };
    
    const success = await updateAssignment(
        currentAssignment.id, 
        currentAssignment.title, 
        updatedData, 
        values.attachment || undefined,
        values.existingAttachmentUrl || null
    );
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
        <Loader message="Loading assignment..." size="large"/>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classId">Class (Cannot be changed)</Label>
                <Input id="classIdDisplay" value={teacherClasses.find(c => c.id === form.getValues("classId"))?.name || 'N/A'} readOnly className="bg-muted/50" />
                {form.formState.errors.classId && <p className="text-sm text-destructive mt-1">{form.formState.errors.classId.message}</p>}
              </div>
              <div>
                <Label htmlFor="subjectIdEdit">Subject (Optional)</Label>
                <Controller
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? NO_SUBJECT_VALUE}>
                      <SelectTrigger id="subjectIdEdit">
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
                            <Label htmlFor={`format-edit-${formatOption.id}`} className="font-normal cursor-pointer">
                                {formatOption.label}
                            </Label>
                            </div>
                        ))}
                        </div>
                    )}
                />
                {form.formState.errors.allowedSubmissionFormats && <p className="text-sm text-destructive mt-1">{form.formState.errors.allowedSubmissionFormats.message}</p>}
            </div>

            <div>
              <Label htmlFor="attachmentEdit">Attach/Replace File (Optional)</Label>
              {form.getValues("existingAttachmentUrl") && (
                 <p className="text-xs text-muted-foreground mt-1">
                    Current attachment: <a href={form.getValues("existingAttachmentUrl")!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{form.getValues("originalFileName") || "View File"}</a>
                 </p>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                <Controller
                  control={form.control}
                  name="attachment"
                   render={({ field: { onChange, value, ...restField } }) => (
                    <Input 
                      id="attachmentEdit" 
                      type="file" 
                      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                      className="flex-grow"
                      {...restField}
                    />
                  )}
                />
              </div>
              {form.getValues("attachment") && <p className="text-xs text-muted-foreground mt-1">New file selected: {form.getValues("attachment")?.name}</p>}
              {form.formState.errors.attachment && <p className="text-sm text-destructive mt-1">{form.formState.errors.attachment.message}</p>}
            </div>


            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 button-shadow" disabled={isSubmitting || pageOverallLoading || !form.formState.isDirty}>
              {isSubmitting ? <Loader size="small" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
               Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

