
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePieChart, PlusCircle, CalendarDays, Eye } from "lucide-react";
import type { ExamPeriodWithClassNames } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function AdminExamsPage() {
  const { currentUser, getExamPeriodsBySchool, getClassDetails, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [examPeriods, setExamPeriods] = useState<ExamPeriodWithClassNames[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchExamPeriods = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingPage(true);
      try {
        const periods = await getExamPeriodsBySchool(currentUser.schoolId);
        setExamPeriods(periods);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load exam periods.", variant: "destructive" });
        console.error("Error fetching exam periods:", error);
      } finally {
        setIsLoadingPage(false);
      }
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getExamPeriodsBySchool, authLoading, toast]);


  useEffect(() => {
    if (!authLoading && currentUser) {
        fetchExamPeriods();
    }
  }, [authLoading, currentUser, fetchExamPeriods]);


  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading exam periods..." size="large" />
      </div>
    );
  }
  
  if (!currentUser?.schoolId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>School Not Assigned</CardTitle>
          <CardDescription>You need to be part of a school to manage exams.</CardDescription>
        </CardHeader>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow mt-2 sm:mt-0 w-full sm:w-auto">
           <Link href="/admin/exams/create">
            <PlusCircle className="mr-2 h-4 w-4"/> Create Exam Period
           </Link>
        </Button>
      </div>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilePieChart className="mr-2 h-5 w-5 text-primary" />
            Exam Periods
          </CardTitle>
          <CardDescription>
            View and manage exam periods for your school.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {examPeriods.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <FilePieChart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Exam Periods Found</p>
              <p className="text-muted-foreground">Create an exam period to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examPeriods.map(period => (
                <Card key={period.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start">
                    <div>
                        <Link href={`/admin/exams/${period.id}`} className="hover:underline">
                           <CardTitle>{period.name}</CardTitle>
                        </Link>
                        <CardDescription>
                            Status: <Badge variant={period.status === 'completed' ? 'default' : 'secondary'} className={period.status === 'completed' ? "bg-green-500 hover:bg-green-600" : ""}>{period.status.toUpperCase()}</Badge> <br />
                            Dates: {format(period.startDate.toDate(), 'PPP')} - {format(period.endDate.toDate(), 'PPP')} <br/>
                            Classes: {period.assignedClassNames && period.assignedClassNames.length > 0 ? period.assignedClassNames.join(', ') : 'None'}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0 button-shadow">
                        <Link href={`/admin/exams/${period.id}`}>
                            <Eye className="mr-1 h-4 w-4"/> View Details
                        </Link>
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
