
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, CalendarDays, BookOpen, User, AlertTriangle, ArrowLeft } from "lucide-react";
import type { ExamResultWithStudentInfo, UserProfileWithId } from '@/types'; 
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader'; 
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ParentChildResultsPage() {
  const { 
    currentUser, 
    getExamResultsForStudent, 
    getSubjectById, 
    getExamPeriodById, 
    getClassDetails, 
    getUserProfile, 
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [childProfile, setChildProfile] = useState<UserProfileWithId | null>(null); 
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

      if (child && child.uid) { 
        const fetchedResults = await getExamResultsForStudent(
          child.uid, 
          currentUser.schoolId
        );

        const grouped: Record<string, ExamResultWithStudentInfo[]> = {};
        for (const result of fetchedResults) {
          let subjectName = result.subjectId; 
          let examPeriodName = result.examPeriodId;

          if (getSubjectById && result.subjectId) {
              const subject = await getSubjectById(result.subjectId);
              subjectName = subject?.name || result.subjectId;
          }
          if (getExamPeriodById && result.examPeriodId) {
              const examPeriod = await getExamPeriodById(result.examPeriodId, async () => null); 
              examPeriodName = examPeriod?.name || result.examPeriodId;
          }
          
          if (!grouped[examPeriodName]) {
            grouped[examPeriodName] = [];
          }
          grouped[examPeriodName].push({ ...result, subjectName, examPeriodName });
        }
        // Sort results within each period by subject name
        for (const period in grouped) {
            grouped[period].sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
        }
        setResultsByPeriod(grouped);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load your child's exam results.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, getUserProfile, getExamResultsForStudent, authLoading, toast, getSubjectById, getExamPeriodById, getClassDetails]);

  useEffect(() => {
    fetchChildAndResults();
  }, [fetchChildAndResults]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading results..." size="large" />
      </div>
    );
  }

  if (!currentUser?.childStudentId) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Child Not Linked</CardTitle>
        </CardHeader>
        <CardContent>
            <p>Please link your child's account on your profile page to view their exam results.</p>
            <Button asChild className="mt-4 button-shadow">
                <Link href="/parent/profile">Go to Profile to Link Child</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }
  
  const hasResults = Object.keys(resultsByPeriod).length > 0;

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/parent/dashboard')} className="mb-4 button-shadow">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      <h1 className="text-3xl font-bold">Child's Exam Results</h1>
      {childProfile && <p className="text-muted-foreground">Viewing results for: {childProfile.displayName}</p>}

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-primary" />
            Exam Performance
          </CardTitle>
          <CardDescription>
            Review your child's exam results and teacher remarks for completed exam periods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Exam Results Found</p>
              <p className="text-muted-foreground">Your child's exam results will appear here once published by the school.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {Object.entries(resultsByPeriod).map(([periodName, periodResults]) => (
                <AccordionItem value={periodName} key={periodName} className="border rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="px-4 py-3 text-lg hover:no-underline hover:bg-muted/50 rounded-t-md">
                     <div className="flex items-center">
                        <CalendarDays className="mr-2 h-5 w-5 text-primary/80" /> {periodName}
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
