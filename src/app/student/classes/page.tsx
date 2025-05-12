
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FolderOpen, ArrowRight, UserPlus } from 'lucide-react';
import type { ClassWithTeacherInfo } from '@/types';
import Link from 'next/link';
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
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function StudentClassesPage() {
  const { currentUser, getClassesByIds, joinClassWithCode, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [isJoinClassDialogOpen, setIsJoinClassDialogOpen] = useState(false);

  const fetchEnrolledClasses = useCallback(async () => {
    if (currentUser?.uid && currentUser.classIds && currentUser.classIds.length > 0) {
      setIsLoadingPage(true);
      const classes = await getClassesByIds(currentUser.classIds);
      setEnrolledClasses(classes);
      setIsLoadingPage(false);
    } else {
      setEnrolledClasses([]); 
      setIsLoadingPage(false);
    }
  }, [currentUser, getClassesByIds]);

  useEffect(() => {
    if(!authLoading){
        fetchEnrolledClasses();
    }
  }, [authLoading, fetchEnrolledClasses]);

  const handleJoinClass = async () => {
    if (!classCodeInput.trim() || !currentUser?.uid) {
      toast({ title: "Invalid Code", description: "Please enter a class invite code.", variant: "destructive" });
      return;
    }
    setIsJoiningClass(true);
    const success = await joinClassWithCode(classCodeInput, currentUser.uid);
    setIsJoiningClass(false);
    if (success) {
      toast({ title: "Successfully Joined Class!", description: "The class has been added to your list." });
      setClassCodeInput('');
      setIsJoinClassDialogOpen(false);
      fetchEnrolledClasses(); 
    } else {
      toast({ title: "Failed to Join Class", description: "Invalid code or an error occurred. Please try again.", variant: "destructive" });
    }
  };
  
  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading && enrolledClasses.length === 0) { // Show full page loader only if no classes are yet displayed
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading your classes..." size="large" />
      </div>
    );
  }
  
  if (!currentUser) {
    return <p className="text-center text-destructive p-4">Please log in to view your classes.</p>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">My Classes</h1>
        <Dialog open={isJoinClassDialogOpen} onOpenChange={setIsJoinClassDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" /> Join New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Join a New Class</DialogTitle>
              <DialogDescription>
                Enter the invite code provided by your teacher or school administrator.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="class-code" className="text-right col-span-1">Code</label>
                <Input 
                  id="class-code" 
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                  className="col-span-3" 
                  placeholder="e.g., C-ABC123"
                  disabled={isJoiningClass}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isJoiningClass}>Cancel</Button></DialogClose>
              <Button onClick={handleJoinClass} disabled={isJoiningClass || !classCodeInput.trim()}>
                {isJoiningClass && <Loader size="small" className="mr-2" />}
                Join Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pageOverallLoading && enrolledClasses.length > 0 && ( // Show small loader if classes are already there but refreshing
        <div className="flex justify-center py-4"><Loader message="Refreshing classes..." /></div>
      )}

      {!pageOverallLoading && enrolledClasses.length === 0 && (
        <Card className="card-shadow">
           <CardHeader>
            <CardTitle className="flex items-center"><FolderOpen className="mr-2 h-5 w-5 text-primary" />No Classes Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              You are not currently enrolled in any classes. Use the "Join New Class" button to add one.
            </p>
          </CardContent>
        </Card>
      )}

      {!pageOverallLoading && enrolledClasses.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrolledClasses.map(classItem => (
            <Card key={classItem.id} className="card-shadow hover:border-primary/80 transition-all duration-200 flex flex-col">
              <CardHeader>
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>
                  Teacher: {classItem.teacherDisplayName || 'N/A'} <br />
                  Assignments: {classItem.totalAssignmentsCount || 0}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground">Access materials and assignments for this class.</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full button-shadow bg-primary hover:bg-primary/90">
                  <Link href={`/student/classes/${classItem.id}`}>
                    View Class <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
