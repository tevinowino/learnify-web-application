
"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { useParentDashboard } from '@/hooks/useParentDashboard'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, BookOpen, BarChart2, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function ParentDashboardPage() {
  const { currentUser } = useAuth();
  const { 
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
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div> 
            <p className="text-xs text-muted-foreground">Feature coming soon</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Grades/Results</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div> 
            <p className="text-xs text-muted-foreground">Feature coming soon</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Overview</CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div> 
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
        </CardContent>
      </Card>
       {!currentUser?.childStudentId && (
        <Card className="card-shadow mt-6">
          <CardHeader>
            <CardTitle>Link Your Child's Account</CardTitle>
            <CardDescription>
              Please link your child's account to view their progress and activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="button-shadow"><Link href="/parent/link-child">Link Child Account</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
