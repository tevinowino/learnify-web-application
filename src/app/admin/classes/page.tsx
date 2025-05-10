
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookCopy, Trash2, Edit, Users } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import CreateClassDialog from './components/CreateClassDialog';
import EditClassDialog from './components/EditClassDialog';
import ManageStudentsDialog from './components/ManageStudentsDialog';

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
    regenerateClassInviteCode,
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [teachers, setTeachers] = useState<UserProfileWithId[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // General submission state for delete

  const [editingClass, setEditingClass] = useState<ClassWithTeacherInfo | null>(null);
  const [managingStudentsClass, setManagingStudentsClass] = useState<ClassWithTeacherInfo | null>(null);

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

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete the class "${className}"? This action CANNOT be undone and will remove all associated assignments and student enrollments.`)) return;
    setIsSubmitting(true);
    const success = await deleteClass(classId);
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Class Deleted!", description: `"${className}" has been successfully deleted.` });
      fetchClassesAndTeachers(); 
    } else {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    }
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
        <CreateClassDialog 
          teachers={teachers} 
          schoolId={currentUser.schoolId}
          onCreateClass={createClassInSchool}
          onSuccess={fetchClassesAndTeachers}
        />
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
                        Students: {classItem.studentIds?.length || 0} <br />
                        Invite Code: {classItem.classInviteCode || 'N/A'}
                      </CardDescription>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingClass(classItem)} className="button-shadow">
                            <Edit className="mr-1 h-3 w-3"/> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(classItem.id, classItem.name)} disabled={isSubmitting} className="button-shadow">
                          <Trash2 className="mr-1 h-3 w-3"/> Delete
                        </Button>
                      </div>
                  </CardHeader>
                  <CardFooter>
                     <Button variant="secondary" size="sm" onClick={() => setManagingStudentsClass(classItem)} className="button-shadow">
                        <Users className="mr-2 h-4 w-4"/> Manage Students
                      </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingClass && (
        <EditClassDialog
          classItem={editingClass}
          teachers={teachers}
          isOpen={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
          onUpdateClass={updateClassDetails}
          onRegenerateCode={regenerateClassInviteCode}
          onSuccess={fetchClassesAndTeachers}
        />
      )}

      {managingStudentsClass && currentUser?.schoolId && (
        <ManageStudentsDialog
          classItem={managingStudentsClass}
          schoolId={currentUser.schoolId}
          isOpen={!!managingStudentsClass}
          onOpenChange={(open) => !open && setManagingStudentsClass(null)}
          onEnrollStudent={enrollStudentInClass}
          onRemoveStudent={removeStudentFromClass}
          getStudentsInClass={getStudentsInClass}
          getStudentsNotInClass={getStudentsNotInClass}
          onSuccess={fetchClassesAndTeachers}
        />
      )}
    </div>
  );
}
