
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
  const [isFetchingData, setIsFetchingData] = useState(false); // To prevent concurrent fetches

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid || !currentUser.schoolId || !currentUser.classIds || currentUser.classIds.length === 0) {
      setIsLoadingStats(false); // Ensure loading stops if conditions aren't met
      return;
    }

    setIsFetchingData(true);
    setIsLoadingStats(true); 
    try {
      const [classesDetails, schoolMaterials, activitiesFromService] = await Promise.all([
        getClassesByIds(currentUser.classIds),
        getLearningMaterialsBySchool(currentUser.schoolId),
        getActivities(currentUser.schoolId, {}, 20) // Fetch more for client-side filtering
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
      ).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
      .slice(0, 5);
      setRecentActivities(studentRelevantActivities);

      let allAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
      for (const cls of classesDetails) {
        // Ensure studentId is passed as it's required by the updated service signature
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
    const studentUid = currentUser?.uid;
    const studentSchoolId = currentUser?.schoolId;
    // Stable string representation of classIds for dependency array
    const classIdsString = JSON.stringify(currentUser?.classIds?.slice().sort());

    if (!authLoading && studentUid && studentSchoolId && currentUser?.classIds && currentUser.classIds.length > 0) {
      if (!isFetchingData) { // Guard against concurrent fetches
        fetchDashboardData();
      }
    } else if (!authLoading) { // If not loading and conditions not met (no user, or user has no classes)
      setIsLoadingStats(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Use more granular, stable parts of currentUser for dependencies
    currentUser?.uid, 
    currentUser?.schoolId,
    JSON.stringify(currentUser?.classIds?.sort()), // Stringified sorted array for stability
    authLoading, 
    // fetchDashboardData is memoized with useCallback, its dependencies are currentUser and the service functions.
    // Since service functions are memoized in AuthProvider (depending on its own currentUser),
    // this setup should be stable.
    fetchDashboardData 
    // Removed isFetchingData from dependency array
  ]);

  return {
    resourceCount,
    enrolledClasses,
    upcomingAssignments,
    recentActivities,
    isLoading: authLoading || isLoadingStats,
  };
}
