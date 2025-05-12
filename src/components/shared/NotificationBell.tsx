
"use client";

import React from 'react';
import { Bell, CheckCheck, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  // DropdownMenuFooter, // Removed erroneous import
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications'; // Using the new hook
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && unreadCount > 0 && (
             <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={(e) => {e.stopPropagation(); markAllAsRead();}}>
                Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled className="flex justify-center p-4">
            Loading notifications...
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-center text-muted-foreground p-4">
             <MailWarning className="mx-auto h-8 w-8 mb-2"/>
            No new notifications.
          </DropdownMenuItem>
        ) : (
          <ScrollArea className="max-h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-2.5 cursor-pointer hover:bg-muted/50",
                  !notification.isRead && "bg-primary/5 hover:bg-primary/10"
                )}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                  // If link exists, router.push(notification.link) can be done here or handled by Link component
                }}
                // Use asChild only if the direct child is a Link or similar that should inherit styling/behavior
                // For complex content, manage click handlers and navigation separately or wrap the entire content in Link if appropriate
              >
                {notification.link ? (
                  <Link href={notification.link} className="w-full no-underline text-current hover:no-underline">
                    <NotificationContent notification={notification} />
                  </Link>
                ) : (
                  <NotificationContent notification={notification} />
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        {notifications.length > 0 && (
            <>
             <DropdownMenuSeparator />
             <div className="p-1">
                <Button variant="ghost" size="sm" className="w-full text-xs h-auto py-1.5 justify-center" asChild>
                    <Link href="/notifications">View all notifications</Link>
                </Button>
             </div>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


const NotificationContent = ({ notification }: { notification: import('@/types').Notification }) => (
  <>
    <p className="text-sm font-medium leading-snug break-words">
      {notification.message}
    </p>
    <p className="text-xs text-muted-foreground">
      {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
      {notification.actorName && ` by ${notification.actorName}`}
    </p>
  </>
);

