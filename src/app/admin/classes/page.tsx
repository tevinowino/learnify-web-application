
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, BookCopy, Trash2, Edit, UserPlus, UserMinus, Users, ShieldCheck, Briefcase } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId } from '@/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';


export default function ManageClassesPage() {
  const { 
    currentUser, 
    createClassInSchool, 
    getClassesBySchool, 
    updateClassDetails, 
    deleteClass,
    getUsersBySchoolAndRole,
    enrollStudentInClass,
    removeStudentFromClass,
    getStudentsInClass,
    getStudentsNotInClass,
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [teachers, setTeachers] = useState<UserProfileWithId[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for "Create Class" Dialog
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherForNewClass, setSelectedTeacherForNewClass] = useState<string | undefined>(undefined);
  const [isCreateClassDialogOpen, setIsCreateClassDialogOpen] = useState(false);

  // State for "Edit Class" Dialog
  const [editingClass, setEditingClass] = useState<ClassWithTeacherInfo | null>(null);
  const [editedClassName, setEditedClassName] = useState('');
  const [selectedTeacherForEditClass, setSelectedTeacherForEditClass] = useState<string | undefined>(undefined);

  // State for "Manage Students" Dialog
  const [managingStudentsClass, setManagingStudentsClass] = useState<ClassWithTeacherInfo | null>(null);
  const [studentsInCurrentClass, setStudentsInCurrentClass] = useState<UserProfileWithId[]>([]);
  const [studentsAvailableForClass, setStudentsAvailableForClass] = useState<UserProfileWithId[]>([]);
  const [isLoadingStudentsDialog, setIsLoadingStudentsDialog] = useState(false);


  const fetchClassesAndTeachers = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingPage(true);
      const [schoolClasses, schoolTeachers] = await Promise.all([
        getClassesBySchool(currentUser.schoolId),
        getUsersBySchoolAndRole(currentUser.schoolId, 'teacher')
      ]);
      setClasses(schoolClasses);
      setTeachers(schoolTeachers);
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getClassesBySchool, getUsersBySchoolAndRole, authLoading]);

  useEffect(() => {
    fetchClassesAndTeachers();
  }, [fetchClassesAndTeachers]);

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !currentUser?.schoolId) {
      toast({ title: "Missing Information", description: "Please provide a class name.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const classId = await createClassInSchool(newClassName, currentUser.schoolId, selectedTeacherForNewClass);
    setIsSubmitting(false);
    if (classId) {
      toast({ title: "Class Created!", description: `"${newClassName}" has been successfully created.` });
      setNewClassName('');
      setSelectedTeacherForNewClass(undefined);
      setIsCreateClassDialogOpen(false);
      fetchClassesAndTeachers(); // Refresh list
    } else {
      toast({ title: "Error", description: "Failed to create class. Please try again.", variant: "destructive" });
    }
  };

  const openEditClassDialog = (classItem: ClassWithTeacherInfo) => {
    setEditingClass(classItem);
    setEditedClassName(classItem.name);
    setSelectedTeacherForEditClass(classItem.teacherId || undefined);
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !editedClassName.trim()) {
      toast({ title: "Missing Information", description: "Class name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const success = await updateClassDetails(editingClass.id, { name: editedClassName, teacherId: selectedTeacherForEditClass });
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Class Updated!", description: `"${editedClassName}" has been successfully updated.` });
      setEditingClass(null);
      fetchClassesAndTeachers(); // Refresh
    } else {
      toast({ title: "Error", description: "Failed to update class.", variant: "destructive" });
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete the class "${className}"? This action cannot be undone.`)) return;
    setIsSubmitting(true);
    const success = await deleteClass(classId);
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Class Deleted!", description: `"${className}" has been successfully deleted.` });
      fetchClassesAndTeachers(); // Refresh
    } else {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    }
  };

  const openManageStudentsDialog = async (classItem: ClassWithTeacherInfo) => {
    setManagingStudentsClass(classItem);
    setIsLoadingStudentsDialog(true);
    if (currentUser?.schoolId) {
      const [enrolled, available] = await Promise.all([
        getStudentsInClass(classItem.id),
        getStudentsNotInClass(currentUser.schoolId, classItem.id)
      ]);
      setStudentsInCurrentClass(enrolled);
      setStudentsAvailableForClass(available);
    }
    setIsLoadingStudentsDialog(false);
  };

  const handleEnrollStudent = async (studentId: string) => {
    if (!managingStudentsClass) return;
    setIsSubmitting(true); // Consider a specific loader for this action
    const success = await enrollStudentInClass(managingStudentsClass.id, studentId);
    if (success) {
      toast({ title: "Student Enrolled", description: "Student added to class."});
      // Refresh student lists for the dialog
      if (currentUser?.schoolId && managingStudentsClass) {
        const [enrolled, available] = await Promise.all([
          getStudentsInClass(managingStudentsClass.id),
          getStudentsNotInClass(currentUser.schoolId, managingStudentsClass.id)
        ]);
        setStudentsInCurrentClass(enrolled);
        setStudentsAvailableForClass(available);
        fetchClassesAndTeachers(); // Refresh class list to update student count
      }
    } else {
      toast({ title: "Enrollment Failed", variant: "destructive"});
    }
    setIsSubmitting(false);
  };
  
  const handleRemoveStudent = async (studentId: string) => {
    if (!managingStudentsClass) return;
    setIsSubmitting(true);
    const success = await removeStudentFromClass(managingStudentsClass.id, studentId);
     if (success) {
      toast({ title: "Student Removed", description: "Student removed from class."});
      if (currentUser?.schoolId && managingStudentsClass) {
         const [enrolled, available] = await Promise.all([
          getStudentsInClass(managingStudentsClass.id),
          getStudentsNotInClass(currentUser.schoolId, managingStudentsClass.id)
        ]);
        setStudentsInCurrentClass(enrolled);
        setStudentsAvailableForClass(available);
        fetchClassesAndTeachers();
      }
    } else {
      toast({ title: "Removal Failed", variant: "destructive"});
    }
    setIsSubmitting(false);
  };


  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser?.schoolId) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>School Not Assigned</CardTitle>
          <CardDescription>
            You need to be part of a school to manage classes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Classes</h1>
        <Dialog open={isCreateClassDialogOpen} onOpenChange={setIsCreateClassDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 button-shadow">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Enter the details for the new class.
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
              <Button onClick={handleCreateClass} disabled={isSubmitting || !newClassName.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><BookCopy className="mr-2 h-5 w-5 text-primary" />School Classes ({classes.length})</CardTitle>
          <CardDescription>List of all classes in your school. You can edit details or delete them.</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No classes found. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map(classItem => (
                <Card key={classItem.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle>{classItem.name}</CardTitle>
                      <CardDescription>
                        Teacher: {classItem.teacherDisplayName || 'Not Assigned'} <br />
                        Students: {classItem.studentIds?.length || 0}
                      </CardDescription>
                    </div>
                     <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditClassDialog(classItem)} className="button-shadow">
                              <Edit className="mr-1 h-3 w-3"/> Edit
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(classItem.id, classItem.name)} disabled={isSubmitting} className="button-shadow">
                          <Trash2 className="mr-1 h-3 w-3"/> Delete
                        </Button>
                      </div>
                  </CardHeader>
                  <CardFooter>
                     <Button variant="secondary" size="sm" onClick={() => openManageStudentsDialog(classItem)} className="button-shadow">
                        <Users className="mr-2 h-4 w-4"/> Manage Students
                      </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Class Dialog */}
      {editingClass && (
        <Dialog open={!!editingClass} onOpenChange={(isOpen) => !isOpen && setEditingClass(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Class: {editingClass.name}</DialogTitle>
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
                <Select onValueChange={setSelectedTeacherForEditClass} value={selectedTeacherForEditClass}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Assign a teacher" />
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
              <DialogClose asChild><Button variant="outline" onClick={() => setEditingClass(null)}>Cancel</Button></DialogClose>
              <Button onClick={handleUpdateClass} disabled={isSubmitting || !editedClassName.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Manage Students Dialog */}
      {managingStudentsClass && (
        <Dialog open={!!managingStudentsClass} onOpenChange={(isOpen) => !isOpen && setManagingStudentsClass(null)}>
          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Students for: {managingStudentsClass.name}</DialogTitle>
              <DialogDescription>Enroll or remove students from this class.</DialogDescription>
            </DialogHeader>
            {isLoadingStudentsDialog ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh]">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Enrolled Students ({studentsInCurrentClass.length})</h3>
                <ScrollArea className="h-[40vh] border rounded-md p-2">
                  {studentsInCurrentClass.length === 0 && <p className="text-sm text-muted-foreground p-2">No students enrolled yet.</p>}
                  {studentsInCurrentClass.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                      <span>{student.displayName} ({student.email})</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveStudent(student.id)} disabled={isSubmitting} title="Remove from class">
                        <UserMinus className="h-4 w-4 text-destructive"/>
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
                       <Button variant="ghost" size="sm" onClick={() => handleEnrollStudent(student.id)} disabled={isSubmitting} title="Enroll in class">
                        <UserPlus className="h-4 w-4 text-primary"/>
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
      )}

    </div>
  );
}
