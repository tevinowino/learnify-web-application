
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity as ActivityIcon } from 'lucide-react';
import type { Activity } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudentActivityPage() {
  const { currentUser, getActivities, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (currentUser?.schoolId && currentUser.classIds) {
      setIsLoadingActivities(true);
      // Fetch school-wide activities first, then filter
      const schoolActivities = await getActivities(currentUser.schoolId, {}, 50); 
      
      const studentRelevantActivities = schoolActivities.filter(act => 
        (act.classId && currentUser.classIds?.includes(act.classId)) || // Activity related to one of their classes
        (!act.classId && !act.actorId) || // General school-wide announcements not tied to a specific class or actor
        (act.actorId === currentUser.uid) // Their own actions
      );
      setActivities(studentRelevantActivities);
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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser?.schoolId && !authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Enrolled</CardTitle>
          <CardDescription>
            Please complete your onboarding or ensure you are enrolled in a class.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">My Activity Feed</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><ActivityIcon className="mr-2 h-5 w-5 text-primary" />Class & School Updates</CardTitle>
          <CardDescription>Recent announcements and activities relevant to you.</CardDescription>
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
                    </p>
                     <Badge variant="outline" className="mt-1 text-xs">{activity.type.replace(/_/g, ' ').toUpperCase()}</Badge>
                  </li>
                ))}
                {pageLoading && activities.length > 0 && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
