
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, UploadCloud, Sparkles, Loader2, Edit3, BookCopy, Clock, Activity } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { summarizeLearningMaterial, SummarizeLearningMaterialInput } from '@/ai/flows/summarize-learning-material';
import { useAuth } from "@/hooks/useAuth"; // For currentUser
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard"; // New hook
import Link from "next/link";
import { format, formatDistanceToNow } from 'date-fns';

export default function TeacherDashboardPage() {
  const { currentUser } = useAuth(); // For display name
  const { 
    materialCount, 
    assignmentCount, 
    classCount, 
    upcomingAssignments, 
    recentActivities, 
    isLoading 
  } = useTeacherDashboard();
  
  const [materialToSummarize, setMaterialToSummarize] = useState("");
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!materialToSummarize.trim()) {
      toast({ title: "Input Required", description: "Please enter some learning material to summarize.", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    setSummary("");
    try {
      const input: SummarizeLearningMaterialInput = { learningMaterial: materialToSummarize };
      const result = await summarizeLearningMaterial(input);
      setSummary(result.summary);
      toast({ title: "Summarization Complete!", description: "The material has been summarized." });
    } catch (error) {
      console.error("Error summarizing material:", error);
      toast({ title: "Summarization Failed", description: "An error occurred while summarizing the material.", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Welcome, {currentUser?.displayName || "Teacher"}! Manage your classes and materials.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
          <Link href="/teacher/assignments/create">
           <UploadCloud className="mr-2 h-4 w-4"/> Create Assignment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookCopy className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{classCount}</div>}
            <p className="text-xs text-muted-foreground">Total classes assigned</p>
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/teacher/classes">View My Classes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploaded Materials</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{materialCount}</div>}
            <p className="text-xs text-muted-foreground">Total materials available</p>
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/teacher/materials">Manage Materials</Link>
            </Button>
          </CardContent>
        </Card>
         <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Edit3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{assignmentCount}</div>}
            <p className="text-xs text-muted-foreground">Total assignments created</p>
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/teacher/assignments">Manage Assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/>AI: Summarize Learning Material</CardTitle>
            <CardDescription>
              Paste learning material below to get an AI-generated summary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your learning material here..."
              value={materialToSummarize}
              onChange={(e) => setMaterialToSummarize(e.target.value)}
              rows={8}
              className="mb-4"
            />
            <Button onClick={handleSummarize} disabled={isSummarizing || !materialToSummarize.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow w-full sm:w-auto">
              {isSummarizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Summarize Material
            </Button>
            {summary && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold mb-2">Summary:</h3>
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5 text-primary"/>Upcoming Deadlines</CardTitle>
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
                    <Link href={`/teacher/assignments/${assignment.id}`} className="hover:underline">
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
              <p className="text-muted-foreground">No upcoming deadlines in the near future.</p>
            )}
            <Button variant="link" asChild className="px-0 pt-3 text-sm">
              <Link href="/teacher/assignments">View All Assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Recent Activity</CardTitle>
          <CardDescription>Latest updates and events related to your classes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
          ) : recentActivities.length > 0 ? (
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
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-10 w-10 mb-2"/>
              <p>No recent activity to show.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
