
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarCheck, Users2, Filter, AlertTriangle } from "lucide-react";
import type { AttendanceRecord, UserProfileWithId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import Link from 'next/link';

export default function ParentChildAttendancePage() {
  const { currentUser, getAttendanceForStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (currentUser?.childStudentId && currentUser.schoolId && dateRange.from && dateRange.to) {
      setIsLoadingData(true);
      try {
        const startDate = Timestamp.fromDate(startOfDay(dateRange.from));
        const endDate = Timestamp.fromDate(endOfDay(dateRange.to));
        const records = await getAttendanceForStudent(currentUser.childStudentId, currentUser.schoolId, startDate, endDate);
        // Sort by date descending, then by class name
        records.sort((a, b) => b.date.toMillis() - a.date.toMillis() || (a.className || '').localeCompare(b.className || ''));
        setAttendanceRecords(records);
      } catch (error) {
        console.error("Error fetching child's attendance:", error);
        toast({ title: "Error", description: "Could not load attendance records.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    } else {
      setAttendanceRecords([]);
      if (!authLoading && currentUser && !currentUser.childStudentId) {
        // No need to toast here as the main page content will show a message
      }
    }
  }, [currentUser, dateRange, getAttendanceForStudent, authLoading, toast]);

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

  if (authLoading && !currentUser) {
    return <div className="flex h-full items-center justify-center"><Loader message="Loading..." size="large" /></div>;
  }

  if (!currentUser?.childStudentId) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Child Not Linked</CardTitle>
          <CardDescription>
            Please link your child's account on your profile page to view their attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="button-shadow">
                <Link href="/parent/profile">Go to Profile</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Child's Attendance Record</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary"/>Filter by Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-range-picker"
                variant={"outline"}
                className={`w-full sm:w-[300px] justify-start text-left font-normal ${!dateRange.from && "text-muted-foreground"}`}
                disabled={isLoading}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
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
            Attendance for {currentUser.displayName}'s Child
          </CardTitle>
          <CardDescription>
            Showing records for the selected date range.
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
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2 pr-2">
                  {attendanceRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{format(record.date.toDate(), 'PPP')} - {record.className || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Marked by: {record.markedByName || 'Teacher'}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(record.status)} className="capitalize">
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}

