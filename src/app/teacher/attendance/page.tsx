
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, Users2, CalendarDays, Save, Check, X } from 'lucide-react';
import type { ClassWithTeacherInfo, UserProfileWithId, AttendanceStatus, AttendanceRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Timestamp } from 'firebase/firestore';
import Loader from '@/components/shared/Loader';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherAttendancePage() {
  const { currentUser, getClassesByTeacher, getStudentsInClass, saveAttendanceRecords, getAttendanceForClassDate, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<UserProfileWithId[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeacherClasses = useCallback(async () => {
    if (currentUser?.uid) {
      setIsLoadingData(true);
      const classes = await getClassesByTeacher(currentUser.uid);
      setTeacherClasses(classes.filter(c => c.classType === 'main')); // Only main classes for attendance
      setIsLoadingData(false);
    }
  }, [currentUser, getClassesByTeacher]);

  useEffect(() => {
    if (!authLoading) fetchTeacherClasses();
  }, [authLoading, fetchTeacherClasses]);

  const fetchStudentsAndPrevAttendance = useCallback(async () => {
    if (selectedClassId && attendanceDate && currentUser?.schoolId) {
      setIsLoadingData(true);
      const [students, prevRecords] = await Promise.all([
        getStudentsInClass(selectedClassId),
        getAttendanceForClassDate(selectedClassId, Timestamp.fromDate(startOfDay(attendanceDate)), currentUser.schoolId)
      ]);
      setStudentsInSelectedClass(students.sort((a,b) => (a.displayName || "").localeCompare(b.displayName || "")));
      
      const initialRecords: Record<string, AttendanceStatus> = {};
      students.forEach(s => {
        const existingRecord = prevRecords.find(pr => pr.studentId === s.id);
        initialRecords[s.id] = existingRecord?.status || 'present'; 
      });
      setAttendanceRecords(initialRecords);
      setIsLoadingData(false);
    } else {
      setStudentsInSelectedClass([]);
      setAttendanceRecords({});
    }
  }, [selectedClassId, attendanceDate, currentUser?.schoolId, getStudentsInClass, getAttendanceForClassDate]);

  useEffect(() => {
    fetchStudentsAndPrevAttendance();
  }, [fetchStudentsAndPrevAttendance]);


  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClassId || !attendanceDate || Object.keys(attendanceRecords).length === 0 || !currentUser?.uid || !currentUser.schoolId || !currentUser.displayName) {
      toast({ title: "Missing Information", description: "Please select a class, date, and ensure student statuses are set.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const recordsToSave: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>[] = studentsInSelectedClass.map(student => ({
      studentId: student.id,
      studentName: student.displayName || 'N/A',
      classId: selectedClassId,
      className: teacherClasses.find(c=>c.id===selectedClassId)?.name || 'N/A',
      schoolId: currentUser.schoolId!,
      date: Timestamp.fromDate(startOfDay(attendanceDate)), 
      status: attendanceRecords[student.id] || 'present', 
      markedBy: currentUser.uid,
      markedByName: currentUser.displayName,
    }));

    const success = await saveAttendanceRecords(recordsToSave);
    
    if (success) {
      toast({ title: "Attendance Submitted!", description: `Attendance for ${teacherClasses.find(c=>c.id===selectedClassId)?.name} on ${format(attendanceDate, 'PPP')} has been recorded.` });
      fetchStudentsAndPrevAttendance(); 
    } else {
      toast({ title: "Submission Failed", description: "Could not save attendance records.", variant: "destructive" });
    }
    setIsSubmitting(false);
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
            <Label htmlFor="class-select">Class (Main Classes Only)</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={isLoading || teacherClasses.length === 0}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder={teacherClasses.length === 0 ? "No main classes assigned" : "Select a class..."} />
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
            <CardDescription>Mark attendance for {teacherClasses.find(c=>c.id===selectedClassId)?.name} on {format(attendanceDate, 'PPP')}. Default is 'Present'.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-4"><Loader message="Loading students..." /></div> : 
              studentsInSelectedClass.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No students in this class, or class not selected.</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60%]">Student Name</TableHead>
                        <TableHead className="text-right w-[40%]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsInSelectedClass.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.displayName}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant={attendanceRecords[student.id] === 'present' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(student.id, 'present')}
                                disabled={isSubmitting}
                                className={cn("w-24", attendanceRecords[student.id] === 'present' && "bg-primary hover:bg-primary/90")}
                              >
                                <Check className="mr-1 h-4 w-4"/> Present
                              </Button>
                              <Button
                                variant={attendanceRecords[student.id] === 'absent' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                disabled={isSubmitting}
                                className="w-24"
                              >
                               <X className="mr-1 h-4 w-4"/> Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button onClick={handleSubmitAttendance} disabled={isSubmitting || isLoading || studentsInSelectedClass.length === 0} className="w-full mt-6 button-shadow">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <Save className="mr-2 h-4 w-4"/> Submit Attendance
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
