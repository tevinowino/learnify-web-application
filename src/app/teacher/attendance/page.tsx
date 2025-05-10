"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, Users2, CalendarDays } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId, AttendanceStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

// Mock AttendanceRecord type for UI building
interface MockAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export default function TeacherAttendancePage() {
  const { currentUser, getClassesByTeacher, getStudentsInClass, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<UserProfileWithId[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (currentUser?.uid) {
        setIsLoadingData(true);
        const classes = await getClassesByTeacher(currentUser.uid);
        setTeacherClasses(classes);
        if (classes.length > 0) {
          // setSelectedClassId(classes[0].id); // Optionally pre-select first class
        }
        setIsLoadingData(false);
      }
    };
    if (!authLoading) fetchClasses();
  }, [currentUser, getClassesByTeacher, authLoading]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedClassId) {
        setIsLoadingData(true);
        const students = await getStudentsInClass(selectedClassId);
        setStudentsInSelectedClass(students);
        // Reset records when class changes
        const initialRecords: Record<string, AttendanceStatus> = {};
        students.forEach(s => initialRecords[s.id] = 'present'); // Default to present
        setAttendanceRecords(initialRecords);
        setIsLoadingData(false);
      } else {
        setStudentsInSelectedClass([]);
        setAttendanceRecords({});
      }
    };
    fetchStudents();
  }, [selectedClassId, getStudentsInClass]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClassId || !attendanceDate || Object.keys(attendanceRecords).length === 0) {
      toast({ title: "Missing Information", description: "Please select a class, date, and mark attendance for students.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // TODO: Implement actual service call to save attendance records
    // For each student in attendanceRecords:
    // await saveAttendanceRecord({ studentId, classId: selectedClassId, date: attendanceDate, status, markedBy: currentUser.uid });
    console.log("Submitting Attendance:", { classId: selectedClassId, date: attendanceDate, records: attendanceRecords });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    toast({ title: "Attendance Submitted!", description: `Attendance for ${teacherClasses.find(c=>c.id===selectedClassId)?.name} on ${format(attendanceDate, 'PPP')} has been recorded.` });
    setIsSubmitting(false);
    // Optionally reset or fetch latest attendance status for the day
  };

  const isLoading = authLoading || isLoadingData;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mark Attendance</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/>Select Class and Date</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="class-select">Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={isLoading}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="attendance-date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="attendance-date"
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!attendanceDate && "text-muted-foreground"}`}
                  disabled={isLoading}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {attendanceDate ? format(attendanceDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={attendanceDate}
                  onSelect={setAttendanceDate}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && attendanceDate && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Users2 className="mr-2 h-5 w-5 text-primary"/>Student List</CardTitle>
            <CardDescription>Mark attendance for {teacherClasses.find(c=>c.id===selectedClassId)?.name} on {format(attendanceDate, 'PPP')}.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : 
              studentsInSelectedClass.length === 0 ? (
                <p className="text-muted-foreground">No students in this class, or class not selected.</p>
              ) : (
                <div className="space-y-3">
                  {studentsInSelectedClass.map(student => (
                    <div key={student.id} className="flex flex-col sm:flex-row items-center justify-between p-3 border rounded-md">
                      <span className="font-medium mb-2 sm:mb-0">{student.displayName}</span>
                      <Select 
                        onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)} 
                        value={attendanceRecords[student.id] || 'present'}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="excused">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <Button onClick={handleSubmitAttendance} disabled={isSubmitting || studentsInSelectedClass.length === 0} className="w-full mt-4 button-shadow">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <UserCheck className="mr-2 h-4 w-4"/> Submit Attendance
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
