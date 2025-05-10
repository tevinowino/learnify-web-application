
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, CalendarDays, BookOpen, User, AlertTriangle } from "lucide-react";
import type { ExamResultWithStudentInfo, UserProfile } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ParentChildResultsPage() {
  const { currentUser, getExamResultsForStudent, getSubjectById, getExamPeriodById, getClassDetails, getUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [childProfile, setChildProfile] = useState<UserProfile | null>(null);
  const [resultsByPeriod, setResultsByPeriod] = useState<Record<string, ExamResultWithStudentInfo[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchChildAndResults = useCallback(async () => {
    if (!currentUser?.childStudentId || !currentUser.schoolId) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const child = await getUserProfile(currentUser.childStudentId);
      setChildProfile(child);

      if (child) {
        const fetchedResults = await getExamResultsForStudent(
          currentUser.childStudentId, 
          currentUser.schoolId, // Pass schoolId here
          getSubjectById, 
          (examPeriodId) => getExamPeriodById(examPeriodId, getClassDetails)
        );

        const grouped: Record<string, ExamResultWithStudentInfo[]> = {};
        for (const result of fetchedResults) {
          const periodName = result.examPeriodName || 'Unknown Exam Period';
          if (!grouped[periodName]) {
            grouped[periodName] = [];
          }
          grouped[periodName].push(result);
        }
        setResultsByPeriod(grouped);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load your child's exam results.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, getUserProfile, getExamResultsForStudent, getSubjectById, getExamPeriodById, getClassDetails, authLoading, toast]);

  useEffect(() => {
    fetchChildAndResults();
  }, [fetchChildAndResults]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser?.childStudentId) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Child Not Linked</CardTitle>
          <CardDescription>
            Please link your child's account to view their exam results.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="button-shadow">
                <Link href="/parent/profile">Go to Profile to Link Child</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }
  
  const hasResults = Object.keys(resultsByPeriod).length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Child's Exam Results</h1>
      {childProfile && <p className="text-muted-foreground">Viewing results for: {childProfile.displayName}</p>}

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-primary" />
            Exam Performance
          </CardTitle>
          <CardDescription>
            Review your child's exam results and teacher remarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Exam Results Found</p>
              <p className="text-muted-foreground">Your child's exam results will appear here once published.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-2">
              {Object.entries(resultsByPeriod).map(([periodName, periodResults]) => (
                <AccordionItem value={periodName} key={periodName} className="border rounded-md">
                  <AccordionTrigger className="px-4 py-3 text-lg hover:no-underline">
                     <div className="flex items-center">
                        <CalendarDays className="mr-2 h-5 w-5 text-primary/80" /> {periodName}
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-3">
                       {periodResults.length === 0 && <p className="text-sm text-muted-foreground">No results found for this period.</p>}
                      {periodResults.map(result => (
                        <Card key={result.id} className="bg-background/50">
                          <CardHeader className="pb-2 pt-3">
                            <CardTitle className="text-md flex items-center">
                                <BookOpen className="mr-2 h-4 w-4 text-secondary-foreground"/>
                                {result.subjectName || 'Unknown Subject'}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm">
                            <p><span className="font-semibold">Marks/Grade:</span> {result.marks}</p>
                            {result.remarks && <p className="mt-1"><span className="font-semibold">Remarks:</span> <span className="text-muted-foreground italic">{result.remarks}</span></p>}
                            <p className="text-xs text-muted-foreground mt-1">Graded on: {format(result.updatedAt.toDate(), 'PPp')}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
