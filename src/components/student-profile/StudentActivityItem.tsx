
import React from 'react';
import type { Activity } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentActivityItemProps {
  activity: Activity;
}

export const StudentActivityItem: React.FC<StudentActivityItemProps> = ({ activity }) => {
  return (
    <li className="p-3 border rounded-md hover:bg-muted/50 transition-colors text-sm">
      <div className="flex justify-between items-start">
        <p className="font-medium flex-grow break-words">{activity.message}</p>
        {activity.link && (
          <Button variant="link" asChild size="sm" className="ml-2 flex-shrink-0 px-1 py-0 h-auto text-xs">
            <Link href={activity.link}>View Details</Link>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
      </p>
      <Badge variant="outline" className="mt-1 text-xs">
        {activity.type.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    </li>
  );
};
