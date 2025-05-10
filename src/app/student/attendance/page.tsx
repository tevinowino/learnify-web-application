"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function StudentAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Attendance</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5 text-primary" />
            Your Attendance Record
          </CardTitle>
          <CardDescription>
            Review your attendance for your classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Attendance Overview</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Your attendance records will be displayed here once available.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
