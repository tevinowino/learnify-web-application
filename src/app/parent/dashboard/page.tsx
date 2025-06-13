
"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { useParentDashboard } from '@/hooks/useParentDashboard'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, BookOpen, BarChart2, Bell, LinkIcon, UserCircle, CalendarCheck } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader'; 
import { formatDistanceToNow } from 'date-fns';

export default function ParentDashboardPage() {
  const { currentUser } = useAuth();
  const { 
    childProfile,
    upcomingAssignmentsCount,
    recentGradesCount,
    attendanceIssuesCount, 
    recentActivities,
    isLoading 
  } = useParentDashboard();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading dashboard..." size="large" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Parent Dashboard</h1>
      {childProfile && (
        <p className="text-muted-foreground">
          Viewing information for: <span className="font-semibold text-foreground">{childProfile.displayName}</span>
        </p>
      )}
      
      {!currentUser?.childStudentId && !isLoading && (
        <Card className="card-shadow mt-6">
          <CardHeader className="items-center text-center">
            <UserCircle className="h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-xl">Link Your Child's Account</CardTitle>
            <CardDescription>
              To view your child's academic progress, assignments, and attendance, please link their account using their unique Student ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="button-shadow bg-primary hover:bg-primary/90">
              <Link href="/parent/link-child">
                <LinkIcon className="mr-2 h-4 w-4"/> Link Child Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {currentUser?.childStudentId && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="card-shadow hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAssignmentsCount}</div> 
                <Button variant="link" asChild className="px-0 pt-2 text-sm">
                  <Link href="/parent/assignments">View All Assignments</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-shadow hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Exam Results</CardTitle>
                <BarChart2 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentGradesCount}</div> 
                <Button variant="link" asChild className="px-0 pt-2 text-sm">
                  <Link href="/parent/results">View All Results</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-shadow hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance (Last 7 Days)</CardTitle>
                <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceIssuesCount > 0 ? `${attendanceIssuesCount} issue(s)` : 'All Good!'}</div> 
                <Button variant="link" asChild className="px-0 pt-2 text-sm">
                  <Link href="/parent/attendance">View Attendance Details</Link>
                </Button>
                 {attendanceIssuesCount > 0 && <p className="text-xs text-destructive mt-1">Check for absences or lates.</p>}
              </CardContent>
            </Card>
          </div>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>Recent Activity for {childProfile?.displayName || 'Your Child'}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity to show for your child.</p>
              ) : (
                <ul className="max-h-60 overflow-y-auto space-y-2">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="p-3 border rounded-md text-sm hover:bg-muted/30">
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                      {activity.actorName && ` by ${activity.actorName}`}
                    </p>
                    {activity.link && <Link href={activity.link} className="text-xs text-primary hover:underline">View Details</Link>}
                  </li>
                ))}
              </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
    

