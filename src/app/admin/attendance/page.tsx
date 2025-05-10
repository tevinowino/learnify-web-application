"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2 } from "lucide-react";

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance Records</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users2 className="mr-2 h-5 w-5 text-primary" />
            School-Wide Attendance
          </CardTitle>
          <CardDescription>
            View and manage attendance records for all classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <Users2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Attendance Tracking Dashboard</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
