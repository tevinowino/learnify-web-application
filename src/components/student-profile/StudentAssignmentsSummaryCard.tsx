
import React from 'react';
import type { AssignmentWithClassAndSubmissionInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ListChecks, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface StudentAssignmentSummaryCardProps {
  assignments: AssignmentWithClassAndSubmissionInfo[];
}

const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late') => {
  switch (status) {
    case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs"><CheckSquare className="mr-1 h-3 w-3" />Graded</Badge>;
    case 'submitted': return <Badge variant="secondary" className="text-xs"><Clock className="mr-1 h-3 w-3" />Submitted</Badge>;
    case 'late': return <Badge variant="destructive" className="text-xs"><AlertTriangle className="mr-1 h-3 w-3" />Late</Badge>;
    case 'missing': default: return <Badge variant="outline" className="text-xs">Missing</Badge>;
  }
};

export const StudentAssignmentSummaryCard: React.FC<StudentAssignmentSummaryCardProps> = ({ assignments }) => {
  const sortedAssignments = [...assignments].sort((a, b) => b.deadline.toMillis() - a.deadline.toMillis());

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Assignments Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAssignments.length === 0 ? (
          <p className="text-muted-foreground">No assignments found.</p>
        ) : (
          <ScrollArea className="h-[300px] lg:h-[400px]">
            <div className="space-y-3 pr-2">
              {sortedAssignments.map(assignment => (
                <Link href={`/student/assignments/${assignment.id}`} key={assignment.id} className="block hover:bg-muted/30 rounded-md transition-colors">
                  <Card className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">{assignment.title}</h4>
                        <p className="text-xs text-muted-foreground">Class: {assignment.className || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(assignment.deadline.toDate(), 'PP')}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(assignment.submissionStatus)}
                        {assignment.submissionGrade && (
                            <p className="text-xs text-muted-foreground mt-0.5">Grade: {assignment.submissionGrade}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};