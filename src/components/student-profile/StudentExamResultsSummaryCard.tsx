
import React from 'react';
import type { ExamResultWithStudentInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy } from 'lucide-react';

interface StudentExamResultsSummaryCardProps {
  results: ExamResultWithStudentInfo[];
}

export const StudentExamResultsSummaryCard: React.FC<StudentExamResultsSummaryCardProps> = ({ results }) => {
  const sortedResults = [...results].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" /> Exam Results</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedResults.length === 0 ? (
          <p className="text-muted-foreground">No exam results available.</p>
        ) : (
          <ScrollArea className="h-[300px] lg:h-[400px]">
            <div className="space-y-3 pr-2">
              {sortedResults.map(result => (
                <Card key={result.id} className="p-3">
                  <h4 className="font-semibold text-sm">
                    {result.examPeriodName || 'Exam Period'} - {result.subjectName || 'Subject'}
                  </h4>
                  <p className="text-xs text-muted-foreground">Marks/Grade: <span className="font-medium text-foreground">{result.marks}</span></p>
                  {result.remarks && <p className="text-xs text-muted-foreground mt-1">Remarks: <span className="italic">{result.remarks}</span></p>}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
