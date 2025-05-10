"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, BookOpen, BarChart2, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// import type { UserProfileWithId, AssignmentWithClassAndSubmissionInfo, ExamResult } from '@/types'; // Assuming ExamResult type

export default function ParentDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  // const [childData, setChildData] = useState<UserProfileWithId | null>(null);
  // const [childAssignments, setChildAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  // const [childExamResults, setChildExamResults] = useState<ExamResult[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !currentUser.childStudentId) { // Assuming childStudentId is on parent's profile
        setIsLoadingData(false);
        return;
      }
      // TODO: Fetch child's data, assignments, results using currentUser.childStudentId
      // e.g., const child = await getStudentProfile(currentUser.childStudentId);
      // const assignments = await getAssignmentsForStudent(currentUser.childStudentId);
      // setChildData(child);
      // setChildAssignments(assignments);
      setIsLoadingData(false);
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const isLoading = authLoading || isLoadingData;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // if (!currentUser?.childStudentId) {
  //   return (
  //     <Card className="card-shadow">
  //       <CardHeader>
  //         <CardTitle>Link Your Child's Account</CardTitle>
  //         <CardDescription>
  //           Please link your child's account to view their progress and activities.
  //         </CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <Button asChild><Link href="/parent/link-child">Link Child Account</Link></Button>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Parent Dashboard</h1>
      {/* {childData && (
        <p className="text-muted-foreground">Viewing progress for: {childData.displayName}</p>
      )} */}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Feature coming soon</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Grades/Results</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Feature coming soon</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Overview</CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Feature coming soon</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>Recent Activity & Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activity feed for your child will appear here.</p>
          {/* Placeholder for activity items */}
        </CardContent>
      </Card>
    </div>
  );
}
