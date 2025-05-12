
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity as ActivityIcon } from 'lucide-react';
import type { Activity } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function TeacherActivityPage() {
  const { currentUser, getActivities, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingActivities(true);
      const schoolActivities = await getActivities(currentUser.schoolId, { }, 50); 
      
      const teacherRelevantActivities = schoolActivities.filter(act => 
        act.actorId === currentUser.uid || 
        (act.classId && currentUser.classIds?.includes(act.classId)) ||
        !act.classId 
      );

      setActivities(teacherRelevantActivities);
      setIsLoadingActivities(false);
    } else if (!authLoading) {
      setIsLoadingActivities(false);
    }
  }, [currentUser, getActivities, authLoading]);

  useEffect(() => {
    if (currentUser) {
      fetchActivities();
    }
  }, [currentUser, fetchActivities]);

  const pageLoading = authLoading || isLoadingActivities;

  if (pageLoading && activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading activity feed..." size="large" />
      </div>
    );
  }

  if (!currentUser?.schoolId && !authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No School Assigned</CardTitle>
          <CardDescription>
            You are not assigned to any school. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Activity Feed</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><ActivityIcon className="mr-2 h-5 w-5 text-primary" />Recent School & Class Activities</CardTitle>
          <CardDescription>Updates relevant to your classes and actions.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 && !pageLoading ? (
            <div className="text-center py-12">
              <ActivityIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No relevant activities found.</p>
            </div>
          ) : (
            <ScrollArea className="h-[70vh]">
              <ul className="space-y-3 pr-4">
                {activities.map(activity => (
                  <li key={activity.id} className="p-4 border rounded-md hover:bg-muted/50 transition-colors">
                     <div className="flex justify-between items-start">
                      <p className="font-medium text-sm flex-grow break-words">{activity.message}</p>
                      {activity.link && (
                        <Button variant="link" asChild size="sm" className="ml-2 flex-shrink-0 px-1 py-0 h-auto text-xs">
                          <Link href={activity.link}>View</Link>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                      {activity.actorName && ` by ${activity.actorName}`}
                    </p>
                     <Badge variant="outline" className="mt-1 text-xs">{activity.type.replace(/_/g, ' ').toUpperCase()}</Badge>
                  </li>
                ))}
                {pageLoading && activities.length > 0 && <div className="flex justify-center py-4"><Loader size="small" /></div>}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
