"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function StudentResultsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Exam Results</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Your Performance Overview
          </CardTitle>
          <CardDescription>
            View your results and teacher remarks for completed exam periods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Exam Results Display</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Once exams are graded and published, your results will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
