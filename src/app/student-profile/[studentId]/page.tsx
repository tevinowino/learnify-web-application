
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserCircle, BookOpen, ListChecks, Trophy, Activity as ActivityIcon, ShieldAlert, ArrowLeft, Brain, Wand2, CalendarCheck } from 'lucide-react';
import type { UserProfileWithId, ClassWithTeacherInfo, AssignmentWithClassAndSubmissionInfo, ExamResultWithStudentInfo, Activity as ActivityType, Subject, AnalyzeStudentPerformanceInput, AnalyzeStudentPerformanceOutput } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentProfileHeader } from '@/components/student-profile/StudentProfileHeader';
import { StudentSubjectsCard } from '@/components/student-profile/StudentSubjectsCard';
import { StudentAssignmentsSummaryCard } from '@/components/student-profile/StudentAssignmentSummaryCard';
import { StudentExamResultsSummaryCard } from '@/components/student-profile/StudentExamResultsSummaryCard';
import { StudentActivityItem } from '@/components/student-profile/StudentActivityItem';
import Loader from '@/components/shared/Loader';


export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const studentId = params.studentId;
  const {
    currentUser: viewingUser,
    getUserProfile,
    getClassesByIds,
    getAssignmentsForStudentByClass,
    getExamResultsForStudent,
    getActivities,
    getClassesByTeacher,
    getSubjectsBySchool,
    getSubjectById,
    analyzeStudentPerformance, // New AI function
    loading: authLoading,
  } = useAuth();

  const [studentProfile, setStudentProfile] = useState<UserProfileWithId | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [mainClass, setMainClass] = useState<ClassWithTeacherInfo | null>(null);
  const [studentSubjects, setStudentSubjects] = useState<{ compulsory: Subject[], elective: Subject[] }>({ compulsory: [], elective: [] });
  const [assignments, setAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [examResults, setExamResults] = useState<ExamResultWithStudentInfo[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<string>("Not yet calculated."); // Placeholder
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeStudentPerformanceOutput | null>(null);


  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setIsLoadingPage(true);

    const profile = await getUserProfile(studentId);
    if (!profile) {
      setIsLoadingPage(false);
      // Consider showing a "Student not found" message
      return;
    }
    setStudentProfile(profile);

    let authorized = false;
    if (viewingUser) {
      if (viewingUser.uid === studentId) authorized = true;
      else if (viewingUser.role === 'admin' && viewingUser.schoolId === profile.schoolId) authorized = true;
      else if (viewingUser.role === 'parent' && viewingUser.childStudentId === studentId) authorized = true;
      else if (viewingUser.role === 'teacher' && viewingUser.schoolId === profile.schoolId && profile.classIds) {
        const teacherClasses = await getClassesByTeacher(viewingUser.uid);
        const teacherClassIds = new Set(teacherClasses.map(tc => tc.id));
        if (profile.classIds.some(studentClassId => teacherClassIds.has(studentClassId))) {
          authorized = true;
        }
      }
    }
    setIsAuthorized(authorized);

    if (authorized && profile.schoolId) {
      try {
        const [classesData, schoolSubjectsData, resultsData, activityData] = await Promise.all([
          profile.classIds ? getClassesByIds(profile.classIds) : Promise.resolve([]),
          getSubjectsBySchool(profile.schoolId),
          getExamResultsForStudent(studentId, profile.schoolId),
          getActivities(profile.schoolId, { userId: studentId }, 20)
        ]);
        setEnrolledClasses(classesData);
        
        const mainCls = classesData.find(c => c.classType === 'main');
        setMainClass(mainCls || null);

        let studentAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
        if (profile.classIds) {
            for (const classId of profile.classIds) {
                const classAssignments = await getAssignmentsForStudentByClass(classId, studentId);
                studentAssignments = [...studentAssignments, ...classAssignments];
            }
        }
        studentAssignments.sort((a, b) => b.deadline.toMillis() - a.deadline.toMillis());
        setAssignments(studentAssignments);

        setExamResults(resultsData.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
        
        const relevantActivities = activityData.filter(act => 
          act.actorId === studentId || 
          (act.targetUserId === studentId) ||
          (act.classId && profile.classIds?.includes(act.classId)) ||
          (!act.classId && !act.actorId && !act.targetUserId) 
        ).slice(0, 10);
        setActivities(relevantActivities);

        // Categorize subjects
        if (profile.subjects && schoolSubjectsData.length > 0) {
            const compulsory: Subject[] = [];
            const elective: Subject[] = [];
            const mainClassCompulsoryIds = new Set(mainCls?.compulsorySubjectIds || []);
            
            profile.subjects.forEach(studentSubId => {
                const subjectDetail = schoolSubjectsData.find(s => s.id === studentSubId);
                if (subjectDetail) {
                    if (mainClassCompulsoryIds.has(studentSubId)) {
                        compulsory.push(subjectDetail);
                    } else {
                        elective.push(subjectDetail);
                    }
                }
            });
            setStudentSubjects({ compulsory, elective });
        }


      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    }
    setIsLoadingPage(false);
  }, [studentId, viewingUser, getUserProfile, getClassesByIds, getSubjectsBySchool, getExamResultsForStudent, getActivities, getClassesByTeacher, getAssignmentsForStudentByClass]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);
  
  const handleAnalyzePerformance = async () => {
      if (!studentProfile) return;
      setIsAnalyzingPerformance(true);
      setAiAnalysis(null);

      // Prepare summaries for AI
      const examSummary = examResults.length > 0 
        ? examResults.slice(0, 5).map(r => `${r.subjectName || 'Subject'}: ${r.marks} (${r.examPeriodName || 'Exam'})`).join(', ')
        : "No recent exam results available.";
      
      const assignmentSummary = assignments.length > 0
        ? `Total assignments: ${assignments.length}. Recent submissions: ${assignments.slice(0,3).map(a => `${a.title} - Status: ${a.submissionStatus || 'missing'}`).join('; ')}`
        : "No assignment data available.";
        
      // TODO: Add real attendance summary later
      const currentAttendanceSummary = "Attendance data not fully integrated for AI analysis yet.";


      const input: AnalyzeStudentPerformanceInput = {
          studentName: studentProfile.displayName || "Student",
          examResultsSummary: examSummary,
          assignmentSummary: assignmentSummary,
          attendanceSummary: currentAttendanceSummary,
      };

      try {
          const analysisOutput = await analyzeStudentPerformance(input);
          setAiAnalysis(analysisOutput);
      } catch (error) {
          console.error("Error analyzing student performance:", error);
          // Show toast
      } finally {
          setIsAnalyzingPerformance(false);
      }
  };


  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader message="Loading student profile..." size="large" />
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Student Not Found</h1>
        <p className="text-muted-foreground">The profile you are trying to view does not exist.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You are not authorized to view this student's profile.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <StudentProfileHeader student={studentProfile} />
      
      <div className="grid md:grid-cols-2 gap-6">
        <StudentSubjectsCard subjects={studentSubjects} mainClassName={mainClass?.name} />
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarCheck className="mr-2 h-5 w-5 text-primary" /> Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Attendance charts and detailed records will be displayed here.</p>
            {/* Placeholder for attendance chart */}
            <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground italic">
              Attendance Chart Coming Soon
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <StudentAssignmentsSummaryCard assignments={assignments} />
        <StudentExamResultsSummaryCard results={examResults} />
      </div>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" /> AI Performance Analysis
          </CardTitle>
          <CardDescription>Get an AI-generated summary of the student's performance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyzePerformance} disabled={isAnalyzingPerformance} className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground">
            {isAnalyzingPerformance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Wand2 className="mr-2 h-4 w-4" /> Analyze Performance
          </Button>
          {aiAnalysis && (
            <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/30">
              <div><h4 className="font-semibold">Overall Summary:</h4><p className="text-sm whitespace-pre-wrap">{aiAnalysis.overallSummary}</p></div>
              <div><h4 className="font-semibold">Strengths:</h4><p className="text-sm whitespace-pre-wrap">{aiAnalysis.strengths}</p></div>
              <div><h4 className="font-semibold">Areas for Improvement:</h4><p className="text-sm whitespace-pre-wrap">{aiAnalysis.weaknesses}</p></div>
              <div><h4 className="font-semibold">Recommendations:</h4><p className="text-sm whitespace-pre-wrap">{aiAnalysis.recommendations}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><ActivityIcon className="mr-2 h-5 w-5 text-primary" /> Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground">No recent activity for this student.</p>
          ) : (
            <ScrollArea className="h-[300px]">
              <ul className="space-y-2 pr-2">
                {activities.map(activity => (
                  <StudentActivityItem key={activity.id} activity={activity} />
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
