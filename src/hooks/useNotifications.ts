
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types';
import { Timestamp } from 'firebase/firestore';
// import { useAuth } from './useAuth'; // Will be needed for fetching real notifications

// Mock data for now
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'mockUser',
    message: 'New assignment "Chapter 1 Quiz" has been posted for Mathematics.',
    link: '/student/assignments/assign123',
    isRead: false,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000 * 2)), // 2 hours ago
    type: 'assignment_created',
    actorName: 'Mr. Smith',
  },
  {
    id: '2',
    userId: 'mockUser',
    message: 'Your submission for "Essay on Ancient Rome" has been graded.',
    link: '/student/assignments/assign456',
    isRead: false,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000 * 5)), // 5 hours ago
    type: 'submission_graded',
    actorName: 'Ms. Jones',
  },
  {
    id: '3',
    userId: 'mockUser',
    message: 'School assembly tomorrow at 9 AM in the main hall.',
    isRead: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000 * 24)), // 1 day ago
    type: 'general_announcement',
    actorName: 'School Admin',
  },
  {
    id: '4',
    userId: 'mockUser',
    message: 'Teacher uploaded new material "Lecture Slides - Week 5" for Physics.',
    link: '/student/resources',
    isRead: false,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000 * 1)), // 1 hour ago
    type: 'material_uploaded',
    actorName: 'Dr. Banner',
  },
];

export function useNotifications() {
  // const { currentUser } = useAuth(); // Needed for real data fetching
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    // if (!currentUser) {
    //   setNotifications([]);
    //   setUnreadCount(0);
    //   setIsLoading(false);
    //   return;
    // }
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    // In a real app, you would fetch notifications for currentUser.uid
    // const userNotifications = await getNotificationsService(currentUser.uid); 
    // setNotifications(userNotifications);
    // setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    setIsLoading(false);
  }, [/* currentUser */]); // Add currentUser when using real data

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // In a real app: await markNotificationAsReadService(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    // In a real app: await markAllNotificationsAsReadService(currentUser.uid);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);


  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications, // Expose to allow manual refresh
  };
}

