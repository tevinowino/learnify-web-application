
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { AssignmentWithClassAndSubmissionInfo, LearningMaterial, ClassWithTeacherInfo, Activity as ActivityType } from '@/types';
import { useToast } from './use-toast';

export function useStudentDashboard() {
  const { 
    currentUser, 
    getLearningMaterialsBySchool, 
    getAssignmentsForStudentByClass, 
    getClassesByIds, 
    getActivities, 
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();

  const [resourceCount, setResourceCount] = useState(0);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);


  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid || !currentUser.schoolId || !currentUser.classIds || currentUser.classIds.length === 0) {
      setIsLoadingStats(false);
      return;
    }

    setIsLoadingStats(true);
    setIsFetchingData(true);
    try {
      const [classesDetails, schoolMaterials, activitiesFromService] = await Promise.all([
        getClassesByIds(currentUser.classIds),
        getLearningMaterialsBySchool(currentUser.schoolId),
        getActivities(currentUser.schoolId, {}, 20) // Fetch more initially, then filter client-side
      ]);
      setEnrolledClasses(classesDetails);
      
      const studentClassIdsSet = new Set(currentUser.classIds);
      const relevantMaterials = schoolMaterials.filter(material => 
        !material.classId || studentClassIdsSet.has(material.classId)
      );
      setResourceCount(relevantMaterials.length); 
      
      const studentRelevantActivities = activitiesFromService.filter(act => 
        (act.classId && currentUser.classIds?.includes(act.classId)) || 
        (!act.classId && !act.actorId) || // General school-wide announcements not tied to a specific class or actor
        (act.actorId === currentUser.uid) // Their own actions
      ).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()) // Sort by timestamp descending
      .slice(0,5); // Take top 5 after sorting
      setRecentActivities(studentRelevantActivities);


      let allAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
      for (const cls of classesDetails) {
        const classAssignments = await getAssignmentsForStudentByClass(cls.id, currentUser.uid);
        allAssignments = [...allAssignments, ...classAssignments];
      }
      
      const now = new Date();
      const upcoming = allAssignments
        .filter(a => a.deadline.toDate() >= now && a.submissionStatus !== 'graded' && a.submissionStatus !== 'submitted') 
        .sort((a, b) => a.deadline.toDate().getTime() - b.deadline.toDate().getTime())
        .slice(0, 3);
      setUpcomingAssignments(upcoming);

    } catch (error) {
      console.error("Failed to fetch student dashboard data", error);
      toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
      setIsLoadingStats(false);
      setIsFetchingData(false);
    }
  }, [currentUser, getClassesByIds, getLearningMaterialsBySchool, getAssignmentsForStudentByClass, getActivities, toast]);

  useEffect(() => {
    if (!authLoading && currentUser && !isFetchingData) {
      if (currentUser.classIds && currentUser.classIds.length > 0) {
        fetchDashboardData();
      } else {
        setIsLoadingStats(false);
      }
    } else if (!authLoading && !currentUser) {
        setIsLoadingStats(false);
    }
  }, [currentUser, authLoading, fetchDashboardData, isFetchingData]);

  return {
    resourceCount,
    enrolledClasses,
    upcomingAssignments,
    recentActivities,
    isLoading: authLoading || isLoadingStats,
  };
}
