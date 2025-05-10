
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Edit3, Users, CalendarDays, CheckCircle, XCircle, Clock, ArrowLeft, MessageSquare, Save, Link as LinkIcon } from 'lucide-react';
import type { AssignmentWithClassInfo, SubmissionWithStudentName, SubmissionFormat } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from '@/components/ui/label';

export default function TeacherAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const { toast } = useToast();

  const { 
    currentUser, 
    getAssignmentById, 
    getSubmissionsForAssignment,
    gradeSubmission,
    loading: authLoading 
  } = useAuth();

  const [assignment, setAssignment] = useState<AssignmentWithClassInfo | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudentName[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isGrading, setIsGrading] = useState<string | null>(null); 
  
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<SubmissionWithStudentName | null>(null);


  const fetchData = useCallback(async () => {
    if (!assignmentId || !currentUser) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const [fetchedAssignment, fetchedSubmissions] = await Promise.all([
        getAssignmentById(assignmentId),
        getSubmissionsForAssignment(assignmentId)
      ]);

      if (fetchedAssignment && fetchedAssignment.teacherId !== currentUser.uid && currentUser.role !== 'admin') {
        router.push('/teacher/assignments');
        toast({title:"Unauthorized", description:"You are not authorized to view this assignment.", variant:"destructive"});
        return;
      }
      
      setAssignment(fetchedAssignment);
      // Sort submissions client-side as orderBy was removed from service
      setSubmissions(fetchedSubmissions.sort((a,b) => (a.studentDisplayName || "").localeCompare(b.studentDisplayName || "")));

    } catch (error) {
      console.error("Failed to fetch assignment data:", error);
      toast({title:"Error", description:"Could not load assignment details.", variant:"destructive"});
    } finally {
      setIsLoadingPage(false);
    }
  }, [assignmentId, currentUser, getAssignmentById, getSubmissionsForAssignment, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openGradingDialog = (submission: SubmissionWithStudentName) => {
    setSelectedSubmissionForGrading(submission);
    setGradeInput(submission.grade?.toString() || '');
    setFeedbackInput(submission.feedback || '');
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmissionForGrading || !gradeInput.trim()) {
      toast({title: "Missing Grade", description: "Please enter a grade.", variant:"destructive"});
      return;
    }
    setIsGrading(selectedSubmissionForGrading.id);
    const success = await gradeSubmission(selectedSubmissionForGrading.id, gradeInput, feedbackInput);
    if (success) {
      toast({title: "Submission Graded!", description: "The grade and feedback have been saved."});
      setSelectedSubmissionForGrading(null); 
      fetchData(); 
    } else {
      toast({title: "Grading Failed", description: "Could not save the grade. Please try again.", variant: "destructive"});
    }
    setIsGrading(null);
  };

  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Go Back</Button>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusBadge = (status: SubmissionWithStudentName['status'], submittedAt: any, deadline: any) => {
    let effectiveStatus = status;
    if (status === 'submitted' && submittedAt.toDate() > deadline.toDate()) {
        effectiveStatus = 'late';
    }

    switch(effectiveStatus) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3"/>Late</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(assignment.classId ? `/teacher/classes/${assignment.classId}` : '/teacher/assignments')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl flex items-center"><Edit3 className="mr-3 h-8 w-8 text-primary" /> {assignment.title}</CardTitle>
              <CardDescription>Class: <Link href={`/teacher/classes/${assignment.classId}`} className="hover:underline text-primary">{assignment.className || 'N/A'}</Link></CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="button-shadow">
                <Link href={`/teacher/assignments/${assignment.id}/edit`}>Edit Assignment</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            Deadline: {format(assignment.deadline.toDate(), 'PPpp')}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Allowed formats: {assignment.allowedSubmissionFormats.map(f => f === 'text_entry' ? 'Text Entry' : 'File Link').join(', ')}
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Submissions ({submissions.length} / {assignment.totalSubmissions || submissions.length})</CardTitle>
          <CardDescription>Review and grade student submissions for this assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground">No submissions yet for this assignment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(submission => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.studentDisplayName} <span className="text-xs text-muted-foreground">({submission.studentEmail})</span></TableCell>
                    <TableCell>{format(submission.submittedAt.toDate(), 'PPp')}</TableCell>
                    <TableCell>{getStatusBadge(submission.status, submission.submittedAt, assignment.deadline)}</TableCell>
                    <TableCell>{submission.grade ?? 'Not Graded'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openGradingDialog(submission)} className="button-shadow">
                        {submission.status === 'graded' ? 'View/Edit Grade' : 'Grade'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedSubmissionForGrading && (
        <Dialog open={!!selectedSubmissionForGrading} onOpenChange={(isOpen) => !isOpen && setSelectedSubmissionForGrading(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Grade Submission: {selectedSubmissionForGrading.studentDisplayName}</DialogTitle>
              <DialogDescription>
                Assignment: {assignment.title} <br/>
                Submitted: {format(selectedSubmissionForGrading.submittedAt.toDate(), 'PPp')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h4 className="font-semibold mb-1">Submission Content ({selectedSubmissionForGrading.submissionType === 'text_entry' ? 'Text' : 'Link'}):</h4>
                {selectedSubmissionForGrading.submissionType === 'text_entry' ? (
                  <Card className="p-3 bg-muted/50 max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedSubmissionForGrading.content}</p>
                  </Card>
                ) : (
                  <Button variant="link" asChild className="p-0 h-auto">
                    <a href={selectedSubmissionForGrading.content} target="_blank" rel="noopener noreferrer" className="break-all">
                      {selectedSubmissionForGrading.content} <LinkIcon className="inline h-4 w-4 ml-1"/>
                    </a>
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input 
                  id="grade" 
                  value={gradeInput} 
                  onChange={(e) => setGradeInput(e.target.value)} 
                  placeholder="e.g., A+, 95, Pass" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea 
                  id="feedback" 
                  value={feedbackInput} 
                  onChange={(e) => setFeedbackInput(e.target.value)} 
                  placeholder="Provide constructive feedback..." 
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleGradeSubmit} disabled={isGrading === selectedSubmissionForGrading.id || !gradeInput.trim()}>
                {isGrading === selectedSubmissionForGrading.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

