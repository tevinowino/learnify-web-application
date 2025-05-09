
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Settings, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; 
import React, { useEffect, useState } from "react";
import type { UserProfileWithId } from "@/types";

export default function AdminDashboardPage() {
  const { currentUser, getUsersBySchool, loading: authLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.schoolId) {
        setIsLoadingStats(true);
        const users = await getUsersBySchool(currentUser.schoolId);
        setTotalUsers(users.length);
        setTeacherCount(users.filter(user => user.role === 'teacher').length);
        setIsLoadingStats(false);
      } else if(!authLoading) {
        setIsLoadingStats(false);
      }
    };
    if(currentUser) {
        fetchStats();
    }
  }, [currentUser, getUsersBySchool, authLoading]);

  const isLoading = authLoading || isLoadingStats;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {currentUser?.displayName || "Admin"}! Manage your school efficiently.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow">
          <Link href="/admin/users/new"> {/* Updated Link */}
            <PlusCircle className="mr-2 h-4 w-4"/> Add New User
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
            {/* <p className="text-xs text-muted-foreground">+10 from last month</p> */}
            <Button variant="link" asChild className="px-0 pt-2">
              <Link href="/admin/users">View Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{teacherCount}</div>}
            {/* <p className="text-xs text-muted-foreground">Active in platform</p> */}
             <Button variant="link" asChild className="px-0 pt-2">
              <Link href="/admin/users?role=teacher">Manage Teachers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Settings</CardTitle>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Configure school details, invite codes, and more.</p>
            <Button variant="outline" asChild className="w-full button-shadow">
              <Link href="/admin/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">More features coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}

