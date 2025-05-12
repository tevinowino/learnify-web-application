
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types';
import { useAuth } from './useAuth'; 
import {
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
} from '@/services/notificationService'; // Assuming services are in a dedicated file

export function useNotifications() {
  const { currentUser } = useAuth(); 
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userNotifications = await getNotificationsService(currentUser.uid, 50); // Fetch more for "View All"
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        // Potentially set an error state or show a toast
    } finally {
        setIsLoading(false);
    }
  }, [currentUser]); 

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await markNotificationAsReadService(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
      });
    }
  }, [notifications]);
  
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;
    const success = await markAllNotificationsAsReadService(currentUser.uid);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }, [currentUser]);


  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  };
}
