
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity as ActivityIcon, ListFilter } from 'lucide-react';
import type { Activity } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function AdminActivityPage() {
  const { currentUser, getActivities, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingActivities(true);
      const schoolActivities = await getActivities(currentUser.schoolId, {}, 50); // Fetch more for this page
      setActivities(schoolActivities);
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
          <CardTitle>No School Assigned</CardTitle>
          <CardDescription>
            You are not assigned to any school. Please complete onboarding or contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">School Activity Log</h1>
        {/* Add Filter Button/Dropdown here if implementing filters */}
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><ActivityIcon className="mr-2 h-5 w-5 text-primary" />Recent Activities</CardTitle>
          <CardDescription>Timeline of important events and actions within the school.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 && !pageLoading ? (
            <div className="text-center py-12">
              <ActivityIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No activities recorded yet.</p>
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
                 {pageLoading && activities.length > 0 && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
