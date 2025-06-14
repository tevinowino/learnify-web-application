
import React from 'react';
import type { UserProfileWithId } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentProfileHeaderProps {
  student: UserProfileWithId | null;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({ student }) => {
  if (!student) return null;

  return (
    <Card className="card-shadow w-full">
      <CardHeader className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4 p-4 sm:p-6">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-4xl">
          <AvatarImage src={student.photoURL || undefined} alt={student.displayName || 'Student'} />
          <AvatarFallback>
            {student.displayName ? student.displayName.charAt(0).toUpperCase() : <UserCircle className="h-12 w-12"/>}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow mt-2 sm:mt-0">
          <CardTitle className="text-2xl sm:text-3xl">{student.displayName}</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1">
            Email: {student.email} <br />
            School: {student.schoolName || 'N/A'} <br />
            Role: <Badge variant="outline" className="capitalize text-xs">{student.role}</Badge>
             {student.status && student.status !== 'active' && (
                <Badge variant="destructive" className="capitalize text-xs ml-2">{student.status.replace('_', ' ')}</Badge>
            )}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};
```