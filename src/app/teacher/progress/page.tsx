
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function TeacherStudentProgressPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Progress</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="mr-2 h-5 w-5 text-primary" />
            Track Student Performance
          </CardTitle>
          <CardDescription>
            This section will allow you to monitor the progress of your students across various learning materials and assessments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Student Progress Tracking</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
