"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react"; // Using Trophy as an icon for results

export default function ParentChildResultsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Child's Exam Results</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-primary" />
            Exam Performance for [Child's Name]
          </CardTitle>
          <CardDescription>
            Review your child's exam results and teacher remarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Exam Results Overview</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Your child's exam results will be displayed here once published.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
