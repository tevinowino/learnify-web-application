"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit3, PlusCircle, Filter, Trash2 } from 'lucide-react';
import type { AssignmentWithClassInfo, ClassWithTeacherInfo } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';


export default function TeacherAssignmentsPage() {
  const { 
    currentUser, 
    getAssignmentsByTeacher, 
    getClassesByTeacher,
    deleteAssignment,
    getStudentsInClass, 
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<AssignmentWithClassInfo[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithClassInfo[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); 
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});


  const fetchAssignmentsAndClasses = useCallback(async () => {
    if (currentUser?.uid) {
      setIsLoadingPage(true);
      const [fetchedAssignments, fetchedClasses] = await Promise.all([
        getAssignmentsByTeacher(currentUser.uid),
        getClassesByTeacher(currentUser.uid)
      ]);
      
      const counts: Record<string, number> = {};
      for (const cls of fetchedClasses) {
        const students = await getStudentsInClass(cls.id);
        counts[cls.id] = students.length;
      }
      setStudentCounts(counts);

      // Sort assignments client-side as orderBy was removed from service
      const sortedAssignments = fetchedAssignments.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setAssignments(sortedAssignments);
      setFilteredAssignments(sortedAssignments); // Initialize filtered list
      setTeacherClasses(fetchedClasses);
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getAssignmentsByTeacher, getClassesByTeacher, getStudentsInClass, authLoading]);

  useEffect(() => {
    fetchAssignmentsAndClasses();
  }, [fetchAssignmentsAndClasses]);

  useEffect(() => {
    let tempAssignments = [...assignments];
    if (selectedClassFilter !== 'all') {
      tempAssignments = tempAssignments.filter(a => a.classId === selectedClassFilter);
    }
    // Already sorted by createdAt in fetch, further sorting by deadline if needed can be done here.
    // For now, the createdAt sort is primary.
    setFilteredAssignments(tempAssignments);
  }, [selectedClassFilter, assignments]);

  const handleDeleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Are you sure you want to delete assignment "${assignmentTitle}"? This will also delete all submissions.`)) return;
    setIsDeleting(assignmentId);
    const success = await deleteAssignment(assignmentId);
    if (success) {
      toast({ title: "Assignment Deleted", description: `"${assignmentTitle}" has been removed.` });
      fetchAssignmentsAndClasses(); 
    } else {
      toast({ title: "Deletion Failed", description: "Could not delete the assignment.", variant: "destructive" });
    }
    setIsDeleting(null);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Assignments</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
          <Link href="/teacher/assignments/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Assignment
          </Link>
        </Button>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary" />My Assignments</CardTitle>
          <CardDescription>
            View, edit, or delete assignments you've created. Filter by class.
          </CardDescription>
          <div className="pt-4">
            <label htmlFor="classFilter" className="block text-sm font-medium text-foreground mb-1">Filter by Class</label>
            <Select onValueChange={setSelectedClassFilter} value={selectedClassFilter}>
              <SelectTrigger id="classFilter" className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter by class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All My Classes</SelectItem>
                {teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Edit3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {selectedClassFilter === 'all' ? "You haven't created any assignments yet." : "No assignments found for the selected class."}
              </p>
              <Button asChild className="mt-4">
                <Link href="/teacher/assignments/create">Create First Assignment</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <Link href={`/teacher/assignments/${assignment.id}`} className="hover:underline text-primary">
                          {assignment.title}
                        </Link>
                      </TableCell>
                      <TableCell>{assignment.className || 'N/A'}</TableCell>
                      <TableCell>{format(assignment.deadline.toDate(), 'PPp')}</TableCell>
                       <TableCell>
                         <Badge variant={(assignment.totalSubmissions || 0) > 0 ? "default" : "secondary"}>
                           {assignment.totalSubmissions || 0} / {studentCounts[assignment.classId] || 0}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                         <Button variant="outline" size="sm" asChild className="button-shadow">
                           <Link href={`/teacher/assignments/${assignment.id}/edit`}>
                             <Edit3 className="mr-1 h-3 w-3"/> Edit
                           </Link>
                         </Button>
                         <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                            disabled={isDeleting === assignment.id}
                            className="button-shadow"
                          >
                           {isDeleting === assignment.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3"/>} 
                           Delete
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
