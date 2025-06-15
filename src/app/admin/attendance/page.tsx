
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users2, CalendarDays, Filter, AlertTriangle } from "lucide-react";
import type { ClassWithTeacherInfo, AttendanceRecord } from '@/types';
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
import { format, startOfDay, endOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAttendancePage() {
  const { currentUser, getClassesBySchool, getAttendanceForSchoolClassRange, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [schoolClasses, setSchoolClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (currentUser?.schoolId) {
        setIsLoadingData(true);
        const classes = await getClassesBySchool(currentUser.schoolId);
        setSchoolClasses(classes.sort((a,b) => a.name.localeCompare(b.name)));
        setIsLoadingData(false);
      }
    };
    if (!authLoading) fetchClasses();
  }, [currentUser, getClassesBySchool, authLoading]);

  const fetchAttendance = useCallback(async () => {
    if (selectedClassId && attendanceDate && currentUser?.schoolId) {
      setIsLoadingData(true);
      const startDate = Timestamp.fromDate(startOfDay(attendanceDate));
      const endDate = Timestamp.fromDate(endOfDay(attendanceDate)); 
      
      const records = await getAttendanceForSchoolClassRange(selectedClassId, currentUser.schoolId, startDate, endDate);
      records.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
      setAttendanceRecords(records);
      setIsLoadingData(false);
    } else {
      setAttendanceRecords([]);
      if (selectedClassId && attendanceDate) {
        setIsLoadingData(false);
      }
    }
  }, [selectedClassId, attendanceDate, currentUser?.schoolId, getAttendanceForSchoolClassRange]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusBadgeVariant = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'default' as const;
      case 'absent': return 'destructive' as const;
      case 'late': return 'secondary' as const;
      case 'excused': return 'outline' as const; 
      default: return 'outline' as const;
    }
  };

  const isLoading = authLoading || isLoadingData;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">View Attendance Records</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary"/>Filter Attendance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="admin-class-select">Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={isLoading || schoolClasses.length === 0}>
              <SelectTrigger id="admin-class-select">
                <SelectValue placeholder={schoolClasses.length === 0 ? "No classes available" : "Select a class..."} />
              </SelectTrigger>
              <SelectContent>
                {schoolClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="admin-attendance-date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="admin-attendance-date"
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
                  disabled={(date) => date > new Date()} 
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
            <CardTitle className="flex items-center"><Users2 className="mr-2 h-5 w-5 text-primary"/>Attendance for {schoolClasses.find(c=>c.id===selectedClassId)?.name || 'Selected Class'}</CardTitle>
            <CardDescription>Showing records for {format(attendanceDate, 'PPP')}.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-4"><Loader message="Loading attendance..." /></div> : 
              attendanceRecords.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="mx-auto h-12 w-12 mb-4"/>
                    <p>No attendance records found for this class on this date.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marked By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.studentName || 'Unknown Student'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.status)} className="capitalize text-xs px-2 py-0.5">
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.markedByName || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}
