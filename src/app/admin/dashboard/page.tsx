
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Settings, PlusCircle, BookCopy, Activity, ListOrdered } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth'; 
import { useAdminDashboard } from '@/hooks/useAdminDashboard'; 
import React from "react";
import { formatDistanceToNow } from "date-fns";
import Loader from "@/components/shared/Loader"; // Import new Loader

export default function AdminDashboardPage() {
  const { currentUser } = useAuth(); 
  const { 
    totalUsers, 
    teacherCount, 
    studentCount, 
    classCount, 
    recentActivities, 
    isLoading 
  } = useAdminDashboard();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome, {currentUser?.displayName || "Admin"}! Manage your school efficiently.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
          <Link href="/admin/users/add">
            <PlusCircle className="mr-2 h-4 w-4"/> Add New User
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/users">View All Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{teacherCount}</div>}
             <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/users?role=teacher">Manage Teachers</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{studentCount}</div>}
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
            {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{classCount}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/admin/classes">Manage Classes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Recent Activity</CardTitle>
            <CardDescription>Latest updates and events in your school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader /></div>
            ) : recentActivities.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto space-y-2">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="p-3 border rounded-md text-sm hover:bg-muted/30">
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                      {activity.actorName && ` by ${activity.actorName}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-10 w-10 mb-2"/>
                <p>No recent activity to show.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>School Configuration</CardTitle>
            <CardDescription>Manage school name, invite codes, subjects, and other settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" asChild className="w-full button-shadow mb-2">
              <Link href="/admin/settings">General School Settings</Link>
            </Button>
            <Button variant="outline" asChild className="w-full button-shadow">
              <Link href="/admin/school-settings/subjects">Manage Subjects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

