
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserProfileWithId, ClassWithTeacherInfo, Activity as ActivityType } from '@/types';

export function useAdminDashboard() {
  const { currentUser, getUsersBySchool, getClassesBySchool, getActivities, loading: authLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingStats(true);
      try {
        const [users, classes, activities] = await Promise.all([
          getUsersBySchool(currentUser.schoolId),
          getClassesBySchool(currentUser.schoolId),
          getActivities(currentUser.schoolId, {}, 5)
        ]);
        
        setTotalUsers(users.length);
        setTeacherCount(users.filter(user => user.role === 'teacher').length);
        setStudentCount(users.filter(user => user.role === 'student').length);
        setClassCount(classes.length);
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoadingStats(false);
      }
    } else if (!authLoading) {
      setIsLoadingStats(false);
    }
  }, [currentUser, getUsersBySchool, getClassesBySchool, getActivities, authLoading]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchDashboardData();
    }
  }, [currentUser, authLoading, fetchDashboardData]);

  return {
    totalUsers,
    teacherCount,
    studentCount,
    classCount,
    recentActivities,
    isLoading: authLoading || isLoadingStats,
  };
}
