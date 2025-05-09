
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Clock, FolderOpen, ListChecks, BookOpen, Activity } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLearningPath, GenerateLearningPathInput } from '@/ai/flows/generate-learning-path';
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import type { AssignmentWithClassAndSubmissionInfo, LearningMaterial, ClassWithTeacherInfo, Activity as ActivityType } from "@/types";
import { format, formatDistanceToNow } from 'date-fns';

export default function StudentDashboardPage() {
  const { currentUser, getLearningMaterialsBySchool, getAssignmentsForStudentByClass, getClassesByIds, getActivities, loading: authLoading } = useAuth();
  const [learningPath, setLearningPath] = useState("");
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const { toast } = useToast();
  
  const [resourceCount, setResourceCount] = useState(0);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<LearningMaterial[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid || !currentUser.schoolId || !currentUser.classIds) {
      if (!authLoading) setIsLoadingStats(false);
      return;
    }
    setIsLoadingStats(true);
    try {
      const [classesDetails, schoolMaterials, activities] = await Promise.all([
        getClassesByIds(currentUser.classIds),
        getLearningMaterialsBySchool(currentUser.schoolId),
        getActivities(currentUser.schoolId, { classId: currentUser.classIds[0] }, 5) // Activities for first class or school wide
      ]);
      setEnrolledClasses(classesDetails);
      setResourceCount(schoolMaterials.length); 
      setRecentActivities(activities);

      let allAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
      for (const cls of classesDetails) {
        const classAssignments = await getAssignmentsForStudentByClass(cls.id, currentUser.uid);
        allAssignments = [...allAssignments, ...classAssignments];
      }
      
      const now = new Date();
      const upcoming = allAssignments
        .filter(a => a.deadline.toDate() >= now && a.submissionStatus !== 'graded' && a.submissionStatus !== 'submitted') 
        .sort((a, b) => a.deadline.toDate().getTime() - b.deadline.toDate().getTime())
        .slice(0, 3);
      setUpcomingAssignments(upcoming);

      const studentClassIdsSet = new Set(currentUser.classIds);
      const relevantMaterials = schoolMaterials.filter(material => 
        !material.classId || studentClassIdsSet.has(material.classId)
      );
      setRecentMaterials(relevantMaterials.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0,3));

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
      setIsLoadingStats(false);
    }
  }, [currentUser, getAssignmentsForStudentByClass, getClassesByIds, getLearningMaterialsBySchool, getActivities, authLoading, toast]);

  useEffect(() => {
    if(currentUser && currentUser.classIds && currentUser.classIds.length > 0){ // Ensure classes are loaded before fetching
        fetchDashboardData();
    } else if (currentUser && (!currentUser.classIds || currentUser.classIds.length === 0) && !authLoading) {
      // If no classes, don't fetch class-specific data, maybe redirect to onboarding
      setIsLoadingStats(false);
      // Consider redirecting to onboarding if classIds is empty and not loading
      // router.push('/student/onboarding');
    }
  }, [currentUser, fetchDashboardData, authLoading]);


  const handleGeneratePath = async () => {
    setIsGeneratingPath(true);
    setLearningPath("");
    if(!currentUser) {
        toast({ title: "Error", description: "User not found.", variant: "destructive" });
        setIsGeneratingPath(false);
        return;
    }
    try {
      const studentPerformance = currentUser.studentAssignments 
        ? Object.entries(currentUser.studentAssignments).map(([key, val]) => `Assignment ${key}: ${val.status} (Grade: ${val.grade || 'N/A'})`).join(', ')
        : "No performance data yet.";
      
      const teacherContent = `Student is enrolled in ${enrolledClasses.map(c => c.name).join(', ')}. Teacher uploaded various materials. Student is interested in ${currentUser.subjects?.join(', ') || 'various topics'}.`;

      const input: GenerateLearningPathInput = {
        studentPerformance: studentPerformance || "No specific performance data recorded yet.",
        teacherContent: teacherContent || "General curriculum.",
        studentGoals: `Master current topics in ${currentUser.subjects?.join(', ') || 'selected subjects'} and prepare for upcoming assessments.`, 
      };
      const result = await generateLearningPath(input);
      setLearningPath(result.learningPath);
      toast({ title: "Learning Path Generated!", description: "Your personalized learning path is ready." });
    } catch (error) {
      console.error("Error generating learning path:", error);
      toast({ title: "Path Generation Failed", description: "An error occurred while generating your learning path.", variant: "destructive" });
    } finally {
      setIsGeneratingPath(false);
    }
  };
  
  const isLoading = authLoading || isLoadingStats;
  
  if (currentUser && (!currentUser.classIds || currentUser.classIds.length === 0) && !authLoading && !isLoadingStats) {
     return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Card className="w-full max-w-md shadow-xl text-center">
                <CardHeader>
                    <CardTitle>Complete Your Onboarding</CardTitle>
                    <CardDescription>Please select your class and subjects to get started.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button asChild className="button-shadow">
                        <Link href="/student/onboarding">Go to Onboarding</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
     );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Welcome back, {currentUser?.displayName || "Student"}! Let's continue your learning journey.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{enrolledClasses.length}</div>}
                <p className="text-xs text-muted-foreground">Currently enrolled</p>
                <Button variant="link" asChild className="px-0 pt-2 text-sm">
                    <Link href="/student/classes">View My Classes</Link>
                </Button>
            </CardContent>
        </Card>
        <Card className="card-shadow hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{
                    enrolledClasses.reduce((sum, cls) => sum + (cls.totalAssignmentsCount || 0) ,0)
                }</div>}
                <p className="text-xs text-muted-foreground">Across all classes</p>
                 <Button variant="link" asChild className="px-0 pt-2 text-sm">
                    <Link href="/student/assignments">View All Assignments</Link>
                </Button>
            </CardContent>
        </Card>
         <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{resourceCount}</div>}
            <p className="text-xs text-muted-foreground">Documents and videos</p>
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/student/resources">Browse Resources</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/>AI: Your Personalized Learning Path</CardTitle>
          <CardDescription>
            Click the button below to generate or update your learning path based on your progress and goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGeneratePath} disabled={isGeneratingPath || isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow w-full sm:w-auto">
            {(isGeneratingPath || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {learningPath ? "Regenerate My Path" : "Generate My Learning Path"}
          </Button>
          {learningPath && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <h3 className="font-semibold mb-2">Your Learning Path:</h3>
              <div className="text-sm whitespace-pre-wrap prose max-w-none">{learningPath}</div>
            </div>
          )}
           {!learningPath && !isGeneratingPath && !isLoading && (
            <p className="mt-4 text-sm text-muted-foreground">Click the button to see your personalized learning path.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5 text-primary"/>Upcoming Assignments</CardTitle>
             <CardDescription>
              Assignments due soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : 
              upcomingAssignments.length > 0 ? (
              <ul className="space-y-3">
                {upcomingAssignments.map(assignment => (
                  <li key={assignment.id} className="p-3 border rounded-md hover:bg-muted/50">
                    <Link href={`/student/assignments/${assignment.id}`} className="hover:underline">
                      <h4 className="font-semibold">{assignment.title}</h4>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      For: {assignment.className || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(assignment.deadline.toDate(), 'PPp')} ({formatDistanceToNow(assignment.deadline.toDate(), { addSuffix: true })})
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming assignments to show right now. Great job!</p>
            )}
            <Button variant="link" asChild className="px-0 pt-3 text-sm">
              <Link href="/student/assignments">View All Assignments</Link>
            </Button>
          </CardContent>
        </Card>

         <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Recent Activity</CardTitle>
             <CardDescription>
              Latest updates for your classes and school.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : 
              recentActivities.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto space-y-2">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="p-3 border rounded-md text-sm hover:bg-muted/30">
                    <p className="font-medium">{activity.message}</p>
                     <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                    </p>
                    {activity.link && <Link href={activity.link} className="text-xs text-primary hover:underline">View Details</Link>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity to show.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
