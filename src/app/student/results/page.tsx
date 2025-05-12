
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, CalendarDays, BookOpen } from "lucide-react";
import type { ExamResultWithStudentInfo } from '@/types'; 
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function StudentResultsPage() {
  const { currentUser, getExamResultsForStudent, getSubjectById, getExamPeriodById, getClassDetails, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [resultsByPeriod, setResultsByPeriod] = useState<Record<string, ExamResultWithStudentInfo[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (currentUser?.uid && currentUser.schoolId) {
      setIsLoading(true);
      try {
        const fetchedResults = await getExamResultsForStudent(currentUser.uid, currentUser.schoolId);

        const grouped: Record<string, ExamResultWithStudentInfo[]> = {};
        for (const result of fetchedResults) {
          let subjectName = result.subjectId; 
          let examPeriodName = result.examPeriodId;
          if (getSubjectById && result.subjectId) {
              const subject = await getSubjectById(result.subjectId);
              subjectName = subject?.name || result.subjectId;
          }
          if (getExamPeriodById && result.examPeriodId) {
              // Pass a dummy getClassDetails if it's not strictly needed for exam period name resolution here
              const examPeriod = await getExamPeriodById(result.examPeriodId, async () => null); 
              examPeriodName = examPeriod?.name || result.examPeriodId;
          }

          if (!grouped[examPeriodName]) {
            grouped[examPeriodName] = [];
          }
          grouped[examPeriodName].push({ ...result, subjectName, examPeriodName });
        }
        setResultsByPeriod(grouped);

      } catch (error) {
        toast({ title: "Error", description: "Failed to load exam results.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [currentUser, getExamResultsForStudent, getSubjectById, getExamPeriodById, getClassDetails, authLoading, toast]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading your results..." size="large" />
      </div>
    );
  }

  const hasResults = Object.keys(resultsByPeriod).length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Exam Results</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-primary" />
            Your Performance Overview
          </CardTitle>
          <CardDescription>
            Review your results and teacher remarks for completed exam periods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Exam Results Found</p>
              <p className="text-muted-foreground">Your exam results will appear here once published.</p>
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
