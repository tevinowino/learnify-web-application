"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, UploadCloud, BarChart2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { summarizeLearningMaterial, SummarizeLearningMaterialInput } from '@/ai/flows/summarize-learning-material';
import { useAuth } from "@/hooks/useAuth";

export default function TeacherDashboardPage() {
  const { currentUser } = useAuth();
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
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {currentUser?.displayName || "Teacher"}! Manage your classes and materials.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 button-shadow">
           <UploadCloud className="mr-2 h-4 w-4"/> Upload New Material
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Active classes this semester</p>
          </CardContent>
        </Card>
         <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Progress</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Average class completion</p>
          </CardContent>
        </Card>
      </div>
      
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
          <Button onClick={handleSummarize} disabled={isSummarizing || !materialToSummarize.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
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
    </div>
  );
}
