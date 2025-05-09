
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Settings, PlusCircle, Loader2, BookCopy, Activity } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; 
import React, { useEffect, useState, useCallback } from "react";
import type { UserProfileWithId, ClassWithTeacherInfo } from "@/types";

export default function AdminDashboardPage() {
  const { currentUser, getUsersBySchool, getClassesBySchool, loading: authLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  const fetchDashboardData = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingStats(true);
      const [users, classes] = await Promise.all([
        getUsersBySchool(currentUser.schoolId),
        getClassesBySchool(currentUser.schoolId)
      ]);
      
      setTotalUsers(users.length);
      setTeacherCount(users.filter(user => user.role === 'teacher').length);
      setStudentCount(users.filter(user => user.role === 'student').length);
      setClassCount(classes.length);
      setIsLoadingStats(false);
    } else if(!authLoading) {
      setIsLoadingStats(false);
    }
  }, [currentUser, getUsersBySchool, getClassesBySchool, authLoading]);

  useEffect(() => {
    if(currentUser) {
        fetchDashboardData();
    }
  }, [currentUser, fetchDashboardData]);

  const isLoading = authLoading || isLoadingStats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {currentUser?.displayName || "Admin"}! Manage your school efficiently.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
          <Link href="/admin/users/add">
            <PlusCircle className="mr-2 h-4 w-4"/> Add New User
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/users">View All Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" /> {/* Assuming BookOpen for teachers */}
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{teacherCount}</div>}
             <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/users?role=teacher">Manage Teachers</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" /> {/* Users icon for students */}
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{studentCount}</div>}
             <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/users?role=student">Manage Students</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookCopy className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{classCount}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/classes">Manage Classes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>School Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Manage school name, invite codes, and other settings.</p>
            <Button variant="outline" asChild className="w-full button-shadow">
              <Link href="/admin/settings">Go to School Settings</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-10 w-10 mb-2"/>
              <p>Recent activity feed coming soon.</p>
              <p className="text-xs">This will show latest user registrations, material uploads, etc.</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
