
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, BarChart2, Download, Brain, Wand2, Loader2, UserCircle } from 'lucide-react';
import type { ExamResultWithStudentInfo, UserProfileWithId, ExamPeriodWithClassNames, ReportCardAnalysisInput } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/shared/Loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function StudentReportCardPage() {
  const params = useParams<{ examPeriodId: string }>();
  const router = useRouter();
  const examPeriodId = params.examPeriodId;
  const { toast } = useToast();

  const {
    currentUser,
    getExamResultsForStudent,
    getExamPeriodById,
    getUserProfile, 
    generateReportCardAnalysis,
    loading: authLoading,
  } = useAuth();

  const [studentProfile, setStudentProfile] = useState<UserProfileWithId | null>(null);
  const [examPeriod, setExamPeriod] = useState<ExamPeriodWithClassNames | null>(null);
  const [results, setResults] = useState<ExamResultWithStudentInfo[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!examPeriodId || !currentUser?.uid || !currentUser.schoolId) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    setAiAnalysis(null); 

    try {
      const [profile, periodDetails, fetchedResults] = await Promise.all([
        getUserProfile(currentUser.uid),
        getExamPeriodById(examPeriodId),
        getExamResultsForStudent(currentUser.uid, currentUser.schoolId)
      ]);

      setStudentProfile(profile);

      if (!periodDetails || periodDetails.schoolId !== currentUser.schoolId) {
        toast({ title: "Error", description: "Exam period not found or not authorized.", variant: "destructive" });
        router.push('/student/results');
        return;
      }
      if (periodDetails.status !== 'completed') {
        toast({ title: "Not Finalized", description: "This exam period has not been finalized yet. Report card is unavailable.", variant: "outline" });
        router.push('/student/results');
        return;
      }
      setExamPeriod(periodDetails);

      const relevantResults = fetchedResults.filter(r => r.examPeriodId === examPeriodId)
                                          .sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
      setResults(relevantResults);

      if (relevantResults.length > 0 && periodDetails.status === 'completed') {
        setIsAnalyzing(true);
        const aiInput: ReportCardAnalysisInput = {
          studentName: profile?.displayName || "Student",
          examPeriodName: periodDetails.name,
          results: relevantResults.map(r => ({
            subjectName: r.subjectName || "Unknown Subject",
            marks: r.marks.toString(),
            remarks: r.remarks || undefined,
          })),
        };
        const analysisResult = await generateReportCardAnalysis(aiInput);
        setAiAnalysis(analysisResult?.analysis || "Could not generate AI analysis at this time.");
        setIsAnalyzing(false);
      } else if (relevantResults.length === 0) {
        setAiAnalysis("No results found for this period to analyze.");
      } else {
        setAiAnalysis("AI analysis will be available once the exam period is finalized by the school.");
      }

    } catch (error) {
      console.error("Failed to fetch report card data:", error);
      toast({ title: "Error", description: "Could not load report card details.", variant: "destructive" });
      setAiAnalysis("Error generating AI analysis.");
    } finally {
      setIsLoadingPage(false);
      setIsAnalyzing(false);
    }
  }, [examPeriodId, currentUser, getUserProfile, getExamPeriodById, getExamResultsForStudent, generateReportCardAnalysis, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading report card..." size="large" />
      </div>
    );
  }

  if (!studentProfile || !examPeriod) {
    return <div className="text-center p-4">Report card data could not be loaded.</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="outline" onClick={() => router.push('/student/results')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Results
      </Button>

      <Card className="card-shadow overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary">
              <AvatarImage src={studentProfile.photoURL || undefined} alt={studentProfile.displayName || 'Student'} />
              <AvatarFallback className="text-3xl bg-primary/20">
                {studentProfile.displayName ? studentProfile.displayName.charAt(0).toUpperCase() : <UserCircle />}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-3xl text-primary">{studentProfile.displayName}'s Report Card</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{examPeriod.name}</CardDescription>
              <p className="text-sm text-muted-foreground">
                Date Issued: {format(new Date(), 'PPP')} (Results from period ending {format(examPeriod.endDate.toDate(), 'PPP')})
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-accent"/> Academic Performance</h3>
            {results.length === 0 ? (
              <p className="text-muted-foreground">No results recorded for this exam period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Subject</TableHead>
                    <TableHead className="w-[20%] text-center">Marks/Grade</TableHead>
                    <TableHead>Teacher's Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(result => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.subjectName || 'Unknown Subject'}</TableCell>
                      <TableCell className="text-center font-semibold">{result.marks}</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">{result.remarks || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
                <Wand2 className="mr-2 h-5 w-5 text-accent"/> AI Performance Overview
            </h3>
            {isAnalyzing ? (
              <div className="flex items-center text-muted-foreground p-4 bg-muted/50 rounded-md">
                <Loader2 className="h-5 w-5 animate-spin mr-2"/> Generating analysis...
              </div>
            ) : aiAnalysis ? (
              <div className="p-4 bg-muted/50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">AI analysis will appear here.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t p-6 flex justify-end">
            <Button className="button-shadow" disabled>
                <Download className="mr-2 h-4 w-4"/> Download Report (PDF) - Coming Soon
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
