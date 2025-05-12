
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserCircle, BookOpen, ListChecks, Trophy, ActivityIcon as Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { UserProfileWithId, ClassWithTeacherInfo, AssignmentWithClassAndSubmissionInfo, ExamResultWithStudentInfo, Activity as ActivityType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Placeholder components - these can be moved to separate files if they grow complex
const StudentProfileHeader = ({ student }: { student: UserProfileWithId | null }) => {
  if (!student) return null;
  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={student.photoURL || undefined} alt={student.displayName || 'Student'} />
          <AvatarFallback className="text-3xl">
            {student.displayName ? student.displayName.charAt(0).toUpperCase() : <UserCircle />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <CardTitle className="text-3xl">{student.displayName}</CardTitle>
          <CardDescription className="text-base">
            Email: {student.email} <br />
            School: {student.schoolName || 'N/A'} <br />
            Role: <Badge variant="secondary" className="capitalize">{student.role}</Badge>
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};

const StudentEnrolledClassesSection = ({ classes }: { classes: ClassWithTeacherInfo[] }) => (
  <Card className="card-shadow">
    <CardHeader>
      <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Enrolled Classes ({classes.length})</CardTitle>
    </CardHeader>
    <CardContent>
      {classes.length === 0 ? (
        <p className="text-muted-foreground">Not enrolled in any classes.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classes.map(cls => (
            <Card key={cls.id} className="p-3 bg-muted/50">
              <h4 className="font-semibold">{cls.name}</h4>
              <p className="text-xs text-muted-foreground">Teacher: {cls.teacherDisplayName || 'N/A'}</p>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const StudentAssignmentsSection = ({ assignments }: { assignments: AssignmentWithClassAndSubmissionInfo[] }) => {
    const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late') => {
    switch(status) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><ListChecks className="mr-1 h-3 w-3"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary"><ListChecks className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive"><ListChecks className="mr-1 h-3 w-3"/>Late</Badge>;
        case 'missing': default: return <Badge variant="outline">Missing</Badge>;
    }
  };
  return (
  <Card className="card-shadow">
    <CardHeader>
      <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Recent Assignments</CardTitle>
    </CardHeader>
    <CardContent>
      {assignments.length === 0 ? (
        <p className="text-muted-foreground">No assignments to display.</p>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-3 pr-2">
            {assignments.slice(0, 5).map(assignment => ( // Show top 5 recent/upcoming
              <Card key={assignment.id} className="p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-sm">{assignment.title}</h4>
                        <p className="text-xs text-muted-foreground">Class: {assignment.className || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(assignment.deadline.toDate(), 'PPp')}</p>
                    </div>
                    {getStatusBadge(assignment.submissionStatus)}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </CardContent>
  </Card>
)};

const StudentExamResultsSection = ({ results }: { results: ExamResultWithStudentInfo[] }) => (
  <Card className="card-shadow">
    <CardHeader>
      <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" /> Exam Results</CardTitle>
    </CardHeader>
    <CardContent>
      {results.length === 0 ? (
        <p className="text-muted-foreground">No exam results published yet.</p>
      ) : (
        <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-2">
          {results.map(result => (
            <Card key={result.id} className="p-3">
              <h4 className="font-semibold text-sm">{result.examPeriodName} - {result.subjectName}</h4>
              <p className="text-xs text-muted-foreground">Marks/Grade: {result.marks}</p>
              {result.remarks && <p className="text-xs text-muted-foreground italic">Remarks: {result.remarks}</p>}
            </Card>
          ))}
        </div>
        </ScrollArea>
      )}
    </CardContent>
  </Card>
);

const StudentActivityFeedSection = ({ activities }: { activities: ActivityType[] }) => (
  <Card className="card-shadow">
    <CardHeader>
      <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Recent Activity</CardTitle>
    </CardHeader>
    <CardContent>
      {activities.length === 0 ? (
        <p className="text-muted-foreground">No recent activity.</p>
      ) : (
        <ScrollArea className="h-[300px]">
        <ul className="space-y-2 pr-2">
          {activities.slice(0, 10).map(activity => ( // Show top 10 recent
            <li key={activity.id} className="text-xs p-2 border rounded-md">
              <p className="font-medium">{activity.message}</p>
              <p className="text-muted-foreground">{formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}</p>
            </li>
          ))}
        </ul>
        </ScrollArea>
      )}
    </CardContent>
  </Card>
);


export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const {
    currentUser: viewingUser,
    getUserProfile,
    getClassesByIds,
    getAssignmentsForStudentByClass,
    getExamResultsForStudent,
    getActivities,
    getClassesByTeacher,
    loading: authLoading,
  } = useAuth();

  const [studentProfile, setStudentProfile] = useState<UserProfileWithId | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [examResults, setExamResults] = useState<ExamResultWithStudentInfo[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setIsLoadingPage(true);

    const profile = await getUserProfile(studentId);
    if (!profile) {
      setIsLoadingPage(false);
      return; // Student not found
    }
    setStudentProfile(profile);

    // Authorization Check
    let authorized = false;
    if (viewingUser) {
      if (viewingUser.uid === studentId) authorized = true; // Student viewing their own
      else if (viewingUser.role === 'admin' && viewingUser.schoolId === profile.schoolId) authorized = true; // Admin from same school
      else if (viewingUser.role === 'parent' && viewingUser.childStudentId === studentId) authorized = true; // Linked parent
      else if (viewingUser.role === 'teacher' && viewingUser.schoolId === profile.schoolId && profile.classIds) {
        const teacherClasses = await getClassesByTeacher(viewingUser.uid);
        const teacherClassIds = new Set(teacherClasses.map(tc => tc.id));
        if (profile.classIds.some(studentClassId => teacherClassIds.has(studentClassId))) {
          authorized = true; // Teacher of one of the student's classes
        }
      }
    }
    setIsAuthorized(authorized);

    if (authorized && profile.schoolId) {
      try {
        const [classesData, resultsData, activityData] = await Promise.all([
          profile.classIds ? getClassesByIds(profile.classIds) : Promise.resolve([]),
          getExamResultsForStudent(studentId, profile.schoolId),
          getActivities(profile.schoolId, { userId: studentId }, 20) // Fetch more activities for better filtering
        ]);
        setEnrolledClasses(classesData);
        setExamResults(resultsData);

        let studentAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
        if (profile.classIds) {
            for (const classId of profile.classIds) {
                const classAssignments = await getAssignmentsForStudentByClass(classId, studentId);
                studentAssignments = [...studentAssignments, ...classAssignments];
            }
        }
        // Sort assignments by deadline, most recent first
        studentAssignments.sort((a, b) => b.deadline.toMillis() - a.deadline.toMillis());
        setAssignments(studentAssignments);
        
        // Filter activities
        const relevantActivities = activityData.filter(act => 
          act.actorId === studentId || 
          (act.targetUserId === studentId) ||
          (act.classId && profile.classIds?.includes(act.classId)) ||
          (!act.classId && !act.actorId && !act.targetUserId) // General school announcements
        );
        setActivities(relevantActivities);

      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    }
    setIsLoadingPage(false);
  }, [studentId, viewingUser, getUserProfile, getClassesByIds, getAssignmentsForStudentByClass, getExamResultsForStudent, getActivities, getClassesByTeacher]);

  useEffect(() => {
    if (!authLoading) { // Only fetch if auth state is resolved
      fetchData();
    }
  }, [authLoading, fetchData]);

  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        <StudentEnrolledClassesSection classes={enrolledClasses} />
        <StudentActivityFeedSection activities={activities} />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <StudentAssignmentsSection assignments={assignments} />
        <StudentExamResultsSection results={examResults} />
      </div>

    </div>
  );
}
