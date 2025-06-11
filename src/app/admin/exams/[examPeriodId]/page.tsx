
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, FilePieChart, CalendarDays, CheckCircle, Settings2 } from 'lucide-react';
import type { ExamPeriodWithClassNames, ExamResultWithStudentInfo, UserProfileWithId, Subject } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Loader from '@/components/shared/Loader'; // Import new Loader
import FinalizeExamPeriodDialog from '../components/FinalizeExamPeriodDialog';


export default function ExamPeriodDetailPage() {
  const params = useParams<{ examPeriodId: string }>();
  const router = useRouter();
  const examPeriodId = params.examPeriodId;
  const { toast } = useToast();

  const { 
    currentUser, 
    getExamPeriodById, 
    getStudentsInClass,
    getSubjectsBySchool, 
    getExamResultsByPeriodAndClass,
    updateExamPeriod,
    addActivity,
    loading: authLoading 
  } = useAuth();

  const [examPeriod, setExamPeriod] = useState<ExamPeriodWithClassNames | null>(null);
  const [classResultStatus, setClassResultStatus] = useState<Record<string, Record<string, { submitted: number, total: number }>>>({}); 
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);


  const fetchData = useCallback(async () => {
    if (!examPeriodId || !currentUser?.schoolId) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const [periodDetails, subjects] = await Promise.all([
         getExamPeriodById(examPeriodId),
         getSubjectsBySchool(currentUser.schoolId)
      ]);

      if (!periodDetails || periodDetails.schoolId !== currentUser.schoolId) {
        toast({ title: "Error", description: "Exam period not found or not authorized.", variant: "destructive" });
        router.push('/admin/exams');
        return;
      }
      setExamPeriod(periodDetails);
      setSchoolSubjects(subjects);

      if (periodDetails.assignedClassIds && periodDetails.assignedClassIds.length > 0 && subjects.length > 0) {
        const statusMap: Record<string, Record<string, { submitted: number, total: number }>> = {};
        for (const classId of periodDetails.assignedClassIds) {
          statusMap[classId] = {};
          const studentsInClass = await getStudentsInClass(classId);
          for (const subject of subjects) {
             const results = await getExamResultsByPeriodAndClass(examPeriodId, classId, currentUser.schoolId, subject.id);
             statusMap[classId][subject.id] = { submitted: results.length, total: studentsInClass.length };
          }
        }
        setClassResultStatus(statusMap);
      }

    } catch (error) {
      console.error("Failed to fetch exam period data:", error);
      toast({title:"Error", description:"Could not load exam period details.", variant:"destructive"});
    } finally {
      setIsLoadingPage(false);
    }
  }, [examPeriodId, currentUser, getExamPeriodById, getStudentsInClass, getSubjectsBySchool, getExamResultsByPeriodAndClass, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const checkAllResultsSubmitted = () => {
    if (!examPeriod || schoolSubjects.length === 0) return true; // If no subjects, technically all are "submitted"
    for (const classId of examPeriod.assignedClassIds) {
        for (const subject of schoolSubjects) {
            const status = classResultStatus[classId]?.[subject.id];
            if (!status || status.submitted < status.total) {
                return false;
            }
        }
    }
    return true;
  };
  
  const openFinalizeDialog = () => {
    setIsFinalizeDialogOpen(true);
  };

  const handleConfirmFinalize = async () => {
    if (!examPeriod || examPeriod.status === 'completed') return;
    setIsFinalizing(true);
    setIsFinalizeDialogOpen(false);
    const success = await updateExamPeriod(examPeriod.id, { status: 'completed' });
    if (success) {
      toast({ title: "Exam Period Finalized!", description: `"${examPeriod.name}" has been marked as completed.` });
      setExamPeriod(prev => prev ? { ...prev, status: 'completed' } : null);
      if(currentUser?.schoolId && currentUser.displayName && examPeriod.name) {
        addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'exam_period_finalized',
          message: `${currentUser.displayName} finalized exam period "${examPeriod.name}".`,
          link: `/admin/exams/${examPeriod.id}`
        });
      }
    } else {
      toast({ title: "Error", description: "Failed to finalize exam period.", variant: "destructive" });
    }
    setIsFinalizing(false);
  };

  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading exam details..." size="large" />
      </div>
    );
  }

  if (!examPeriod) {
    return <div className="text-center p-4">Exam period not found.</div>;
  }
  
  const isPastEndDate = examPeriod.endDate.toDate() < new Date();
  const canFinalize = (examPeriod.status === 'active' || examPeriod.status === 'grading') && isPastEndDate;


  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/admin/exams')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exam Periods
      </Button>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <CardTitle className="text-2xl sm:text-3xl flex items-center"><FilePieChart className="mr-3 h-7 w-7 text-primary" /> {examPeriod.name}</CardTitle>
              <CardDescription>
                Status: <Badge variant={examPeriod.status === 'completed' ? 'default' : 'secondary'} className={examPeriod.status === 'completed' ? "bg-green-500 hover:bg-green-600" : ""}>{examPeriod.status.toUpperCase()}</Badge>
              </CardDescription>
            </div>
            {canFinalize && (
              <Button onClick={openFinalizeDialog} disabled={isFinalizing} className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground mt-2 sm:mt-0">
                {isFinalizing && <Loader size="small" className="mr-2"/>}
                <CheckCircle className="mr-2 h-4 w-4"/> Finalize Exam Period
              </Button>
            )}
             {examPeriod.status === 'completed' && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 mt-2 sm:mt-0 text-base px-3 py-1.5 self-start">
                    <CheckCircle className="mr-2 h-4 w-4"/> Completed
                </Badge>
            )}
             {examPeriod.status === 'upcoming' && (
                 <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0 button-shadow">
                     <Link href={`/admin/exams/${examPeriod.id}/edit`}>Edit Period</Link>
                 </Button>
             )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Dates: {format(examPeriod.startDate.toDate(), 'PPP')} - {format(examPeriod.endDate.toDate(), 'PPP')}</span>
          </div>
          <div>
            <h4 className="font-semibold text-md">Assigned Classes:</h4>
            {examPeriod.assignedClassNames && examPeriod.assignedClassNames.length > 0 ? (
                <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground">
                    {examPeriod.assignedClassNames.map((name, idx) => <li key={idx}>{name}</li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground">No classes assigned.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
            <CardTitle className="flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/>Result Submission Status</CardTitle>
            <CardDescription>Track which classes and subjects have results submitted.</CardDescription>
        </CardHeader>
        <CardContent>
            {examPeriod.assignedClassIds.length === 0 && <p className="text-muted-foreground">No classes assigned to this exam period.</p>}
            {schoolSubjects.length === 0 && examPeriod.assignedClassIds.length > 0 && <p className="text-muted-foreground">No subjects configured for the school to track results.</p>}
            
            <div className="space-y-4">
                {examPeriod.assignedClassIds.map(classId => {
                    const className = examPeriod.assignedClassNames?.find((name, idx) => examPeriod.assignedClassIds[idx] === classId) || classId;
                    return (
                        <Card key={classId} className="bg-muted/30">
                            <CardHeader><CardTitle className="text-lg">{className}</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {schoolSubjects.map(subject => {
                                    const status = classResultStatus[classId]?.[subject.id];
                                    const submittedCount = status?.submitted || 0;
                                    const totalStudents = status?.total || 0;
                                    const progress = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
                                    const isComplete = submittedCount === totalStudents && totalStudents > 0;
                                    return (
                                        <div key={subject.id} className="p-2 border rounded-md">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-sm">{subject.name}</span>
                                                <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-500 hover:bg-green-600" : ""}>
                                                    {submittedCount} / {totalStudents} Submitted
                                                </Badge>
                                            </div>
                                            <div className="w-full bg-secondary rounded-full h-2.5">
                                                <div className={`h-2.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {schoolSubjects.length === 0 && <p className="text-xs text-muted-foreground">No subjects to display results for.</p>}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </CardContent>
      </Card>
      <FinalizeExamPeriodDialog
        isOpen={isFinalizeDialogOpen}
        onOpenChange={setIsFinalizeDialogOpen}
        onConfirm={handleConfirmFinalize}
        examPeriodName={examPeriod.name}
        allResultsSubmitted={checkAllResultsSubmitted()}
        isFinalizing={isFinalizing}
      />
    </div>
  );
}
