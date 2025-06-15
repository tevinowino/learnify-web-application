
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, CalendarIcon, CheckSquare, Users, Building, University, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClassWithTeacherInfo, ExamPeriod, ExamPeriodStatus } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Timestamp } from 'firebase/firestore';
import Loader from '@/components/shared/Loader';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const examPeriodEditSchema = z.object({
  name: z.string().min(3, "Exam period name must be at least 3 characters."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  assignmentScope: z.enum(['specific_classes', 'form_grade', 'entire_school']).default('specific_classes'),
  selectedFormGrade: z.string().optional().nullable(),
  assignedClassIds: z.array(z.string()).optional().default([]),
  status: z.enum(['upcoming', 'active', 'grading', 'completed']), // Added status
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

type ExamPeriodEditFormValues = z.infer<typeof examPeriodEditSchema>;

const getUniqueFormGradeLevels = (classes: ClassWithTeacherInfo[]): string[] => {
    const formGradeSet = new Set<string>();
    classes.forEach(cls => {
        if (cls.classType === 'main') {
            const match = cls.name.match(/^(Form\s*\d+|Grade\s*\d+)/i);
            if (match && match[0]) {
                formGradeSet.add(match[0].trim());
            }
        }
    });
    return Array.from(formGradeSet).sort();
};


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
  const [formGradeLevels, setFormGradeLevels] = useState<string[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExamPeriodEditFormValues>({
    resolver: zodResolver(examPeriodEditSchema),
    defaultValues: {
      name: '',
      startDate: undefined,
      endDate: undefined,
      assignmentScope: 'specific_classes',
      selectedFormGrade: undefined,
      assignedClassIds: [],
      status: 'upcoming',
    },
  });

  const assignmentScope = form.watch("assignmentScope");
  const currentFormStatus = form.watch("status");

  const fetchSchoolClasses = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingClasses(true);
      const classes = await getClassesBySchool(currentUser.schoolId);
      const mainClasses = classes.filter(c => c.classType === 'main').sort((a,b) => a.name.localeCompare(b.name));
      setAllSchoolClasses(mainClasses);
      setFormGradeLevels(getUniqueFormGradeLevels(mainClasses));
      setIsLoadingClasses(false);
    }
  }, [currentUser, getClassesBySchool]);

  useEffect(() => {
    if(isOpen) fetchSchoolClasses();
  }, [isOpen, fetchSchoolClasses]);

  useEffect(() => {
    if (examPeriod) {
      form.reset({
        name: examPeriod.name,
        startDate: examPeriod.startDate.toDate(),
        endDate: examPeriod.endDate.toDate(),
        assignmentScope: examPeriod.assignmentScope || 'specific_classes',
        selectedFormGrade: (examPeriod.assignmentScope === 'form_grade' && examPeriod.scopeDetail) ? examPeriod.scopeDetail : undefined,
        assignedClassIds: (examPeriod.assignmentScope === 'specific_classes' ? examPeriod.assignedClassIds : []) || [],
        status: examPeriod.status,
      });
    }
  }, [examPeriod, form, isOpen]);

  async function onSubmit(values: ExamPeriodEditFormValues) {
    if (!examPeriod || !currentUser?.schoolId) return;
    
    if (examPeriod.status === 'completed') {
        toast({ title: "Cannot Edit", description: "Completed exam periods cannot be modified.", variant: "destructive" });
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
     if (finalAssignedClassIds.length === 0 && values.assignmentScope !== 'entire_school') { // Allow entire school to be empty if no main classes
        toast({ title: "No Classes Assigned", description: "Ensure classes are selected or correctly configured for the chosen scope.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const updatedData: Partial<ExamPeriod> = {
      name: values.name,
      startDate: Timestamp.fromDate(values.startDate),
      endDate: Timestamp.fromDate(values.endDate),
      assignedClassIds: finalAssignedClassIds,
      assignmentScope: values.assignmentScope,
      scopeDetail: values.assignmentScope === 'form_grade' ? values.selectedFormGrade : null,
      status: values.status,
    };

    const success = await updateExamPeriod(examPeriod.id, updatedData);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Exam Period Updated!", description: `"${values.name}" has been successfully updated.` });
      onSuccess();
      onOpenChange(false);
      if (currentUser.displayName) {
        let activityMessage = `${currentUser.displayName} updated exam period "${values.name}".`;
        if (values.status !== examPeriod.status) {
            activityMessage = `${currentUser.displayName} updated status of exam period "${values.name}" to ${values.status.toUpperCase()}.`;
        }
        addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'exam_period_updated',
          message: activityMessage,
          link: `/admin/exams/${examPeriod.id}`
        });
      }
    } else {
      toast({ title: "Update Failed", description: "Could not update exam period.", variant: "destructive" });
    }
  }

  if (!examPeriod) return null;

  const canEditDetails = examPeriod.status === 'upcoming';
  const canEditStatus = examPeriod.status !== 'completed';
  const canSaveChanges = form.formState.isDirty && examPeriod.status !== 'completed';

  const getStatusOptions = () => {
    if (examPeriod.status === 'upcoming') {
        return [
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'active', label: 'Active' },
            { value: 'grading', label: 'Grading' },
        ];
    }
    if (examPeriod.status === 'active') {
        return [
            { value: 'active', label: 'Active' },
            { value: 'grading', label: 'Grading' },
        ];
    }
    if (examPeriod.status === 'grading') {
         return [
            { value: 'grading', label: 'Grading' },
            { value: 'active', label: 'Active (Re-open)' }, // Allow reverting to active if needed
        ];
    }
    return [{value: examPeriod.status, label: examPeriod.status.charAt(0).toUpperCase() + examPeriod.status.slice(1)}]; // Should not happen if completed
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset(); 
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Exam Period: {examPeriod.name}</DialogTitle>
          <DialogDescription>
            Modify the details for this exam period. Details (name, dates, scope, classes) can only be changed if the period is 'Upcoming'. 
            Status can be changed if the period is not 'Completed'.
          </DialogDescription>
        </DialogHeader>
        {isLoadingClasses ? <div className="flex justify-center py-4"><Loader message="Loading classes..." /></div> : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="edit-name">Exam Period Name</Label>
            <Input id="edit-name" {...form.register("name")} readOnly={!canEditDetails} className={!canEditDetails ? "bg-muted/50" : ""}/>
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
                              className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"} ${!canEditDetails && "bg-muted/50"}`}
                              disabled={!canEditDetails}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={!canEditDetails}/>
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
                              className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"} ${!canEditDetails && "bg-muted/50"}`}
                              disabled={!canEditDetails}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => !canEditDetails || (form.getValues("startDate") ? date < form.getValues("startDate") : false)}/>
                          </PopoverContent>
                      </Popover>
                  )}
              />
              {form.formState.errors.endDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <Label>Current Status</Label>
            <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditStatus}>
                        <SelectTrigger className={!canEditStatus ? "bg-muted/50" : ""}>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {getStatusOptions().map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {form.formState.errors.status && <p className="text-sm text-destructive mt-1">{form.formState.errors.status.message}</p>}
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
                                form.setValue('assignedClassIds', []);
                                form.setValue('selectedFormGrade', undefined);
                            }}
                            value={field.value}
                            className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
                            disabled={!canEditDetails}
                        >
                            <Label htmlFor="edit-scope-specific" className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 ${!canEditDetails ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} has-[:checked]:bg-primary/10 has-[:checked]:border-primary`}>
                                <RadioGroupItem value="specific_classes" id="edit-scope-specific" disabled={!canEditDetails}/>
                                <Users className="h-4 w-4 mr-1"/> Specific Classes
                            </Label>
                            <Label htmlFor="edit-scope-form" className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 ${!canEditDetails ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} has-[:checked]:bg-primary/10 has-[:checked]:border-primary`}>
                                <RadioGroupItem value="form_grade" id="edit-scope-form" disabled={!canEditDetails}/>
                                 <Building className="h-4 w-4 mr-1"/> Form/Grade
                            </Label>
                            <Label htmlFor="edit-scope-school" className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 ${!canEditDetails ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} has-[:checked]:bg-primary/10 has-[:checked]:border-primary`}>
                                <RadioGroupItem value="entire_school" id="edit-scope-school" disabled={!canEditDetails}/>
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
                                disabled={!canEditDetails}
                                />
                                <Label htmlFor={`edit-class-${cls.id}`} className={`font-normal ${!canEditDetails ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
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
            )}

            {assignmentScope === 'form_grade' && (
                 <div>
                    <Label htmlFor="editSelectedFormGrade">Select Form/Grade Level</Label>
                    <Controller
                        name="selectedFormGrade"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!canEditDetails || formGradeLevels.length === 0}>
                                <SelectTrigger id="editSelectedFormGrade" className={!canEditDetails ? "bg-muted/50" : ""}>
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
                     {formGradeLevels.length === 0 && <p className="text-xs text-muted-foreground mt-1">No distinct form/grade levels found.</p>}
                     {form.formState.errors.selectedFormGrade && <p className="text-sm text-destructive mt-1">{form.formState.errors.selectedFormGrade.message}</p>}
                </div>
            )}
            {assignmentScope === 'entire_school' && (
                 <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">This exam period will be assigned to all main classes in the school.</p>
            )}

          {examPeriod.status === 'completed' && <p className="text-sm text-destructive mt-2">This exam period is completed and cannot be edited further.</p>}
        
        <DialogFooter className="mt-4">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting || isLoadingClasses || !canSaveChanges} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? <Loader size="small" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

