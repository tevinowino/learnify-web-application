
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookCopy, Users, ArrowRight, Edit3, Library } from 'lucide-react';
import type { ClassWithTeacherInfo } from '@/types';
import Link from 'next/link';

export default function TeacherClassesPage() {
  const { currentUser, getClassesByTeacher, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchTeacherClasses = useCallback(async () => {
    if (currentUser?.uid) {
      setIsLoadingPage(true);
      const teacherClasses = await getClassesByTeacher(currentUser.uid);
      // Sort classes by name client-side as orderBy was removed from service
      teacherClasses.sort((a, b) => a.name.localeCompare(b.name));
      setClasses(teacherClasses);
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getClassesByTeacher, authLoading]);

  useEffect(() => {
    fetchTeacherClasses();
  }, [fetchTeacherClasses]);

  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <p className="text-center text-destructive">You must be logged in to view this page.</p>;
  }
  
  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Classes</h1>
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><BookCopy className="mr-2 h-5 w-5 text-primary" />No Classes Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are not currently assigned to any classes. Please contact your school administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Classes</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(classItem => (
          <Card key={classItem.id} className="card-shadow hover:border-primary/80 transition-all duration-200 flex flex-col">
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
              <CardDescription>
                {classItem.studentIds?.length || 0} student(s) enrolled.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
               <p className="text-sm text-muted-foreground">Manage materials and assignments for this class.</p>
            </CardContent>
            <CardContent className="pt-0">
              <Button asChild className="w-full button-shadow bg-primary hover:bg-primary/90">
                <Link href={`/teacher/classes/${classItem.id}`}>
                  View Class Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

