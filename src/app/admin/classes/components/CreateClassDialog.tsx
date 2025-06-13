
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import type { UserProfileWithId, ClassType, Subject } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Added DialogTrigger
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/shared/Loader'; // Import new Loader


interface CreateClassDialogProps {
  teachers: UserProfileWithId[];
  schoolId: string;
  onCreateClass: (
    className: string, 
    schoolId: string, 
    classType: ClassType, 
    teacherId?: string, 
    compulsorySubjectIds?: string[],
    subjectId?: string | null
  ) => Promise<string | null>;
  onSuccess: () => void;
}

const NO_TEACHER_VALUE = "__NO_TEACHER__";

export default function CreateClassDialog({ teachers, schoolId, onCreateClass, onSuccess }: CreateClassDialogProps) {
  const { toast } = useToast();
  const { getSubjectsBySchool } = useAuth(); 
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherForNewClass, setSelectedTeacherForNewClass] = useState<string | undefined>(undefined);
  const [selectedClassType, setSelectedClassType] = useState<ClassType>('main');
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [selectedCompulsorySubjectIds, setSelectedCompulsorySubjectIds] = useState<string[]>([]);
  const [selectedSubjectIdForClass, setSelectedSubjectIdForClass] = useState<string | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchSchoolSubjects = async () => {
      if (schoolId) {
        const subjects = await getSubjectsBySchool(schoolId);
        setSchoolSubjects(subjects);
      }
    };
    if (isOpen) { 
        fetchSchoolSubjects();
    }
  }, [isOpen, schoolId, getSubjectsBySchool]);


  const handleCreate = async () => {
    if (!newClassName.trim()) {
      toast({ title: "Missing Information", description: "Please provide a class name.", variant: "destructive" });
      return;
    }
    if (selectedClassType === 'subject_based' && !selectedSubjectIdForClass) {
      toast({ title: "Missing Information", description: "Please select a subject for this subject-based class.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const teacherIdToSave = selectedTeacherForNewClass === NO_TEACHER_VALUE ? undefined : selectedTeacherForNewClass;
    
    const classId = await onCreateClass(
      newClassName, 
      schoolId, 
      selectedClassType, 
      teacherIdToSave, 
      selectedClassType === 'main' ? selectedCompulsorySubjectIds : undefined,
      selectedClassType === 'subject_based' ? selectedSubjectIdForClass : null
    );
    setIsSubmitting(false);

    if (classId) {
      toast({ title: "Class Created!", description: `"${newClassName}" has been successfully created.` });
      setNewClassName('');
      setSelectedTeacherForNewClass(undefined);
      setSelectedClassType('main');
      setSelectedCompulsorySubjectIds([]);
      setSelectedSubjectIdForClass(undefined);
      setIsOpen(false);
      onSuccess();
    } else {
      toast({ title: "Error", description: "Failed to create class. Please try again.", variant: "destructive" });
    }
  };
  
  const handleCompulsorySubjectToggle = (subjectId: string) => {
    setSelectedCompulsorySubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 button-shadow">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Enter the details for the new class. An invite code will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-class-name" className="text-right col-span-1">Name</Label>
            <Input
              id="new-class-name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Form 2.1 or History 2.2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-class-type" className="text-right col-span-1">Type</Label>
             <Select onValueChange={(value) => setSelectedClassType(value as ClassType)} value={selectedClassType}>
                <SelectTrigger id="new-class-type" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="main">Main Class (e.g., Form 2.1)</SelectItem>
                    <SelectItem value="subject_based">Subject-Based Class (e.g., History 2.2)</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {selectedClassType === 'main' && (
            <div className="grid grid-cols-4 items-start gap-4 pt-2">
              <Label className="text-right col-span-1 mt-2">Compulsory Subjects</Label>
              <div className="col-span-3 space-y-2 border p-2 rounded-md max-h-40 overflow-y-auto">
                {schoolSubjects.length > 0 ? schoolSubjects.map(subject => (
                    <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                        id={`compulsory-${subject.id}`}
                        checked={selectedCompulsorySubjectIds.includes(subject.id)}
                        onCheckedChange={() => handleCompulsorySubjectToggle(subject.id)}
                        />
                        <Label htmlFor={`compulsory-${subject.id}`} className="font-normal cursor-pointer">{subject.name}</Label>
                    </div>
                )) : <p className="text-xs text-muted-foreground">No subjects defined for the school yet.</p>}
              </div>
            </div>
          )}

          {selectedClassType === 'subject_based' && (
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class-subject" className="text-right col-span-1">Subject</Label>
                <Select onValueChange={setSelectedSubjectIdForClass} value={selectedSubjectIdForClass}>
                    <SelectTrigger id="class-subject" className="col-span-3">
                        <SelectValue placeholder="Select subject for this class" />
                    </SelectTrigger>
                    <SelectContent>
                        {schoolSubjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                         {schoolSubjects.length === 0 && <p className="text-xs text-muted-foreground p-2">No subjects available.</p>}
                    </SelectContent>
                </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-class-teacher" className="text-right col-span-1">Teacher</Label>
             <Select onValueChange={setSelectedTeacherForNewClass} value={selectedTeacherForNewClass}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Assign a teacher (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEACHER_VALUE}>No Teacher Assigned</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={isSubmitting || !newClassName.trim() || (selectedClassType === 'subject_based' && !selectedSubjectIdForClass)}>
            {isSubmitting && <Loader size="small" className="mr-2" />}
            Create Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
