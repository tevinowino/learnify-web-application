
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Download, Users, Loader2 } from 'lucide-react';
import type { ExamResultWithStudentInfo, UserProfileWithId, ExamPeriodWithClassNames, ClassWithTeacherInfo, Subject } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/shared/Loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import html2pdf from 'html2pdf.js';

interface ClassResults {
  classInfo: ClassWithTeacherInfo;
  students: Array<{
    studentInfo: UserProfileWithId;
    results: Record<string, { marks: string; remarks?: string | null }>; // subjectId -> result
  }>;
}

export default function AdminClassResultsSheetPage() {
  const params = React.use(useParams<{ examPeriodId: string }>());
  const router = useRouter();
  const examPeriodId = params.examPeriodId;
  const { toast } = useToast();
  const allSheetsRef = useRef<HTMLDivElement>(null);
  const classSheetRefs = useRef<Record<string, HTMLDivElement | null>>({});


  const {
    currentUser,
    getExamPeriodById,
    getExamResultsForStudent, 
    getClassesByIds,
    getStudentsInClass,
    getSubjectsBySchool,
    loading: authLoading,
  } = useAuth();

  const [examPeriod, setExamPeriod] = useState<ExamPeriodWithClassNames | null>(null);
  const [classResultsSheets, setClassResultsSheets] = useState<ClassResults[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // Stores 'all' or classId

  const fetchData = useCallback(async () => {
    if (!examPeriodId || !currentUser?.schoolId) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);

    try {
      const periodDetails = await getExamPeriodById(examPeriodId);
      if (!periodDetails || periodDetails.schoolId !== currentUser.schoolId) {
        toast({ title: "Error", description: "Exam period not found or not authorized.", variant: "destructive" });
        router.push('/admin/exams');
        return;
      }
      setExamPeriod(periodDetails);

      const subjects = await getSubjectsBySchool(currentUser.schoolId);
      setAllSubjects(subjects.sort((a,b) => a.name.localeCompare(b.name)));

      if (periodDetails.assignedClassIds && periodDetails.assignedClassIds.length > 0) {
        const classesInfo = await getClassesByIds(periodDetails.assignedClassIds);
        const sheets: ClassResults[] = [];

        for (const classInfo of classesInfo) {
          if (!classInfo) continue;
          const studentsInClass = await getStudentsInClass(classInfo.id);
          const studentResultsData: ClassResults['students'] = [];

          for (const student of studentsInClass) {
            const studentResultsForPeriod = await getExamResultsForStudent(student.uid, currentUser.schoolId);
            const resultsForThisPeriod = studentResultsForPeriod.filter(r => r.examPeriodId === examPeriodId);
            
            const resultsBySubject: Record<string, { marks: string; remarks?: string | null }> = {};
            subjects.forEach(subject => {
              const result = resultsForThisPeriod.find(r => r.subjectId === subject.id);
              resultsBySubject[subject.id] = {
                marks: result?.marks?.toString() || '-', 
                remarks: result?.remarks,
              };
            });
            studentResultsData.push({ studentInfo: student, results: resultsBySubject });
          }
          studentResultsData.sort((a,b) => (a.studentInfo.displayName || '').localeCompare(b.studentInfo.displayName || ''));
          sheets.push({ classInfo, students: studentResultsData });
        }
        setClassResultsSheets(sheets);
      }
    } catch (error) {
      console.error("Failed to fetch class results sheet data:", error);
      toast({ title: "Error", description: "Could not load class results sheets.", variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [examPeriodId, currentUser, getExamPeriodById, getClassesByIds, getStudentsInClass, getSubjectsBySchool, getExamResultsForStudent, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleDownloadPDF = (elementRef: React.RefObject<HTMLDivElement> | HTMLDivElement | null, filename: string, type: 'single' | 'all') => {
    const element = elementRef && 'current' in elementRef ? elementRef.current : elementRef;
    if (!element) {
      toast({ title: "Error", description: "Content not found for PDF generation.", variant: "destructive"});
      return;
    }
    
    setIsDownloading(type === 'all' ? 'all' : (element.dataset.classId || 'single'));

    const opt = {
      margin:       [0.5, 0.2, 0.5, 0.2],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: -window.scrollY },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' } // Landscape for wider tables
    };

    html2pdf().from(element).set(opt).save().then(() => {
        setIsDownloading(null);
        toast({title: "Download Started", description: "PDF is downloading."});
    }).catch(err => {
        setIsDownloading(null);
        toast({title: "Download Error", description: "Could not generate PDF. Please try again.", variant: "destructive"});
        console.error("PDF Download error:", err);
    });
  };


  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading results sheets..." size="large" />
      </div>
    );
  }

  if (!examPeriod) {
    return <div className="text-center p-4">Exam period data could not be loaded.</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="outline" onClick={() => router.push(`/admin/exams/${examPeriodId}`)} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exam Period Details
      </Button>

      <div ref={allSheetsRef}> {/* Wrapper for "Download All" */}
        <Card className="card-shadow overflow-hidden">
          <CardHeader className="bg-primary/10 p-6">
              <CardTitle className="text-3xl text-primary">Class Results Sheets</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {examPeriod.name}
                {examPeriod.status === 'completed' && ` (Finalized: ${format(examPeriod.updatedAt.toDate(), 'PPP')})`}
                {examPeriod.status !== 'completed' && ` (Status: ${examPeriod.status.toUpperCase()})`}
              </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
              {classResultsSheets.length === 0 ? (
                  <p className="p-6 text-muted-foreground">No classes or results found for this exam period.</p>
              ) : (
                  classResultsSheets.map(sheet => (
                      <div 
                        key={sheet.classInfo.id} 
                        ref={el => classSheetRefs.current[sheet.classInfo.id] = el}
                        data-class-id={sheet.classInfo.id} 
                        className="mb-8 p-4 sm:p-6 border-b last:border-b-0"
                      >
                          <h3 className="text-xl font-semibold mb-3 flex items-center justify-between">
                              <span className="flex items-center">
                                <Users className="mr-2 h-5 w-5 text-accent"/> Class: {sheet.classInfo.name}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDownloadPDF(classSheetRefs.current[sheet.classInfo.id], `Results_${sheet.classInfo.name.replace(/\s+/g, '_')}_${examPeriod.name.replace(/\s+/g, '_')}.pdf`, 'single')}
                                disabled={isDownloading === sheet.classInfo.id || isDownloading === 'all'}
                                className="button-shadow"
                              >
                                {(isDownloading === sheet.classInfo.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                <Download className="mr-2 h-4 w-4"/> Download Class Sheet
                              </Button>
                          </h3>
                          {sheet.students.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No students in this class to display results for.</p>
                          ) : (
                              <div className="overflow-x-auto">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead className="w-[200px] sticky left-0 bg-card z-10">Student Name</TableHead>
                                              {allSubjects.map(subject => (
                                                  <TableHead key={subject.id} className="text-center min-w-[100px] whitespace-nowrap">{subject.name}</TableHead>
                                              ))}
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {sheet.students.map(({ studentInfo, results }) => (
                                              <TableRow key={studentInfo.id}>
                                                  <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">{studentInfo.displayName}</TableCell>
                                                  {allSubjects.map(subject => (
                                                      <TableCell key={subject.id} className="text-center">
                                                          {results[subject.id]?.marks || '-'}
                                                      </TableCell>
                                                  ))}
                                              </TableRow>
                                          ))}
                                      </TableBody>
                                  </Table>
                              </div>
                          )}
                          
                      </div>
                  ))
              )}
          </CardContent>
          <CardFooter className="p-6 border-t flex justify-end">
              <Button 
                onClick={() => handleDownloadPDF(allSheetsRef, `All_Results_Sheets_${examPeriod.name.replace(/\s+/g, '_')}.pdf`, 'all')} 
                disabled={classResultsSheets.length === 0 || isDownloading === 'all' || !!(isDownloading && isDownloading !== 'all')}
                className="button-shadow"
              >
                  {isDownloading === 'all' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  <Download className="mr-2 h-4 w-4"/> Download All Sheets
              </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
