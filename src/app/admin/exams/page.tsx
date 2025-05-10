"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePieChart, Settings2, PlusCircle } from "lucide-react";

export default function AdminExamsPage() {
  // const [examPeriods, setExamPeriods] = useState([]); // Type this later
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect to fetch exam periods

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <Button className="button-shadow"> <PlusCircle className="mr-2 h-4 w-4"/> Create Exam Period</Button>
      </div>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="mr-2 h-5 w-5 text-primary" />
            Exam Mode & Settings
          </CardTitle>
          <CardDescription>
            Toggle exam mode for the school and manage exam period settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Exam Mode controls and settings will be here. (Feature coming soon)</p>
          {/* TODO: Add toggle for exam mode, button to create new exam period */}
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilePieChart className="mr-2 h-5 w-5 text-primary" />
            Exam Periods & Results
          </CardTitle>
          <CardDescription>
            View existing exam periods, track result submission progress, and finalize results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <FilePieChart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Exam Period Management</p>
            <p className="text-muted-foreground">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
