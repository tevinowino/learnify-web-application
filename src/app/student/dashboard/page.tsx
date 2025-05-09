"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, BookOpen, Sparkles, Loader2, Clock, FolderOpen, ListChecks } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLearningPath, GenerateLearningPathInput } from '@/ai/flows/generate-learning-path';
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import type { AssignmentWithClassAndSubmissionInfo, LearningMaterial, ClassWithTeacherInfo } from "@/types";
import { format, formatDistanceToNow } from 'date-fns';

export default function StudentDashboardPage() {
  const { currentUser, getLearningMaterialsBySchool, getAssignmentsForStudentByClass, getClassesByIds, loading: authLoading } = useAuth();
  const [learningPath, setLearningPath] = useState("");
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const { toast } = useToast();
  
  const [resourceCount, setResourceCount] = useState(0);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<LearningMaterial[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid || !currentUser.schoolId || !currentUser.classIds) {
      if (!authLoading) setIsLoadingStats(false);
      return;
    }
    setIsLoadingStats(true);
    try {
      const [classesDetails, schoolMaterials] = await Promise.all([
        getClassesByIds(currentUser.classIds),
        getLearningMaterialsBySchool(currentUser.schoolId) // For general recent materials
      ]);
      setEnrolledClasses(classesDetails);
      setResourceCount(schoolMaterials.length); // Total school resources

      let allAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
      for (const cls of classesDetails) {
        const classAssignments = await getAssignmentsForStudentByClass(cls.id, currentUser.uid);
        allAssignments = [...allAssignments, ...classAssignments];
      }
      
      const now = new Date();
      const upcoming = allAssignments
        .filter(a => a.deadline.toDate() >= now && a.submissionStatus !== 'graded' && a.submissionStatus !== 'submitted') // Show non-submitted/graded upcoming
        .sort((a, b) => a.deadline.toDate().getTime() - b.deadline.toDate().getTime())
        .slice(0, 3);
      setUpcomingAssignments(upcoming);

      // Recent materials from enrolled classes or general school materials
      const studentClassIdsSet = new Set(currentUser.classIds);
      const relevantMaterials = schoolMaterials.filter(material => 
        !material.classId || studentClassIdsSet.has(material.classId)
      );
      setRecentMaterials(relevantMaterials.slice(0,3));

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
      setIsLoadingStats(false);
    }
  }, [currentUser, getAssignmentsForStudentByClass, getClassesByIds, getLearningMaterialsBySchool, authLoading, toast]);

  useEffect(() => {
    if(currentUser){
        fetchDashboardData();
    }
  }, [currentUser, fetchDashboardData]);


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
      
      // For teacher content, we'd ideally get content from classes the student is in.
      // This is a simplification.
      const teacherContent = `Student is enrolled in ${enrolledClasses.map(c => c.name).join(', ')}. Teacher uploaded various materials.`;

      const input: GenerateLearningPathInput = {
        studentPerformance: studentPerformance || "No specific performance data recorded yet.",
        teacherContent: teacherContent || "General curriculum.",
        studentGoals: "Master current topics and prepare for upcoming assessments.", 
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.displayName || "Student"}! Let's continue your learning journey.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{enrolledClasses.length}</div>}
                <p className="text-xs text-muted-foreground">Currently enrolled</p>
                <Button variant="link" asChild className="px-0 pt-2">
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
                 <Button variant="link" asChild className="px-0 pt-2">
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
            <Button variant="link" asChild className="px-0 pt-2">
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
          <Button onClick={handleGeneratePath} disabled={isGeneratingPath || isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
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
                      Due: {format(assignment.deadline.toDate(), 'PPp')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming assignments to show right now. Great job!</p>
            )}
            <Button variant="link" asChild className="px-0 pt-3">
              <Link href="/student/assignments">View All Assignments</Link>
            </Button>
          </CardContent>
        </Card>

         <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary"/>Recent Learning Materials</CardTitle>
             <CardDescription>
              Newly added resources for your classes or school.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : 
              recentMaterials.length > 0 ? (
              <ul className="space-y-3">
                {recentMaterials.map(material => (
                  <li key={material.id} className="p-3 border rounded-md hover:bg-muted/50">
                    {/* TODO: Link to specific material view page if created */}
                    <h4 className="font-semibold">{material.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Type: {material.materialType} | Class: {material.className || 'General'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No new materials recently.</p>
            )}
            <Button variant="link" asChild className="px-0 pt-3">
              <Link href="/student/resources">Browse All Resources</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
