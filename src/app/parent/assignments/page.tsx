"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function ParentChildAssignmentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Child's Assignments</h1>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-primary" />
            Assignment Overview for [Child's Name]
          </CardTitle>
          <CardDescription>
            Keep track of your child's upcoming and submitted assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <ListChecks className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Assignment Details</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Details of your child's assignments will be shown here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
