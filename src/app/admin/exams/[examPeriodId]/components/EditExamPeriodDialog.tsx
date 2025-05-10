
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, CalendarIcon, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClassWithTeacherInfo, ExamPeriod } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Timestamp } from 'firebase/firestore';


const examPeriodEditSchema = z.object({
  name: z.string().min(3, "Exam period name must be at least 3 characters."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  assignedClassIds: z.array(z.string()).min(1, "At least one class must be assigned."),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type ExamPeriodEditFormValues = z.infer<typeof examPeriodEditSchema>;

interface EditExamPeriodDialogProps {
  examPeriod: ExamPeriod | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; 
}

export default function EditExamPeriodDialog({ examPeriod, isOpen, onOpenChange, onSuccess }: EditExamPeriodDialogProps) {
  const { currentUser, updateExamPeriod, getClassesBySchool, addActivity } = useAuth();
  const { toast } = useToast();
  const [allSchoolClasses, setAllSchoolClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExamPeriodEditFormValues>({
    resolver: zodResolver(examPeriodEditSchema),
    defaultValues: {
      name: '',
      startDate: undefined,
      endDate: undefined,
      assignedClassIds: [],
    },
  });

  const fetchSchoolClasses = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingClasses(true);
      const classes = await getClassesBySchool(currentUser.schoolId);
      setAllSchoolClasses(classes.sort((a, b) => a.name.localeCompare(b.name)));
      setIsLoadingClasses(false);
    }
  }, [currentUser, getClassesBySchool]);

  useEffect(() => {
    fetchSchoolClasses();
  }, [fetchSchoolClasses]);

  useEffect(() => {
    if (examPeriod) {
      form.reset({
        name: examPeriod.name,
        startDate: examPeriod.startDate.toDate(),
        endDate: examPeriod.endDate.toDate(),
        assignedClassIds: examPeriod.assignedClassIds || [],
      });
    }
  }, [examPeriod, form]);

  async function onSubmit(values: ExamPeriodEditFormValues) {
    if (!examPeriod || !currentUser?.schoolId) return;
    
    if (examPeriod.status === 'active' || examPeriod.status === 'completed') {
        toast({ title: "Cannot Edit", description: "Active or completed exam periods cannot be edited.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const updatedData = {
      name: values.name,
      startDate: Timestamp.fromDate(values.startDate),
      endDate: Timestamp.fromDate(values.endDate),
      assignedClassIds: values.assignedClassIds,
    };

    const success = await updateExamPeriod(examPeriod.id, updatedData);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Exam Period Updated!", description: `"${values.name}" has been successfully updated.` });
      onSuccess();
      onOpenChange(false);
      if (currentUser.displayName) {
        addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'exam_period_updated',
          message: `${currentUser.displayName} updated exam period "${values.name}".`,
          link: `/admin/exams/${examPeriod.id}`
        });
      }
    } else {
      toast({ title: "Update Failed", description: "Could not update exam period.", variant: "destructive" });
    }
  }

  if (!examPeriod) return null;

  const canEdit = examPeriod.status === 'upcoming';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset(); 
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Exam Period: {examPeriod.name}</DialogTitle>
          <DialogDescription>Modify the details for this exam period. Changes can only be made if the period is 'Upcoming'.</DialogDescription>
        </DialogHeader>
        {isLoadingClasses ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="edit-name">Exam Period Name</Label>
            <Input id="edit-name" {...form.register("name")} readOnly={!canEdit} className={!canEdit ? "bg-muted/50" : ""}/>
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-startDate">Start Date</Label>
              <Controller
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                      <Popover>
                          <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"} ${!canEdit && "bg-muted/50"}`}
                              disabled={!canEdit}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={!canEdit}/>
                          </PopoverContent>
                      </Popover>
                  )}
              />
              {form.formState.errors.startDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.startDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-endDate">End Date</Label>
              <Controller
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                      <Popover>
                          <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"} ${!canEdit && "bg-muted/50"}`}
                              disabled={!canEdit}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => !canEdit || (form.getValues("startDate") ? date < form.getValues("startDate") : false)}/>
                          </PopoverContent>
                      </Popover>
                  )}
              />
              {form.formState.errors.endDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <Label>Assign to Classes</Label>
            {allSchoolClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">No classes available.</p>
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
                              id={`edit-class-${cls.id}`}
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
                              disabled={!canEdit}
                            />
                            <Label htmlFor={`edit-class-${cls.id}`} className={`font-normal ${!canEdit ? 'text-muted-foreground' : 'cursor-pointer'}`}>
                              {cls.name}
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
          {!canEdit && <p className="text-sm text-destructive mt-2">This exam period is active or completed and cannot be edited.</p>}
        
        <DialogFooter className="mt-4">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting || isLoadingClasses || !form.formState.isDirty || !canEdit} className="bg-primary hover:bg-primary/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
