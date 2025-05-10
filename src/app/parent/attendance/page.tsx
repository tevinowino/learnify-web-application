"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react"; // Using CalendarCheck as an icon

export default function ParentChildAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Child's Attendance</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarCheck className="mr-2 h-5 w-5 text-primary" />
            Attendance Record for [Child's Name]
          </CardTitle>
          <CardDescription>
            View your child's attendance for their classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <CalendarCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Attendance Details</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Your child's attendance records will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
