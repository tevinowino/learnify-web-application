
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, Brain, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Subject } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { generateLearningPath, GenerateLearningPathInput, GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';
import Loader from '@/components/shared/Loader';

const learningPathFormSchema = z.object({
  selectedSubject: z.string().min(1, "Please select a subject."),
  currentUnderstanding: z.string().min(10, "Please describe your current understanding (at least 10 characters)."),
  studentGoals: z.string().min(10, "Please state your learning goals (at least 10 characters)."),
  // teacherContent field is optional in the AI flow, so not strictly required in the form
});

type LearningPathFormValues = z.infer<typeof learningPathFormSchema>;

export default function StudentProgressPage() {
  const { currentUser, getSubjectById, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);

  const form = useForm<LearningPathFormValues>({
    resolver: zodResolver(learningPathFormSchema),
    defaultValues: {
      selectedSubject: '',
      currentUnderstanding: '',
      studentGoals: '',
    },
  });

  const fetchEnrolledSubjects = useCallback(async () => {
    if (currentUser?.subjects && currentUser.subjects.length > 0 && getSubjectById) {
      setIsLoadingSubjects(true);
      try {
        const subjectDetailsPromises = currentUser.subjects.map(id => getSubjectById(id));
        const subjectResults = await Promise.all(subjectDetailsPromises);
        setEnrolledSubjects(subjectResults.filter(Boolean) as Subject[]);
      } catch (error) {
        console.error("Error fetching student subjects:", error);
        toast({ title: "Error", description: "Could not load your subjects.", variant: "destructive" });
      } finally {
        setIsLoadingSubjects(false);
      }
    } else {
      setEnrolledSubjects([]);
      setIsLoadingSubjects(false);
    }
  }, [currentUser, getSubjectById, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchEnrolledSubjects();
    }
  }, [authLoading, fetchEnrolledSubjects]);

  async function onSubmit(values: LearningPathFormValues) {
    setIsGeneratingPath(true);
    setGeneratedPath(null);
    try {
      const input: GenerateLearningPathInput = {
        selectedSubject: enrolledSubjects.find(s => s.id === values.selectedSubject)?.name || values.selectedSubject,
        currentUnderstanding: values.currentUnderstanding,
        studentGoals: values.studentGoals,
        // teacherContent is optional, can be omitted or fetched from somewhere if relevant
      };
      const result: GenerateLearningPathOutput = await generateLearningPath(input);
      setGeneratedPath(result.learningPath);
      toast({ title: "Learning Path Generated!", description: "Your personalized path is ready below." });
    } catch (error) {
      console.error("Error generating learning path:", error);
      toast({ title: "Error", description: "Could not generate learning path. Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingPath(false);
    }
  }

  const pageOverallLoading = authLoading || isLoadingSubjects;

  if (pageOverallLoading && enrolledSubjects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading your progress tools..." size="large" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Learning Path Generator</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary"/>Create Your Personalized Learning Path</CardTitle>
          <CardDescription>
            Select a subject, tell us about your current understanding and goals, and let Akili generate a tailored study plan for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledSubjects.length === 0 && !isLoadingSubjects ? (
            <p className="text-muted-foreground text-center py-4">You are not enrolled in any subjects yet. Please complete onboarding or contact your admin.</p>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="selectedSubject">Select Subject</Label>
                <Controller
                  name="selectedSubject"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingSubjects || isGeneratingPath}>
                      <SelectTrigger id="selectedSubject">
                        <SelectValue placeholder="Choose a subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {enrolledSubjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.selectedSubject && <p className="text-sm text-destructive mt-1">{form.formState.errors.selectedSubject.message}</p>}
              </div>

              <div>
                <Label htmlFor="currentUnderstanding">Current Understanding & Challenges</Label>
                <Textarea 
                  id="currentUnderstanding" 
                  {...form.register("currentUnderstanding")} 
                  placeholder="e.g., 'I understand basic algebra but struggle with word problems.' or 'I'm new to this topic.'"
                  rows={4}
                  disabled={isGeneratingPath}
                />
                {form.formState.errors.currentUnderstanding && <p className="text-sm text-destructive mt-1">{form.formState.errors.currentUnderstanding.message}</p>}
              </div>

              <div>
                <Label htmlFor="studentGoals">Learning Goals</Label>
                <Textarea 
                  id="studentGoals" 
                  {...form.register("studentGoals")} 
                  placeholder="e.g., 'I want to be able to solve quadratic equations confidently for my upcoming test.' or 'I want to get a general overview of World War II.'"
                  rows={4}
                  disabled={isGeneratingPath}
                />
                {form.formState.errors.studentGoals && <p className="text-sm text-destructive mt-1">{form.formState.errors.studentGoals.message}</p>}
              </div>

              <Button type="submit" className="w-full sm:w-auto button-shadow bg-primary hover:bg-primary/90" disabled={isGeneratingPath || isLoadingSubjects || enrolledSubjects.length === 0}>
                {isGeneratingPath ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Generate Learning Path
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {isGeneratingPath && (
        <Card className="card-shadow">
          <CardContent className="pt-6 flex flex-col items-center justify-center">
            <Brain className="h-12 w-12 text-primary animate-pulse mb-3" />
            <p className="text-muted-foreground">Akili is thinking... Generating your personalized path!</p>
          </CardContent>
        </Card>
      )}

      {generatedPath && !isGeneratingPath && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary"/>Your Personalized Learning Path</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] border p-4 rounded-md bg-muted/30">
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap"
              >
                {generatedPath}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
