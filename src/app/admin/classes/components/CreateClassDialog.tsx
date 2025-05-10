
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import type { UserProfileWithId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateClassDialogProps {
  teachers: UserProfileWithId[];
  schoolId: string;
  onCreateClass: (className: string, schoolId: string, teacherId?: string) => Promise<string | null>;
  onSuccess: () => void; // Callback for after successful creation
}

export default function CreateClassDialog({ teachers, schoolId, onCreateClass, onSuccess }: CreateClassDialogProps) {
  const { toast } = useToast();
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherForNewClass, setSelectedTeacherForNewClass] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    if (!newClassName.trim()) {
      toast({ title: "Missing Information", description: "Please provide a class name.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const classId = await onCreateClass(newClassName, schoolId, selectedTeacherForNewClass);
    setIsSubmitting(false);
    if (classId) {
      toast({ title: "Class Created!", description: `"${newClassName}" has been successfully created.` });
      setNewClassName('');
      setSelectedTeacherForNewClass(undefined);
      setIsOpen(false);
      onSuccess();
    } else {
      toast({ title: "Error", description: "Failed to create class. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 button-shadow">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Enter the details for the new class. An invite code will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="new-class-name" className="text-right col-span-1">Name</label>
            <Input 
              id="new-class-name" 
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="col-span-3" 
              placeholder="e.g., Grade 10 Math"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="new-class-teacher" className="text-right col-span-1">Teacher</label>
             <Select onValueChange={setSelectedTeacherForNewClass} value={selectedTeacherForNewClass}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Assign a teacher (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Teacher Assigned</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} disabled={isSubmitting || !newClassName.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
