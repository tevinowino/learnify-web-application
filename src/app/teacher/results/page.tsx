
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ClipboardCheck, FileEdit, Save } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId, Subject, ExamPeriod, ExamResultWithStudentInfo } from '@/types';
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

export default function TeacherResultsPage() {
  const { 
    currentUser, 
    getClassesByTeacher, 
    getStudentsInClass, 
    getSubjectsBySchool,
    getExamPeriodsBySchool, 
    addOrUpdateExamResult,
    getExamResultsForTeacher,
    addActivity,
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();
  
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
        const [classes, subjects, periods] = await Promise.all([
          getClassesByTeacher(currentUser.uid),
          getSubjectsBySchool(currentUser.schoolId),
          getExamPeriodsBySchool(currentUser.schoolId, async () => null) // Pass dummy getClassDetails if not needed for names here
        ]);
        setTeacherClasses(classes);
        setSchoolSubjects(subjects);
        setExamPeriods(periods.filter(p => p.status !== 'completed' && p.status !== 'upcoming')); // Only active/grading periods
      } catch (error) {
        toast({title: "Error", description: "Could not load initial data.", variant: "destructive"});
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [currentUser, getClassesByTeacher, getSubjectsBySchool, getExamPeriodsBySchool, toast]);

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
        setStudentsInSelectedClass(students);
        
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
        ...prev[studentId],
        [field]: value,
      }
    }));
  };

  const handleSubmitResults = async () => {
    if (!selectedExamPeriodId || !selectedClassId || !selectedSubjectId || Object.keys(results).length === 0 || !currentUser?.uid || !currentUser.schoolId) {
      toast({ title: "Missing Information", description: "Please select exam, class, subject, and enter results for at least one student.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    let allSuccessful = true;
    for (const studentId of Object.keys(results)) {
        const studentResult = results[studentId];
        if (studentResult.marks.trim() === '') continue; // Skip if no marks entered

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
            // Potentially stop on first error or continue
        }
    }
    
    if (allSuccessful) {
        toast({ title: "Results Submitted!", description: `Results for the selected exam, class, and subject have been recorded.` });
        // Log activity
        if (currentUser.displayName && currentUser.schoolId) {
            const examPeriod = examPeriods.find(ep => ep.id === selectedExamPeriodId);
            const className = teacherClasses.find(c => c.id === selectedClassId)?.name;
            const subjectName = schoolSubjects.find(s => s.id === selectedSubjectId)?.name;
            if (examPeriod && className && subjectName) {
                addActivity({
                    schoolId: currentUser.schoolId,
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName,
                    classId: selectedClassId,
                    type: 'exam_results_entered',
                    message: `${currentUser.displayName} entered results for ${examPeriod.name} - ${className} - ${subjectName}.`,
                    // link: `/teacher/results?examPeriodId=${selectedExamPeriodId}&classId=${selectedClassId}&subjectId=${selectedSubjectId}`
                });
            }
        }
    } else {
        toast({ title: "Partial Submission", description: "Some results may not have been saved. Please review.", variant: "destructive" });
    }
    setIsSubmitting(false);
    fetchStudentsAndExistingResults(); // Refresh results
  };

  const isLoading = authLoading || isLoadingData;
  
  const filteredClassesForExamPeriod = teacherClasses.filter(cls => 
    examPeriods.find(ep => ep.id === selectedExamPeriodId)?.assignedClassIds.includes(cls.id)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Enter Exam Results</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><FileEdit className="mr-2 h-5 w-5 text-primary"/>Select Exam, Class, and Subject</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="exam-period-select">Exam Period</Label>
            <Select onValueChange={setSelectedExamPeriodId} value={selectedExamPeriodId} disabled={isLoading}>
              <SelectTrigger id="exam-period-select"><SelectValue placeholder="Select exam..." /></SelectTrigger>
              <SelectContent>
                {examPeriods.map(ep => (
                  <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="class-select-exam">Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={isLoading || !selectedExamPeriodId || filteredClassesForExamPeriod.length === 0}>
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
             <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} disabled={isLoading || !selectedClassId}>
              <SelectTrigger id="subject-select-exam"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>
                {schoolSubjects.map(sub => (
                     <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedClassId && <p className="text-xs text-muted-foreground mt-1">Select a class first.</p>}
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
            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : 
              studentsInSelectedClass.length === 0 ? (
                <p className="text-muted-foreground">No students in this class, or selection incomplete.</p>
              ) : (
                <div className="space-y-4">
                  {studentsInSelectedClass.map(student => (
                    <div key={student.id} className="p-4 border rounded-md space-y-3">
                      <h4 className="font-semibold">{student.displayName} <span className="text-xs text-muted-foreground">({student.email})</span></h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`marks-${student.id}`}>Marks/Grade</Label>
                          <Input 
                            id={`marks-${student.id}`}
                            value={results[student.id]?.marks || ''}
                            onChange={(e) => handleResultChange(student.id, 'marks', e.target.value)}
                            placeholder="e.g., A, 85%"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                           <Label htmlFor={`remarks-${student.id}`}>Remarks (Optional)</Label>
                          <Textarea
                            id={`remarks-${student.id}`}
                            value={results[student.id]?.remarks || ''}
                            onChange={(e) => handleResultChange(student.id, 'remarks', e.target.value)}
                            placeholder="e.g., Excellent work!"
                            rows={2}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button onClick={handleSubmitResults} disabled={isSubmitting || studentsInSelectedClass.length === 0} className="w-full mt-6 button-shadow">
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

