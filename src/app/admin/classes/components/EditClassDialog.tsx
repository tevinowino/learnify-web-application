
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Edit, RefreshCw, Copy, ShieldCheck } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId, ClassType, Subject } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';


interface EditClassDialogProps {
  classItem: ClassWithTeacherInfo;
  teachers: UserProfileWithId[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClass: (classId: string, data: Partial<Pick<ClassWithTeacherInfo, 'name' | 'teacherId' | 'classType' | 'compulsorySubjectIds' | 'subjectId'>>) => Promise<boolean>;
  onRegenerateCode: (classId: string) => Promise<string | null>;
  onSuccess: () => void;
}

const NO_TEACHER_VALUE = "__NO_TEACHER__";

export default function EditClassDialog({ 
  classItem, 
  teachers, 
  isOpen, 
  onOpenChange, 
  onUpdateClass,
  onRegenerateCode,
  onSuccess 
}: EditClassDialogProps) {
  const { toast } = useToast();
  const { getSubjectsBySchool, currentUser } = useAuth();
  const [editedClassName, setEditedClassName] = useState('');
  const [selectedTeacherForEditClass, setSelectedTeacherForEditClass] = useState<string | undefined>(undefined);
  const [selectedClassType, setSelectedClassType] = useState<ClassType>('main');
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [selectedCompulsorySubjectIds, setSelectedCompulsorySubjectIds] = useState<string[]>([]);
  const [selectedSubjectIdForClass, setSelectedSubjectIdForClass] = useState<string | undefined>(undefined);

  const [currentClassInviteCode, setCurrentClassInviteCode] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolSubjects = async () => {
      if (currentUser?.schoolId && isOpen) { // Fetch only if dialog is open
        const subjects = await getSubjectsBySchool(currentUser.schoolId);
        setSchoolSubjects(subjects);
      }
    };
    fetchSchoolSubjects();
  }, [isOpen, currentUser, getSubjectsBySchool]);


  useEffect(() => {
    if (classItem) {
      setEditedClassName(classItem.name);
      setSelectedTeacherForEditClass(classItem.teacherId || undefined); 
      setSelectedClassType(classItem.classType || 'main');
      setSelectedCompulsorySubjectIds(classItem.classType === 'main' ? (classItem.compulsorySubjectIds || []) : []);
      setSelectedSubjectIdForClass(classItem.classType === 'subject_based' ? (classItem.subjectId || undefined) : undefined);
      setCurrentClassInviteCode(classItem.classInviteCode || 'N/A');
    }
  }, [classItem]);

  const handleUpdate = async () => {
    if (!editedClassName.trim()) {
      toast({ title: "Missing Information", description: "Class name cannot be empty.", variant: "destructive" });
      return;
    }
    if (selectedClassType === 'subject_based' && !selectedSubjectIdForClass) {
      toast({ title: "Missing Information", description: "Please select a subject for this subject-based class.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const teacherIdToSave = selectedTeacherForEditClass === NO_TEACHER_VALUE ? undefined : selectedTeacherForEditClass;
    const success = await onUpdateClass(classItem.id, { 
      name: editedClassName, 
      teacherId: teacherIdToSave,
      classType: selectedClassType,
      compulsorySubjectIds: selectedClassType === 'main' ? selectedCompulsorySubjectIds : [],
      subjectId: selectedClassType === 'subject_based' ? selectedSubjectIdForClass : null,
    });
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Class Updated!", description: `"${editedClassName}" has been successfully updated.` });
      onOpenChange(false);
      onSuccess();
    } else {
      toast({ title: "Error", description: "Failed to update class.", variant: "destructive" });
    }
  };

  const handleRegenerate = async () => {
    setIsRegeneratingCode(true);
    const newCode = await onRegenerateCode(classItem.id);
    if (newCode) {
      setCurrentClassInviteCode(newCode);
      toast({ title: "Invite Code Regenerated!" });
      onSuccess(); 
    } else {
      toast({ title: "Error Regenerating Code", variant: "destructive" });
    }
    setIsRegeneratingCode(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCompulsorySubjectToggle = (subjectId: string) => {
    setSelectedCompulsorySubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Class: {classItem.name}</DialogTitle>
          <DialogDescription>Modify the class details below.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-class-name" className="text-right col-span-1">Name</Label>
            <Input 
              id="edit-class-name" 
              value={editedClassName}
              onChange={(e) => setEditedClassName(e.target.value)}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-class-type" className="text-right col-span-1">Type</Label>
             <Select onValueChange={(value) => setSelectedClassType(value as ClassType)} value={selectedClassType}>
                <SelectTrigger id="edit-class-type" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="main">Main Class</SelectItem>
                    <SelectItem value="subject_based">Subject-Based Class</SelectItem>
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
                        id={`edit-compulsory-${subject.id}`}
                        checked={selectedCompulsorySubjectIds.includes(subject.id)}
                        onCheckedChange={() => handleCompulsorySubjectToggle(subject.id)}
                        />
                        <Label htmlFor={`edit-compulsory-${subject.id}`} className="font-normal cursor-pointer">{subject.name}</Label>
                    </div>
                )) : <p className="text-xs text-muted-foreground">No subjects defined.</p>}
              </div>
            </div>
          )}

          {selectedClassType === 'subject_based' && (
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-class-subject" className="text-right col-span-1">Subject</Label>
                <Select onValueChange={setSelectedSubjectIdForClass} value={selectedSubjectIdForClass}>
                    <SelectTrigger id="edit-class-subject" className="col-span-3">
                        <SelectValue placeholder="Select subject" />
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
            <Label htmlFor="edit-class-teacher" className="text-right col-span-1">Teacher</Label>
            <Select 
              onValueChange={setSelectedTeacherForEditClass} 
              value={selectedTeacherForEditClass}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Assign a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEACHER_VALUE}>No Teacher Assigned</SelectItem>
                 {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="class-invite-code" className="text-right col-span-1">Invite Code</Label>
            <div className="col-span-3 flex items-center gap-2">
                <Input id="class-invite-code" value={currentClassInviteCode} readOnly className="bg-muted/50 flex-grow"/>
                <Button variant="outline" size="icon" onClick={() => currentClassInviteCode && handleCopy(currentClassInviteCode)} disabled={!currentClassInviteCode || copiedCode === currentClassInviteCode}>
                    {copiedCode === currentClassInviteCode ? <ShieldCheck className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4"/>}
                </Button>
                <Button variant="outline" size="icon" onClick={handleRegenerate} disabled={isRegeneratingCode}>
                    {isRegeneratingCode ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}
                </Button>
            </div>
          </div>
        </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleUpdate} disabled={isSubmitting || !editedClassName.trim() || (selectedClassType === 'subject_based' && !selectedSubjectIdForClass)}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    