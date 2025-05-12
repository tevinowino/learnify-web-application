
import React from 'react';
import type { ClassWithTeacherInfo } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface StudentClassCardProps {
  classInfo: ClassWithTeacherInfo;
}

export const StudentClassCard: React.FC<StudentClassCardProps> = ({ classInfo }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary flex-shrink-0" />
          <div>
            <CardTitle className="text-base font-semibold">{classInfo.name}</CardTitle>
            <CardDescription className="text-xs">
              Teacher: {classInfo.teacherDisplayName || 'N/A'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
