"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ClipboardCheck, FileEdit, Save } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId, Subject } from '@/types'; // Assuming ExamPeriod type
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

// Mock ExamPeriod type
interface MockExamPeriod {
  id: string;
  name: string;
  assignedClassIds: string[];
}

export default function TeacherResultsPage() {
  const { currentUser, getClassesByTeacher, getStudentsInClass, /* getSubjectsBySchool, */ loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  // const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  // const [examPeriods, setExamPeriods] = useState<MockExamPeriod[]>([]); // TODO: Fetch actual exam periods
  
  const [selectedExamPeriodId, setSelectedExamPeriodId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<UserProfileWithId[]>([]);
  const [results, setResults] = useState<Record<string, { marks: string; remarks: string }>>({}); // studentId -> {marks, remarks}
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder for exam periods - replace with actual data fetching
  const mockExamPeriods: MockExamPeriod[] = [
    { id: 'midterm2024', name: 'Mid-Term Exams 2024', assignedClassIds: [] /* Populate this if needed for filtering */ },
    { id: 'final2024', name: 'Final Exams 2024', assignedClassIds: [] },
  ];


  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.uid && currentUser.schoolId) {
        setIsLoadingData(true);
        const [classes /*, subjects*/] = await Promise.all([
          getClassesByTeacher(currentUser.uid),
          // getSubjectsBySchool(currentUser.schoolId) // If subjects are global
        ]);
        setTeacherClasses(classes);
        // setSchoolSubjects(subjects);
        // setExamPeriods(mockExamPeriods); // TODO: Fetch real exam periods
        setIsLoadingData(false);
      }
    };
    if (!authLoading) fetchData();
  }, [currentUser, getClassesByTeacher, /*getSubjectsBySchool,*/ authLoading]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedClassId) {
        setIsLoadingData(true);
        const students = await getStudentsInClass(selectedClassId);
        setStudentsInSelectedClass(students);
        // Reset results when class changes
        const initialResults: Record<string, { marks: string; remarks: string }> = {};
        students.forEach(s => initialResults[s.id] = { marks: '', remarks: ''});
        setResults(initialResults);
        setIsLoadingData(false);
      } else {
        setStudentsInSelectedClass([]);
        setResults({});
      }
    };
    if (selectedClassId) fetchStudents();
  }, [selectedClassId, getStudentsInClass]);

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
    if (!selectedExamPeriodId || !selectedClassId || !selectedSubjectId || Object.keys(results).length === 0) {
      toast({ title: "Missing Information", description: "Please select exam, class, subject, and enter results.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // TODO: Implement actual service call to save exam results
    // For each student in results:
    // await saveExamResult({ studentId, examPeriodId, classId, subjectId, marks, remarks, teacherId: currentUser.uid });
    console.log("Submitting Results:", { examPeriodId: selectedExamPeriodId, classId: selectedClassId, subjectId: selectedSubjectId, results });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    toast({ title: "Results Submitted!", description: `Results for the selected exam, class, and subject have been recorded.` });
    setIsSubmitting(false);
  };

  const isLoading = authLoading || isLoadingData;

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
                {mockExamPeriods.map(ep => (
                  <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="class-select-exam">Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={isLoading || !selectedExamPeriodId}>
              <SelectTrigger id="class-select-exam"><SelectValue placeholder="Select class..." /></SelectTrigger>
              <SelectContent>
                {teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subject-select-exam">Subject</Label>
             <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} disabled={isLoading || !selectedClassId}>
              <SelectTrigger id="subject-select-exam"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>
                {/* TODO: Populate with actual subjects for the school/class */}
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="history">History</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedExamPeriodId && selectedClassId && selectedSubjectId && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><ClipboardCheck className="mr-2 h-5 w-5 text-primary"/>Enter Student Results</CardTitle>
            <CardDescription>
              For: {mockExamPeriods.find(ep => ep.id === selectedExamPeriodId)?.name} - {teacherClasses.find(c=>c.id===selectedClassId)?.name} - Subject ID: {selectedSubjectId}
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
                      <h4 className="font-semibold">{student.displayName}</h4>
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
