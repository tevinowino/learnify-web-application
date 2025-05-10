
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Edit, RefreshCw, Copy, ShieldCheck } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId } from '@/types';
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

interface EditClassDialogProps {
  classItem: ClassWithTeacherInfo;
  teachers: UserProfileWithId[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClass: (classId: string, data: { name: string; teacherId?: string }) => Promise<boolean>;
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
  const [editedClassName, setEditedClassName] = useState('');
  const [selectedTeacherForEditClass, setSelectedTeacherForEditClass] = useState<string | undefined>(undefined);
  const [currentClassInviteCode, setCurrentClassInviteCode] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (classItem) {
      setEditedClassName(classItem.name);
      // If teacherId is null/undefined, selectedTeacherForEditClass becomes undefined, showing placeholder.
      // If teacherId exists, it's set. If user then selects "No Teacher", it becomes NO_TEACHER_VALUE.
      setSelectedTeacherForEditClass(classItem.teacherId || undefined); 
      setCurrentClassInviteCode(classItem.classInviteCode || 'N/A');
    }
  }, [classItem]);

  const handleUpdate = async () => {
    if (!editedClassName.trim()) {
      toast({ title: "Missing Information", description: "Class name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const teacherIdToSave = selectedTeacherForEditClass === NO_TEACHER_VALUE ? undefined : selectedTeacherForEditClass;
    const success = await onUpdateClass(classItem.id, { name: editedClassName, teacherId: teacherIdToSave });
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
      onSuccess(); // To refresh parent list if needed
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


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Class: {classItem.name}</DialogTitle>
          <DialogDescription>Modify the class details below.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="edit-class-name" className="text-right col-span-1">Name</label>
            <Input 
              id="edit-class-name" 
              value={editedClassName}
              onChange={(e) => setEditedClassName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="edit-class-teacher" className="text-right col-span-1">Teacher</label>
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
            <label htmlFor="class-invite-code" className="text-right col-span-1">Invite Code</label>
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
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleUpdate} disabled={isSubmitting || !editedClassName.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
