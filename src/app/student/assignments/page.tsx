
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ListChecks, CheckSquare, Clock, AlertTriangle, Filter, Search } from 'lucide-react';
import type { AssignmentWithClassAndSubmissionInfo, ClassWithTeacherInfo } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from '@/components/shared/Loader'; 

export default function StudentAllAssignmentsPage() {
  const { currentUser, getClassesByIds, getAssignmentsForStudentByClass, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [allAssignments, setAllAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentUser?.uid || !currentUser.classIds) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const classes = await getClassesByIds(currentUser.classIds);
      setEnrolledClasses(classes);

      let assignmentsFromAllClasses: AssignmentWithClassAndSubmissionInfo[] = [];
      for (const cls of classes) {
        const classAssignments = await getAssignmentsForStudentByClass(cls.id, currentUser.uid);
        assignmentsFromAllClasses = [...assignmentsFromAllClasses, ...classAssignments];
      }
      assignmentsFromAllClasses.sort((a, b) => b.deadline.toMillis() - a.deadline.toMillis());
      setAllAssignments(assignmentsFromAllClasses);
      setFilteredAssignments(assignmentsFromAllClasses);

    } catch (error) {
      console.error("Failed to fetch assignments data:", error);
      toast({ title: "Error", description: "Could not load assignments.", variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [currentUser, getClassesByIds, getAssignmentsForStudentByClass, toast]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser, fetchData]);

  useEffect(() => {
    let tempAssignments = [...allAssignments];
    if (selectedClassFilter !== 'all') {
      tempAssignments = tempAssignments.filter(a => a.classId === selectedClassFilter);
    }
    if (selectedStatusFilter !== 'all') {
      tempAssignments = tempAssignments.filter(a => a.submissionStatus === selectedStatusFilter);
    }
    tempAssignments.sort((a,b) => a.deadline.toMillis() - b.deadline.toMillis());
    setFilteredAssignments(tempAssignments);
  }, [selectedClassFilter, selectedStatusFilter, allAssignments]);


  const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late') => {
    switch(status) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckSquare className="mr-1 h-3 w-3"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3"/>Late</Badge>;
        case 'missing': default: return <Badge variant="outline">Missing</Badge>;
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Assignments</h1>
      
      <Card className="card-shadow">
        <CardHeader>
            <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary"/>Filters</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Select onValueChange={setSelectedClassFilter} value={selectedClassFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {enrolledClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Select onValueChange={setSelectedStatusFilter} value={selectedStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">
                {allAssignments.length === 0 ? "Great job, no assignments pending or you're all caught up!" : "No assignments match your current filters."}
              </p>
              {allAssignments.length > 0 && (
                <p className="text-muted-foreground mt-2">Try adjusting the filters or check back later for new tasks.</p>
              )}
              <Button asChild className="mt-4 button-shadow">
                <Link href="/student/resources">Explore Learning Resources</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map(assignment => (
                <Card key={assignment.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                            <Link href={`/student/assignments/${assignment.id}`} className="hover:underline">
                                <CardTitle className="text-xl">{assignment.title}</CardTitle>
                            </Link>
                            <CardDescription>
                                Class: {assignment.className || 'N/A'} <br />
                                Due: {format(assignment.deadline.toDate(), 'PPp')}
                            </CardDescription>
                        </div>
                        <div className="mt-2 sm:mt-0">
                            {getStatusBadge(assignment.submissionStatus)}
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                    {assignment.submissionGrade && <p className="text-sm mt-1">Grade: <span className="font-semibold">{assignment.submissionGrade}</span></p>}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm" className="button-shadow">
                        <Link href={`/student/assignments/${assignment.id}`}>
                            {assignment.submissionStatus === 'missing' ? 'Submit / View' : 'View Details'}
                        </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
