"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle, Clock, AlertTriangle, UploadCloud, Link as LinkIcon, FileTextIcon } from 'lucide-react';
import type { AssignmentWithClassAndSubmissionInfo, Submission, SubmissionFormat } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const { toast } = useToast();

  const { 
    currentUser, 
    getAssignmentById, 
    getSubmissionByStudentForAssignment,
    addSubmission,
    loading: authLoading 
  } = useAuth();

  const [assignment, setAssignment] = useState<AssignmentWithClassAndSubmissionInfo | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionFormat>('text_entry'); // Default or based on allowed formats

  const fetchData = useCallback(async () => {
    if (!assignmentId || !currentUser?.uid) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const fetchedAssignment = await getAssignmentById(assignmentId, currentUser.uid);
      if (!fetchedAssignment) {
        toast({ title: "Not Found", description: "Assignment not found or you're not authorized.", variant: "destructive" });
        router.push('/student/assignments');
        return;
      }
      // Ensure student is enrolled in the class of this assignment
      if (!currentUser.classIds?.includes(fetchedAssignment.classId)) {
        toast({ title: "Unauthorized", description: "You are not enrolled in the class for this assignment.", variant: "destructive" });
        router.push('/student/classes');
        return;
      }
      setAssignment(fetchedAssignment);

      const fetchedSubmission = await getSubmissionByStudentForAssignment(assignmentId, currentUser.uid);
      setSubmission(fetchedSubmission);
      if (fetchedSubmission) {
        setSubmissionContent(fetchedSubmission.content);
        setSubmissionType(fetchedSubmission.submissionType);
      } else if (fetchedAssignment.allowedSubmissionFormats.length > 0) {
        setSubmissionType(fetchedAssignment.allowedSubmissionFormats[0]); // Default to first allowed type
      }

    } catch (error) {
      console.error("Failed to fetch assignment data:", error);
      toast({title:"Error", description:"Could not load assignment details.", variant:"destructive"});
    } finally {
      setIsLoadingPage(false);
    }
  }, [assignmentId, currentUser, getAssignmentById, getSubmissionByStudentForAssignment, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !currentUser?.uid || !submissionContent.trim()) {
      toast({title: "Missing Content", description: "Please enter your submission.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    const submissionData: Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback' | 'status'> = {
      assignmentId: assignment.id,
      classId: assignment.classId,
      studentId: currentUser.uid,
      content: submissionContent,
      submissionType: submissionType,
    };
    const submissionId = await addSubmission(submissionData);
    setIsSubmitting(false);
    if (submissionId) {
      toast({title: "Submission Successful!", description: "Your work has been submitted."});
      fetchData(); // Refresh data to show updated submission status
    } else {
      toast({title: "Submission Failed", description: "Could not submit your work. Please try again.", variant:"destructive"});
    }
  };

  const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late') => {
    let effectiveStatus = status;
    if(assignment && effectiveStatus !== 'graded' && effectiveStatus !== 'missing' && new Date() > assignment.deadline.toDate()){
        if(effectiveStatus === 'submitted') effectiveStatus = 'late';
        // else if no submission and past deadline, it's 'missing' and implicitly late.
    }

    switch(effectiveStatus) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-base px-3 py-1"><CheckCircle className="mr-2 h-4 w-4"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary" className="text-base px-3 py-1"><Clock className="mr-2 h-4 w-4"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive" className="text-base px-3 py-1"><AlertTriangle className="mr-2 h-4 w-4"/>Submitted Late</Badge>;
        case 'missing': 
        default: return <Badge variant="outline" className="text-base px-3 py-1">Not Submitted</Badge>;
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

  if (!assignment) {
    return (
      <Card className="text-center p-4">
        <CardHeader><CardTitle>Assignment Not Found</CardTitle></CardHeader>
        <CardContent><Button onClick={() => router.back()} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Go Back</Button></CardContent>
      </Card>
    );
  }
  
  const canSubmit = assignment.submissionStatus !== 'graded'; // Or more complex logic for resubmission policies

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push(`/student/classes/${assignment.classId}`)} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Class
      </Button>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-3xl">{assignment.title}</CardTitle>
              <CardDescription>
                Class: {assignment.className || 'N/A'} <br />
                Due: {format(assignment.deadline.toDate(), 'PPPP pppp')} ({formatDistanceToNow(assignment.deadline.toDate(), { addSuffix: true })})
              </CardDescription>
            </div>
            <div className="mt-2 sm:mt-0 self-start sm:self-center">
              {getStatusBadge(assignment.submissionStatus)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-1">Instructions:</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
           <div className="mt-3">
            <p className="text-sm font-medium">Allowed Submission Formats: <Badge variant="secondary">{assignment.allowedSubmissionFormats.map(f => f === 'text_entry' ? 'Text Entry' : 'File Link').join(', ')}</Badge></p>
          </div>
        </CardContent>
      </Card>

      {submission && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
             <CardDescription>Submitted on: {format(submission.submittedAt.toDate(), 'PPp')}</CardDescription>
          </CardHeader>
          <CardContent>
            {submission.submissionType === 'text_entry' ? (
                <div className="p-3 bg-muted/50 rounded-md max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                </div>
            ) : (
                 <Button variant="link" asChild className="p-0 h-auto">
                    <a href={submission.content} target="_blank" rel="noopener noreferrer" className="break-all">
                      {submission.content} <LinkIcon className="inline h-4 w-4 ml-1"/>
                    </a>
                  </Button>
            )}
            {submission.grade && <p className="mt-3 font-semibold">Grade: {submission.grade}</p>}
            {submission.feedback && (
              <div className="mt-3">
                <h4 className="font-semibold">Feedback from Teacher:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-2 border rounded-md bg-muted/30">{submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-5 w-5 text-primary"/>{submission ? 'Update Your Submission' : 'Submit Your Work'}</CardTitle>
            <CardDescription>Ensure your work meets all requirements before submitting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {assignment.allowedSubmissionFormats.length > 1 && (
                <div>
                  <Label>Submission Type</Label>
                  <div className="flex gap-4 mt-1">
                    {assignment.allowedSubmissionFormats.map(formatType => (
                      <Button 
                        key={formatType} 
                        type="button" 
                        variant={submissionType === formatType ? "default" : "outline"}
                        onClick={() => setSubmissionType(formatType)}
                      >
                        {formatType === 'text_entry' ? <FileTextIcon className="mr-2"/> : <LinkIcon className="mr-2"/>}
                        {formatType === 'text_entry' ? 'Text Entry' : 'File Link'}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="submissionContent">{submissionType === 'text_entry' ? 'Your Text Submission' : 'Link to Your File (e.g., Google Doc, PDF on Drive)'}</Label>
                {submissionType === 'text_entry' ? (
                  <Textarea 
                    id="submissionContent" 
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={10}
                    placeholder="Type your submission here..."
                    required
                  />
                ) : (
                  <Input 
                    id="submissionContent"
                    type="url"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    required
                  />
                )}
              </div>
              <Button type="submit" disabled={isSubmitting || !submissionContent.trim()} className="button-shadow">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submission ? 'Update Submission' : 'Submit Assignment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
       {!canSubmit && submission?.status === 'graded' && (
        <Card className="card-shadow bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="text-green-700 flex items-center"><CheckCircle className="mr-2 h-5 w-5"/> Assignment Graded</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-green-600">This assignment has been graded. You can review your grade and feedback above.</p>
            </CardContent>
        </Card>
       )}

    </div>
  );
}
