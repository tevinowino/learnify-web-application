
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { LearningMaterial, AssignmentWithClassInfo, ClassWithTeacherInfo, Activity as ActivityType } from '@/types';
import { useToast } from './use-toast'; 

export function useTeacherDashboard() {
  const { 
    currentUser, 
    getLearningMaterialsByTeacher, 
    getAssignmentsByTeacher,
    getClassesByTeacher,
    getActivities,
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();

  const [materialCount, setMaterialCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [upcomingAssignments, setUpcomingAssignments] = useState<AssignmentWithClassInfo[]>([]);
  const [classCount, setClassCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (currentUser?.uid && currentUser.schoolId) {
      setIsLoadingStats(true);
      try {
        const [materials, assignments, classes, activities] = await Promise.all([
          getLearningMaterialsByTeacher(currentUser.uid),
          getAssignmentsByTeacher(currentUser.uid),
          getClassesByTeacher(currentUser.uid),
          getActivities(currentUser.schoolId, { userId: currentUser.uid }, 5)
        ]);
        setMaterialCount(materials.length);
        setAssignmentCount(assignments.length);
        setClassCount(classes.length);
        setRecentActivities(activities);

        const now = new Date();
        const upcoming = assignments
          .filter(a => a.deadline.toDate() >= now)
          .sort((a, b) => a.deadline.toDate().getTime() - b.deadline.toDate().getTime())
          .slice(0, 3); 
        setUpcomingAssignments(upcoming);

      } catch (error) {
        console.error("Error fetching teacher dashboard data:", error);
        toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
      } finally {
        setIsLoadingStats(false);
      }
    } else if (!authLoading) {
      setIsLoadingStats(false);
    }
  }, [currentUser, getLearningMaterialsByTeacher, getAssignmentsByTeacher, getClassesByTeacher, getActivities, authLoading, toast]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchDashboardData();
    }
  }, [currentUser, authLoading, fetchDashboardData]);

  return {
    materialCount,
    assignmentCount,
    classCount,
    upcomingAssignments,
    recentActivities,
    isLoading: authLoading || isLoadingStats,
  };
}
