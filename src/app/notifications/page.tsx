"use client";

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BellRing, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

const NotificationItemDisplay = ({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: (id: string) => void }) => (
  <div
    className={cn(
      "flex flex-col gap-1 p-3 border rounded-md transition-colors",
      !notification.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
    )}
  >
    <div className="flex justify-between items-start">
      <p className="text-sm font-medium leading-snug break-words pr-2">
        {notification.message}
      </p>
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto text-xs text-primary hover:text-primary/80 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation(); // Prevent link navigation if item is a link
            onMarkAsRead(notification.id);
          }}
          title="Mark as read"
        >
          <CheckCheck className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
    <div className="flex justify-between items-center">
      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
        {notification.actorName && ` by ${notification.actorName}`}
      </p>
      {notification.link && (
        <Button variant="link" asChild size="sm" className="p-0 h-auto text-xs">
          <Link href={notification.link}>View Details</Link>
        </Button>
      )}
    </div>
  </div>
);


export default function AllNotificationsPage() {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto card-shadow">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <BellRing className="mr-2 h-6 w-6 text-primary" />
              All Notifications
            </CardTitle>
            <CardDescription>View all your past and current notifications.</CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" /> Mark All As Read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">You have no notifications.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-3 pr-3">
                {notifications.map((notification) => (
                  <NotificationItemDisplay key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}