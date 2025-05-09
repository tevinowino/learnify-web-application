"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, BarChart2, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLearningPath, GenerateLearningPathInput } from '@/ai/flows/generate-learning-path';
import { useAuth } from "@/hooks/useAuth";

export default function StudentDashboardPage() {
  const { currentUser } = useAuth();
  const [learningPath, setLearningPath] = useState("");
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const { toast } = useToast();

  const handleGeneratePath = async () => {
    setIsGeneratingPath(true);
    setLearningPath("");
    try {
      // Mock inputs for now. In a real app, these would come from student data and teacher content.
      const input: GenerateLearningPathInput = {
        studentPerformance: "Struggling with algebra, good at geometry.",
        teacherContent: "Uploaded chapters on Algebra basics, Linear Equations, and Introduction to Geometry.",
        studentGoals: "Improve algebra skills and prepare for the final exam.",
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.displayName || "Student"}! Let's continue your learning journey.</p>
        </div>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/>AI: Your Personalized Learning Path</CardTitle>
          <CardDescription>
            Click the button below to generate or update your learning path based on your progress and goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGeneratePath} disabled={isGeneratingPath} className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
            {isGeneratingPath && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {learningPath ? "Regenerate My Path" : "Generate My Learning Path"}
          </Button>
          {learningPath && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <h3 className="font-semibold mb-2">Your Learning Path:</h3>
              <div className="text-sm whitespace-pre-wrap prose max-w-none">{learningPath}</div>
            </div>
          )}
           {!learningPath && !isGeneratingPath && (
            <p className="mt-4 text-sm text-muted-foreground">Click the button to see your personalized learning path.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Progress</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60%</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Completed of current module</p>
          </CardContent>
        </Card>
         <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Documents and videos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
