
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ClipboardCheck, FileEdit, Save, AlertTriangle } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId, Subject, ExamPeriod, ExamResultWithStudentInfo, School } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Loader from '@/components/shared/Loader';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherResultsPage() {
  const { 
    currentUser, 
    getClassesByTeacher, 
    getStudentsInClass, 
    getSubjectsBySchool,
    getExamPeriodsBySchool, 
    addOrUpdateExamResult,
    getExamResultsForTeacher,
    getSchoolDetails, 
    addActivity,
    addNotification,
    getLinkedParentForStudent,
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();
  
  const [schoolDetails, setSchoolDetails] = useState<School | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  
  const [selectedExamPeriodId, setSelectedExamPeriodId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<UserProfileWithId[]>([]);
  const [results, setResults] = useState<Record<string, { marks: string; remarks: string }>>({});
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (currentUser?.uid && currentUser.schoolId) {
      setIsLoadingData(true);
      try {
        const [school, classes, subjects, periods] = await Promise.all([
          getSchoolDetails(currentUser.schoolId),
          getClassesByTeacher(currentUser.uid),
          getSubjectsBySchool(currentUser.schoolId),
          getExamPeriodsBySchool(currentUser.schoolId) 
        ]);
        setSchoolDetails(school);
        setTeacherClasses(classes.sort((a,b) => a.name.localeCompare(b.name)));
        setSchoolSubjects(subjects.sort((a,b) => a.name.localeCompare(b.name)));
        setExamPeriods(periods.filter(p => p.status === 'active' || p.status === 'grading'));
      } catch (error) {
        toast({title: "Error", description: "Could not load initial data.", variant: "destructive"});
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [currentUser, getSchoolDetails, getClassesByTeacher, getSubjectsBySchool, getExamPeriodsBySchool, toast]);

  useEffect(() => {
    if (!authLoading) fetchInitialData();
  }, [authLoading, fetchInitialData]);

  const fetchStudentsAndExistingResults = useCallback(async () => {
    if (selectedClassId && selectedExamPeriodId && selectedSubjectId && currentUser?.schoolId) {
      setIsLoadingData(true);
      try {
        const [students, existingResults] = await Promise.all([
          getStudentsInClass(selectedClassId),
          getExamResultsForTeacher(selectedExamPeriodId, selectedClassId, selectedSubjectId, currentUser.schoolId)
        ]);
        setStudentsInSelectedClass(students.sort((a,b) => (a.displayName || "").localeCompare(b.displayName || "")));
        
        const initialResults: Record<string, { marks: string; remarks: string }> = {};
        students.forEach(s => {
          const existing = existingResults.find(er => er.studentId === s.id);
          initialResults[s.id] = { 
            marks: existing?.marks?.toString() || '', 
            remarks: existing?.remarks || '' 
          };
        });
        setResults(initialResults);

      } catch (error) {
        toast({title: "Error", description: "Could not load students or existing results.", variant: "destructive"});
      } finally {
        setIsLoadingData(false);
      }
    } else {
      setStudentsInSelectedClass([]);
      setResults({});
    }
  }, [selectedClassId, selectedExamPeriodId, selectedSubjectId, currentUser?.schoolId, getStudentsInClass, getExamResultsForTeacher, toast]);

  useEffect(() => {
    fetchStudentsAndExistingResults();
  }, [fetchStudentsAndExistingResults]);


  const handleResultChange = (studentId: string, field: 'marks' | 'remarks', value: string) => {
    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { marks: '', remarks: '' }),
        [field]: value,
      }
    }));
  };

  const handleSubmitResults = async () => {
    if (!selectedExamPeriodId || !selectedClassId || !selectedSubjectId || Object.keys(results).length === 0 || !currentUser?.uid || !currentUser.schoolId || !currentUser.displayName) {
      toast({ title: "Missing Information", description: "Please select exam, class, subject, and enter results for at least one student.", variant: "destructive" });
      return;
    }
    
    const activeExamPeriod = examPeriods.find(ep => ep.id === selectedExamPeriodId);
    if (!activeExamPeriod || (activeExamPeriod.status !== 'active' && activeExamPeriod.status !== 'grading')) {
        toast({ title: "Cannot Submit", description: "Results can only be entered for 'active' or 'grading' exam periods.", variant: "destructive" });
        return;
    }
    if (!schoolDetails?.isExamModeActive) {
        toast({ title: "Exam Mode Off", description: "School-wide Exam Mode is not active. Results cannot be entered. Ask an admin to activate it.", variant: "destructive" });
        return;
    }


    setIsSubmitting(true);
    let allSuccessful = true;
    const examPeriodName = examPeriods.find(ep => ep.id === selectedExamPeriodId)?.name || "Selected Exam";
    const subjectName = schoolSubjects.find(s => s.id === selectedSubjectId)?.name || "Selected Subject";
    const className = teacherClasses.find(c => c.id === selectedClassId)?.name || "Selected Class";

    for (const studentId of Object.keys(results)) {
        const studentResult = results[studentId];
        if (studentResult.marks.trim() === '' && studentResult.remarks.trim() === '') continue; 

        const success = await addOrUpdateExamResult({
            studentId,
            examPeriodId: selectedExamPeriodId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            schoolId: currentUser.schoolId,
            marks: studentResult.marks,
            remarks: studentResult.remarks,
            teacherId: currentUser.uid,
        });
        if (!success) {
            allSuccessful = false;
            toast({ title: "Error Saving Result", description: `Failed to save result for student ID ${studentId}.`, variant: "destructive"});
        } else {
            const student = studentsInSelectedClass.find(s => s.id === studentId);
            if (student && student.displayName) {
                await addNotification({
                    userId: student.id,
                    schoolId: currentUser.schoolId,
                    message: `Your results for ${subjectName} in ${examPeriodName} have been updated by ${currentUser.displayName}.`,
                    type: 'exam_results_entered',
                    link: `/student/results`,
                    actorName: currentUser.displayName
                });
                const parent = await getLinkedParentForStudent(student.id);
                if (parent && parent.schoolId === currentUser.schoolId) {
                     await addNotification({
                        userId: parent.id,
                        schoolId: currentUser.schoolId,
                        message: `${student.displayName}'s results for ${subjectName} in ${examPeriodName} have been updated.`,
                        type: 'exam_results_entered',
                        link: `/parent/results`,
                        actorName: currentUser.displayName
                    });
                }
            }
        }
    }
    
    if (allSuccessful) {
        toast({ title: "Results Submitted!", description: `Results for ${examPeriodName} - ${className} - ${subjectName} have been recorded.` });
        if (currentUser.displayName && currentUser.schoolId) {
            await addActivity({
                schoolId: currentUser.schoolId,
                actorId: currentUser.uid,
                actorName: currentUser.displayName,
                classId: selectedClassId,
                type: 'exam_results_entered',
                message: `${currentUser.displayName} entered/updated results for ${examPeriodName} - ${className} - ${subjectName}.`,
            });
        }
    } else {
        toast({ title: "Partial Submission", description: "Some results may not have been saved. Please review.", variant: "destructive" });
    }
    setIsSubmitting(false);
    fetchStudentsAndExistingResults(); 
  };

  const isLoadingSelectors = authLoading || isLoadingData;
  const filteredClassesForExamPeriod = teacherClasses.filter(cls => 
    examPeriods.find(ep => ep.id === selectedExamPeriodId)?.assignedClassIds.includes(cls.id)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Enter Exam Results</h1>
      
      {!schoolDetails?.isExamModeActive && !isLoadingSelectors && (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/> Exam Mode Disabled</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive-foreground">
                    School-wide Exam Mode is currently OFF. Results cannot be entered or edited.
                    Please ask an administrator to activate Exam Mode in School Settings.
                </p>
            </CardContent>
        </Card>
      )}

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><FileEdit className="mr-2 h-5 w-5 text-primary"/>Select Exam, Class, and Subject</CardTitle>
          <CardDescription>Results can only be entered for 'Active' or 'Grading' exam periods and if School Exam Mode is ON.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="exam-period-select">Exam Period</Label>
            <Select onValueChange={setSelectedExamPeriodId} value={selectedExamPeriodId} disabled={isLoadingSelectors || examPeriods.length === 0}>
              <SelectTrigger id="exam-period-select"><SelectValue placeholder="Select exam..." /></SelectTrigger>
              <SelectContent>
                {examPeriods.map(ep => (
                  <SelectItem key={ep.id} value={ep.id}>{ep.name} ({ep.status})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {examPeriods.length === 0 && <p className="text-xs text-muted-foreground mt-1">No active/grading exam periods assigned to your classes.</p>}
          </div>
          <div>
            <Label htmlFor="class-select-exam">Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={isLoadingSelectors || !selectedExamPeriodId || filteredClassesForExamPeriod.length === 0}>
              <SelectTrigger id="class-select-exam"><SelectValue placeholder="Select class..." /></SelectTrigger>
              <SelectContent>
                {filteredClassesForExamPeriod.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             {!selectedExamPeriodId && <p className="text-xs text-muted-foreground mt-1">Select an exam period first.</p>}
             {selectedExamPeriodId && filteredClassesForExamPeriod.length === 0 && <p className="text-xs text-muted-foreground mt-1">No classes assigned to this exam period for you.</p>}
          </div>
          <div>
            <Label htmlFor="subject-select-exam">Subject</Label>
             <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} disabled={isLoadingSelectors || !selectedClassId || schoolSubjects.length === 0}>
              <SelectTrigger id="subject-select-exam"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>
                {schoolSubjects.map(sub => (
                     <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             {!selectedClassId && <p className="text-xs text-muted-foreground mt-1">Select a class first.</p>}
             {schoolSubjects.length === 0 && <p className="text-xs text-muted-foreground mt-1">No subjects configured.</p>}
          </div>
        </CardContent>
      </Card>

      {selectedExamPeriodId && selectedClassId && selectedSubjectId && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><ClipboardCheck className="mr-2 h-5 w-5 text-primary"/>Enter Student Results</CardTitle>
            <CardDescription>
              For: {examPeriods.find(ep => ep.id === selectedExamPeriodId)?.name} - {teacherClasses.find(c=>c.id===selectedClassId)?.name} - {schoolSubjects.find(s => s.id === selectedSubjectId)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? <div className="flex justify-center py-4"><Loader message="Loading students & results..." /></div> : 
              studentsInSelectedClass.length === 0 ? (
                <p className="text-muted-foreground text-center">No students in this class, or selection incomplete.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%] sm:w-[30%]">Student</TableHead>
                          <TableHead className="w-[30%] sm:w-[25%]">Marks/Grade (%)</TableHead>
                          <TableHead className="w-[30%] sm:w-[45%]">Remarks (Optional)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsInSelectedClass.map(student => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="font-medium whitespace-nowrap">{student.displayName}</div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">{student.email}</div>
                            </TableCell>
                            <TableCell>
                              <Input 
                                id={`marks-${student.id}`}
                                value={results[student.id]?.marks || ''}
                                onChange={(e) => handleResultChange(student.id, 'marks', e.target.value)}
                                placeholder="e.g., 85"
                                disabled={isSubmitting || !schoolDetails?.isExamModeActive}
                                className="w-full min-w-[100px] sm:max-w-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                id={`remarks-${student.id}`}
                                value={results[student.id]?.remarks || ''}
                                onChange={(e) => handleResultChange(student.id, 'remarks', e.target.value)}
                                placeholder="e.g., Excellent work!"
                                rows={1}
                                disabled={isSubmitting || !schoolDetails?.isExamModeActive}
                                className="min-h-[40px]"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button onClick={handleSubmitResults} disabled={isSubmitting || isLoadingData || studentsInSelectedClass.length === 0 || !schoolDetails?.isExamModeActive} className="w-full mt-6 button-shadow">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <Save className="mr-2 h-4 w-4"/> Save All Results
                  </Button>
                </div>
              )
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    
