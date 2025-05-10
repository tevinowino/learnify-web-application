
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManageStudentsDialogProps {
  classItem: ClassWithTeacherInfo | null;
  schoolId: string | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrollStudent: (classId: string, studentId: string) => Promise<boolean>;
  onRemoveStudent: (classId: string, studentId: string) => Promise<boolean>;
  getStudentsInClass: (classId: string) => Promise<UserProfileWithId[]>;
  getStudentsNotInClass: (schoolId: string, classId: string) => Promise<UserProfileWithId[]>;
  onSuccess: () => void; // To refresh parent data
}

export default function ManageStudentsDialog({
  classItem,
  schoolId,
  isOpen,
  onOpenChange,
  onEnrollStudent,
  onRemoveStudent,
  getStudentsInClass,
  getStudentsNotInClass,
  onSuccess,
}: ManageStudentsDialogProps) {
  const { toast } = useToast();
  const [studentsInCurrentClass, setStudentsInCurrentClass] = useState<UserProfileWithId[]>([]);
  const [studentsAvailableForClass, setStudentsAvailableForClass] = useState<UserProfileWithId[]>([]);
  const [isLoadingStudentsDialog, setIsLoadingStudentsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!classItem || !schoolId) return;
    setIsLoadingStudentsDialog(true);
    const [enrolled, available] = await Promise.all([
      getStudentsInClass(classItem.id),
      getStudentsNotInClass(schoolId, classItem.id)
    ]);
    setStudentsInCurrentClass(enrolled);
    setStudentsAvailableForClass(available);
    setIsLoadingStudentsDialog(false);
  }, [classItem, schoolId, getStudentsInClass, getStudentsNotInClass]);

  useEffect(() => {
    if (isOpen && classItem) {
      fetchStudents();
    }
  }, [isOpen, classItem, fetchStudents]);

  const handleEnroll = async (studentId: string) => {
    if (!classItem) return;
    setIsSubmitting(true);
    const success = await onEnrollStudent(classItem.id, studentId);
    if (success) {
      toast({ title: "Student Enrolled", description: "Student added to class." });
      fetchStudents();
      onSuccess();
    } else {
      toast({ title: "Enrollment Failed", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleRemove = async (studentId: string) => {
    if (!classItem) return;
    setIsSubmitting(true);
    const success = await onRemoveStudent(classItem.id, studentId);
    if (success) {
      toast({ title: "Student Removed", description: "Student removed from class." });
      fetchStudents();
      onSuccess();
    } else {
      toast({ title: "Removal Failed", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (!classItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Students for: {classItem.name}</DialogTitle>
          <DialogDescription>Enroll or remove students from this class.</DialogDescription>
        </DialogHeader>
        {isLoadingStudentsDialog ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh]">
            <div>
              <h3 className="font-semibold mb-2 text-lg">Enrolled Students ({studentsInCurrentClass.length})</h3>
              <ScrollArea className="h-[40vh] border rounded-md p-2">
                {studentsInCurrentClass.length === 0 && <p className="text-sm text-muted-foreground p-2">No students enrolled yet.</p>}
                {studentsInCurrentClass.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                    <span>{student.displayName} ({student.email})</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(student.id)} disabled={isSubmitting} title="Remove from class">
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Available Students ({studentsAvailableForClass.length})</h3>
              <ScrollArea className="h-[40vh] border rounded-md p-2">
                {studentsAvailableForClass.length === 0 && <p className="text-sm text-muted-foreground p-2">No other students available in the school.</p>}
                {studentsAvailableForClass.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                    <span>{student.displayName} ({student.email})</span>
                    <Button variant="ghost" size="sm" onClick={() => handleEnroll(student.id)} disabled={isSubmitting} title="Enroll in class">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
