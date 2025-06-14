
import React from 'react';
import type { Subject } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookText } from 'lucide-react';

interface StudentSubjectsCardProps {
  subjects: {
    compulsory: Subject[];
    elective: Subject[];
  };
  mainClassName?: string | null;
}

export const StudentSubjectsCard: React.FC<StudentSubjectsCardProps> = ({ subjects, mainClassName }) => {
  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center"><BookText className="mr-2 h-5 w-5 text-primary" /> Enrolled Subjects</CardTitle>
        {mainClassName && <CardDescription>Main Class: {mainClassName}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Compulsory Subjects ({subjects.compulsory.length})</h4>
          {subjects.compulsory.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjects.compulsory.map(sub => (
                <Badge key={sub.id} variant="default">{sub.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No compulsory subjects assigned via main class.</p>
          )}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Elective Subjects ({subjects.elective.length})</h4>
          {subjects.elective.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjects.elective.map(sub => (
                <Badge key={sub.id} variant="secondary">{sub.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No elective subjects selected.</p>
          )}
        </div>
         {(subjects.compulsory.length === 0 && subjects.elective.length === 0) && (
            <p className="text-sm text-muted-foreground">No subjects information available.</p>
        )}
      </CardContent>
    </Card>
  );
};