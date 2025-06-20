
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, FilePieChart, CalendarDays, CheckCircle, Settings2, FileText } from 'lucide-react';
import type { ExamPeriodWithClassNames, ExamResultWithStudentInfo, UserProfileWithId, Subject } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Loader from '@/components/shared/Loader'; 
import FinalizeExamPeriodDialog from '../components/FinalizeExamPeriodDialog';
import EditExamPeriodDialog from './components/EditExamPeriodDialog';


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
    addNotification, 
    getLinkedParentForStudent, 
    loading: authLoading 
  } = useAuth();

  const [examPeriod, setExamPeriod] = useState<ExamPeriodWithClassNames | null>(null);
  const [classResultStatus, setClassResultStatus] = useState<Record<string, Record<string, { submitted: number, total: number }>>>({}); 
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isEditExamPeriodDialogOpen, setIsEditExamPeriodDialogOpen] = useState(false);


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
    if (!examPeriod || schoolSubjects.length === 0) return true; 
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
    if (!examPeriod || examPeriod.status === 'completed' || !currentUser || !currentUser.schoolId) return;
    setIsFinalizing(true);
    setIsFinalizeDialogOpen(false);
    const success = await updateExamPeriod(examPeriod.id, { status: 'completed' });
    if (success) {
      toast({ title: "Exam Period Finalized!", description: `"${examPeriod.name}" has been marked as completed.` });
      setExamPeriod(prev => prev ? { ...prev, status: 'completed' } : null);
      if(currentUser.displayName && examPeriod.name) {
        await addActivity({
          schoolId: currentUser.schoolId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          type: 'exam_period_finalized',
          message: `${currentUser.displayName} finalized exam period "${examPeriod.name}".`,
          link: `/admin/exams/${examPeriod.id}`
        });

        for (const classId of examPeriod.assignedClassIds) {
          const studentsInClass = await getStudentsInClass(classId);
          for (const student of studentsInClass) {
            await addNotification({
              userId: student.id,
              schoolId: currentUser.schoolId,
              message: `Results for exam period "${examPeriod.name}" are now available.`,
              type: 'exam_period_finalized',
              link: `/student/results`,
              actorName: 'School Administration'
            });

            const parent = await getLinkedParentForStudent(student.id);
            if (parent && parent.schoolId === currentUser.schoolId) {
              await addNotification({
                userId: parent.id,
                schoolId: currentUser.schoolId,
                message: `Results for ${student.displayName} for exam period "${examPeriod.name}" are now available.`,
                type: 'exam_period_finalized',
                link: `/parent/results`,
                actorName: 'School Administration'
              });
            }
          }
        }
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
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              {canFinalize && (
                <Button onClick={openFinalizeDialog} disabled={isFinalizing} className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isFinalizing && <Loader size="small" className="mr-2"/>}
                  <CheckCircle className="mr-2 h-4 w-4"/> Finalize Exam Period
                </Button>
              )}
              {examPeriod.status === 'completed' && (
                  <>
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-base px-3 py-1.5 self-start">
                      <CheckCircle className="mr-2 h-4 w-4"/> Completed
                  </Badge>
                  <Button variant="secondary" asChild className="button-shadow">
                   <Link href={`/admin/exams/${examPeriod.id}/results-sheet`}>
                     <FileText className="mr-2 h-4 w-4" /> View Results Sheets
                   </Link>
                 </Button>
                 </>
              )}
              {(examPeriod.status === 'upcoming' || examPeriod.status === 'active' || examPeriod.status === 'grading') && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditExamPeriodDialogOpen(true)} className="button-shadow">
                      Edit Period
                  </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Dates: {format(examPeriod.startDate.toDate(), 'PPP')} - {format(examPeriod.endDate.toDate(), 'PPP')}</span>
          </div>
          <div>
            <h4 className="font-semibold text-md">Assigned To:</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {examPeriod.assignmentScope?.replace('_', ' ') || 'Specific Classes'}
              {examPeriod.assignmentScope === 'form_grade' && examPeriod.scopeDetail && `: ${examPeriod.scopeDetail}`}
            </p>
            {examPeriod.assignmentScope !== 'entire_school' && (
              <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground">
                  {examPeriod.assignedClassNames && examPeriod.assignedClassNames.length > 0 ? (
                      examPeriod.assignedClassNames.map((name, idx) => <li key={idx}>{name}</li>)
                  ): (
                      <li>No specific classes listed.</li>
                  )}
              </ul>
            )}
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
      <EditExamPeriodDialog
        examPeriod={examPeriod}
        isOpen={isEditExamPeriodDialogOpen}
        onOpenChange={setIsEditExamPeriodDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}

