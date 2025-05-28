
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ListChecks, CheckSquare, Clock, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import type { AssignmentWithClassAndSubmissionInfo, ClassWithTeacherInfo, UserProfileWithId } from '@/types';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import { useRouter } from 'next/navigation';

export default function ParentChildAssignmentsPage() {
  const { 
    currentUser, 
    getClassesByIds, 
    getAssignmentsForStudentByClass, 
    getUserProfile,
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [childProfile, setChildProfile] = useState<UserProfileWithId | null>(null);
  const [allChildAssignments, setAllChildAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentUser?.childStudentId) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const child = await getUserProfile(currentUser.childStudentId);
      setChildProfile(child);

      if (child && child.classIds && child.classIds.length > 0 && child.uid) {
        const childClasses = await getClassesByIds(child.classIds);
        let assignmentsFromAllClasses: AssignmentWithClassAndSubmissionInfo[] = [];
        for (const cls of childClasses) {
          const classAssignments = await getAssignmentsForStudentByClass(cls.id, child.uid);
          assignmentsFromAllClasses = [...assignmentsFromAllClasses, ...classAssignments];
        }
        assignmentsFromAllClasses.sort((a, b) => b.deadline.toMillis() - a.deadline.toMillis());
        setAllChildAssignments(assignmentsFromAllClasses);
      } else {
        setAllChildAssignments([]);
      }
    } catch (error) {
      console.error("Failed to fetch child's assignments data:", error);
      toast({ title: "Error", description: "Could not load child's assignments.", variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [currentUser, getUserProfile, getClassesByIds, getAssignmentsForStudentByClass, toast]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser, fetchData]);

  const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late', deadline?: Timestamp) => {
    let effectiveStatus = status;
    if (deadline && effectiveStatus !== 'graded' && effectiveStatus !== 'missing' && new Date() > deadline.toDate()) {
        if (effectiveStatus === 'submitted') effectiveStatus = 'late';
        // if no submission by deadline, it remains 'missing' which implies late too.
    }

    switch (effectiveStatus) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs"><CheckSquare className="mr-1 h-3 w-3"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary" className="text-xs"><Clock className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive" className="text-xs"><AlertTriangle className="mr-1 h-3 w-3"/>Late</Badge>;
        case 'missing': default: return <Badge variant="outline" className="text-xs">Missing</Badge>;
    }
  };
  
  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading assignments..." size="large" />
      </div>
    );
  }

  if (!currentUser?.childStudentId) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Child Not Linked</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please link your child's account on your profile page to view their assignments.</p>
          <Button asChild className="mt-4 button-shadow">
            <Link href="/parent/profile">Go to Profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/parent/dashboard')} className="mb-4 button-shadow">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      <h1 className="text-3xl font-bold">Child's Assignments: {childProfile?.displayName || "Your Child"}</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Assignment Overview</CardTitle>
          <CardDescription>Keep track of {childProfile?.displayName || "your child"}'s upcoming and past assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {allChildAssignments.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No assignments found for {childProfile?.displayName || "your child"}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allChildAssignments.map(assignment => (
                <Card key={assignment.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{assignment.title}</CardTitle>
                            <CardDescription>
                                Class: {assignment.className || 'N/A'} | Subject: {assignment.subjectName || 'N/A'} <br />
                                Due: {format(assignment.deadline.toDate(), 'PPp')} ({formatDistanceToNow(assignment.deadline.toDate(), { addSuffix: true })})
                            </CardDescription>
                        </div>
                        <div className="mt-2 sm:mt-0">
                            {getStatusBadge(assignment.submissionStatus, assignment.deadline)}
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                    {assignment.submissionGrade && <p className="text-sm mt-1">Grade: <span className="font-semibold">{assignment.submissionGrade}</span></p>}
                  </CardContent>
                  {/* Parents typically don't need a "View Details" button that links to submission page, but could link to a read-only view if desired */}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
