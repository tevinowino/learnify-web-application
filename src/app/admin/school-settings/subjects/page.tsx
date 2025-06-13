
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookText, Trash2, Edit, Search } from 'lucide-react';
import type { Subject } from '@/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import Loader from '@/components/shared/Loader';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'; // Import Tooltip components

export default function ManageSubjectsPage() {
  const { currentUser, createSubject, getSubjectsBySchool, updateSubject, deleteSubject, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


  const fetchSubjects = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingPage(true);
      const schoolSubjects = await getSubjectsBySchool(currentUser.schoolId);
      setSubjects(schoolSubjects); 
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getSubjectsBySchool, authLoading]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim() || !currentUser?.schoolId) {
      toast({ title: "Missing Information", description: "Please provide a subject name.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const subjectId = await createSubject(currentUser.schoolId, newSubjectName);
    setIsSubmitting(false);
    if (subjectId) {
      toast({ title: "Subject Created!", description: `"${newSubjectName}" has been successfully created.` });
      setNewSubjectName('');
      setIsCreateDialogOpen(false);
      fetchSubjects();
    } else {
      toast({ title: "Error", description: "Failed to create subject.", variant: "destructive" });
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setEditSubjectName(subject.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject || !editSubjectName.trim()) {
      toast({ title: "Missing Information", description: "Subject name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const success = await updateSubject(editingSubject.id, editSubjectName);
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Subject Updated!", description: `Successfully updated to "${editSubjectName}".` });
      setIsEditDialogOpen(false);
      setEditingSubject(null);
      fetchSubjects();
    } else {
      toast({ title: "Error", description: "Failed to update subject.", variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete the subject "${subjectName}"? This action cannot be undone and might affect existing class configurations or student records if the subject is in use.`)) return;
    setIsSubmitting(true); 
    const success = await deleteSubject(subjectId, subjectName);
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Subject Deleted!", description: `"${subjectName}" has been removed.` });
      fetchSubjects();
    } else {
      toast({ title: "Error", description: "Failed to delete subject. It might be in use.", variant: "destructive" });
    }
  };

  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading subjects..." size="large" />
      </div>
    );
  }
  
  if (!currentUser?.schoolId) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>School Not Assigned</CardTitle>
          <CardDescription>You need to be part of a school to manage subjects.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Manage School Subjects</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>Enter the name for the new subject.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="new-subject-name" className="sr-only">Subject Name</Label>
                <Input
                  id="new-subject-name"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g., Mathematics, History"
                  disabled={isSubmitting}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button onClick={handleCreateSubject} disabled={isSubmitting || !newSubjectName.trim()}>
                  {isSubmitting && <Loader size="small" className="mr-2" />}
                  Add Subject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><BookText className="mr-2 h-5 w-5 text-primary" />School Subjects ({subjects.length})</CardTitle>
            <CardDescription>List of all subjects offered in your school. These can be assigned to classes or chosen by students.</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">No subjects defined yet.</p>
                <p className="text-muted-foreground mt-1">Click "Add New Subject" to create the first one.</p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-3 pr-4">
                  {subjects.map(subject => (
                    <Card key={subject.id} className="flex justify-between items-center p-4 hover:border-primary/50 transition-colors">
                      <span className="font-medium">{subject.name}</span>
                      <div className="space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(subject)} className="button-shadow" disabled={isSubmitting}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Subject</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit Subject</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteSubject(subject.id, subject.name)} disabled={isSubmitting && editingSubject?.id !== subject.id} className="button-shadow"> 
                              {isSubmitting && editingSubject?.id === subject.id ? <Loader size="small"/> :<Trash2 className="h-4 w-4" />}
                              <span className="sr-only">Delete Subject</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Delete Subject</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {editingSubject && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Subject: {editingSubject.name}</DialogTitle>
                <DialogDescription>Update the subject name.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="edit-subject-name" className="sr-only">Subject Name</Label>
                <Input
                  id="edit-subject-name"
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  placeholder="e.g., Advanced Mathematics"
                  disabled={isSubmitting}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button onClick={handleUpdateSubject} disabled={isSubmitting || !editSubjectName.trim() || editSubjectName === editingSubject.name}>
                  {isSubmitting && <Loader size="small" className="mr-2" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}

