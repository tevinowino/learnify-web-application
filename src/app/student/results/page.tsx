
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, CalendarDays, BookOpen, FileText as ReportIcon } from "lucide-react"; // Added ReportIcon
import type { ExamResultWithStudentInfo, ExamPeriod } from '@/types'; 
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Loader from '@/components/shared/Loader'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button'; // Added Button
import Link from 'next/link'; // Added Link

export default function StudentResultsPage() {
  const { currentUser, getExamResultsForStudent, getSubjectById, getExamPeriodById, getClassDetails, getExamPeriodsBySchool, loading: authLoading } = useAuth(); // Add getExamPeriodsBySchool
  const { toast } = useToast();
  const [resultsByPeriod, setResultsByPeriod] = useState<Record<string, ExamResultWithStudentInfo[]>>({});
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]); // Store fetched exam periods
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (currentUser?.uid && currentUser.schoolId) {
      setIsLoading(true);
      try {
       const [fetchedResults, fetchedExamPeriods] = await Promise.all([
         getExamResultsForStudent(currentUser.uid, currentUser.schoolId),
         getExamPeriodsBySchool(currentUser.schoolId)
       ]);
       setExamPeriods(fetchedExamPeriods);

        const grouped: Record<string, ExamResultWithStudentInfo[]> = {};
        for (const result of fetchedResults) {
          let subjectName = result.subjectId; 
          let examPeriodName = result.examPeriodId;

          if (getSubjectById && result.subjectId) {
              const subject = await getSubjectById(result.subjectId);
              subjectName = subject?.name || result.subjectId;
          }
          if (getExamPeriodById && result.examPeriodId) {
              // Pass a dummy getClassDetails to getExamPeriodById as it's not strictly needed for just the period name here
              const examPeriod = await getExamPeriodById(result.examPeriodId, async () => null); 
              examPeriodName = examPeriod?.name || result.examPeriodId;
          }

          if (!grouped[examPeriodName]) {
            grouped[examPeriodName] = [];
          }
          // Add subjectName and examPeriodName to the result object before pushing
          grouped[examPeriodName].push({ ...result, subjectName, examPeriodName });
        }
        // Sort results within each period by subject name
        for (const period in grouped) {
            grouped[period].sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
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
  }, [currentUser, getExamResultsForStudent, getSubjectById, getExamPeriodById, getClassDetails, getExamPeriodsBySchool, authLoading, toast]);

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
            <Accordion type="multiple" className="w-full space-y-3">
              {Object.entries(resultsByPeriod).map(([periodName, periodResults]) => (
                <AccordionItem value={periodName} key={periodName} className="border rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="px-4 py-3 text-lg hover:no-underline hover:bg-muted/50 rounded-t-md">
                     <div className="flex items-center justify-between w-full">
                        <span className="flex items-center">
                            <CalendarDays className="mr-2 h-5 w-5 text-primary/80" /> {periodName}
                        </span>
                       {periodResults.length > 0 && examPeriods.find(p=>p.name === periodName)?.status === 'completed' && (
                           <Button variant="link" size="sm" asChild onClick={(e) => e.stopPropagation()} className="text-xs h-auto py-0 px-1 mr-2">
                               <Link href={`/student/results/${periodResults[0].examPeriodId}/report`}>
                                <ReportIcon className="mr-1 h-3.5 w-3.5"/> View Report Card
                               </Link>
                           </Button>
                       )}
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-2 pt-0">
                    {periodResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4">No results found for this period.</p>
                    ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Subject</TableHead>
                          <TableHead className="w-[20%] text-center">Marks (%)</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {periodResults.map(result => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium flex items-center">
                                <BookOpen className="mr-2 h-4 w-4 text-secondary-foreground/70"/>
                                {result.subjectName || 'Unknown Subject'}
                            </TableCell>
                            <TableCell className="text-center font-semibold">{result.marks}</TableCell>
                            <TableCell className="text-sm text-muted-foreground italic">
                                {result.remarks || 'N/A'}
                                <p className="text-xs text-muted-foreground/70 mt-1">Graded: {format(result.updatedAt.toDate(), 'PP')}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    )}
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

