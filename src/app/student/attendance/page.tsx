
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Users2, Filter, AlertTriangle, CalendarDays, ArrowLeft } from "lucide-react";
import type { AttendanceRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, subDays, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StudentAttendancePage() {
  const { currentUser, getAttendanceForStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30), 
    to: new Date(),
  });
  
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (currentUser?.uid && currentUser.schoolId && dateRange.from && dateRange.to && isValid(dateRange.from) && isValid(dateRange.to)) {
      setIsLoadingData(true);
      try {
        const startDate = Timestamp.fromDate(startOfDay(dateRange.from));
        const endDate = Timestamp.fromDate(endOfDay(dateRange.to));
        const records = await getAttendanceForStudent(currentUser.uid, currentUser.schoolId, startDate, endDate);
        records.sort((a, b) => b.date.toMillis() - a.date.toMillis() || (a.className || '').localeCompare(b.className || ''));
        setAttendanceRecords(records);
      } catch (error) {
        console.error("Error fetching student's attendance:", error);
        toast({ title: "Error", description: "Could not load your attendance records.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    } else {
      setAttendanceRecords([]);
      if (dateRange.from && dateRange.to && (!isValid(dateRange.from) || !isValid(dateRange.to))) {
        toast({ title: "Invalid Date Range", description: "Please select valid start and end dates.", variant: "destructive" });
      }
      setIsLoadingData(false);
    }
  }, [currentUser, dateRange, getAttendanceForStudent, toast]);

  useEffect(() => {
    if (!authLoading && currentUser?.uid && currentUser.schoolId) {
      fetchAttendance();
    }
  }, [authLoading, currentUser?.uid, currentUser?.schoolId, fetchAttendance]);

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

  if (authLoading && !currentUser) {
    return <div className="flex h-full items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/student/dashboard')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <h1 className="text-3xl font-bold">My Attendance Record</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary"/>Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="date-range-picker">Select Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-range-picker"
                variant={"outline"}
                className={`w-full sm:w-[300px] justify-start text-left font-normal mt-1 ${!dateRange.from && "text-muted-foreground"}`}
                disabled={isLoading}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange.from && isValid(dateRange.from) ? (
                  dateRange.to && isValid(dateRange.to) ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarCheck className="mr-2 h-5 w-5 text-primary" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            Showing your attendance for the selected date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-4"><Loader message="Loading attendance records..." /></div> : 
            attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users2 className="mx-auto h-12 w-12 mb-4" />
                <p>No attendance records found for the selected period.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{format(record.date.toDate(), 'PPP')}</TableCell>
                      <TableCell>{record.className || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)} className="capitalize text-xs px-2 py-0.5">
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.markedByName || 'Teacher'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
    
