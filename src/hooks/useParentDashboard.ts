
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserProfileWithId, AssignmentWithClassAndSubmissionInfo, ExamResultWithStudentInfo, Activity as ActivityType, AttendanceRecord } from '@/types';
import { useToast } from './use-toast'; 
import { Timestamp, startOfDay, subDays, endOfDay } from 'firebase/firestore'; // Import Timestamp and date functions

export function useParentDashboard() {
  const { 
    currentUser, 
    getUserProfile, 
    getAssignmentsForStudentByClass, 
    getExamResultsForStudent,
    getActivities,
    getClassesByIds, 
    getAttendanceForStudent, // Add this
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();

  const [childProfile, setChildProfile] = useState<UserProfileWithId | null>(null);
  const [upcomingAssignmentsCount, setUpcomingAssignmentsCount] = useState(0);
  const [recentGradesCount, setRecentGradesCount] = useState(0); 
  const [attendanceIssuesCount, setAttendanceIssuesCount] = useState(0); 
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.childStudentId || !currentUser.schoolId) {
      setIsLoadingData(false);
      setChildProfile(null); 
      setUpcomingAssignmentsCount(0);
      setRecentGradesCount(0);
      setAttendanceIssuesCount(0);
      setRecentActivities([]);
      return;
    }
    setIsLoadingData(true);
    try {
      const child = await getUserProfile(currentUser.childStudentId);
      setChildProfile(child);

      if (child && child.classIds && child.classIds.length > 0 && child.schoolId) {
        const childClasses = await getClassesByIds(child.classIds);
        let allChildAssignments: AssignmentWithClassAndSubmissionInfo[] = [];
        for (const cls of childClasses) {
          const classAssignments = await getAssignmentsForStudentByClass(cls.id, child.uid);
          allChildAssignments = [...allChildAssignments, ...classAssignments];
        }
        
        const now = new Date();
        const upcoming = allChildAssignments.filter(a => 
          a.deadline.toDate() >= now && 
          a.submissionStatus !== 'graded' && 
          a.submissionStatus !== 'submitted'
        );
        setUpcomingAssignmentsCount(upcoming.length);

        const results = await getExamResultsForStudent(child.uid, child.schoolId);
        setRecentGradesCount(results.filter(r => r.marks).length); 

        // Fetch attendance for the last 7 days
        const sevenDaysAgo = startOfDay(subDays(now, 7));
        const todayEnd = endOfDay(now);
        const attendance = await getAttendanceForStudent(
          child.uid, 
          child.schoolId, 
          Timestamp.fromDate(sevenDaysAgo), 
          Timestamp.fromDate(todayEnd)
        );
        const issues = attendance.filter(record => record.status === 'absent' || record.status === 'late').length;
        setAttendanceIssuesCount(issues); 

        const activities = await getActivities(child.schoolId, { targetUserId: child.uid, type: undefined }, 5); 
        setRecentActivities(activities);

      } else {
        setUpcomingAssignmentsCount(0);
        setRecentGradesCount(0);
        setAttendanceIssuesCount(0);
        setRecentActivities([]);
      }

    } catch (error) {
      console.error("Error fetching parent dashboard data:", error);
      toast({ title: "Error", description: "Could not load child's dashboard data.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, getUserProfile, getClassesByIds, getAssignmentsForStudentByClass, getExamResultsForStudent, getActivities, getAttendanceForStudent, toast]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchDashboardData();
    } else if (!authLoading && !currentUser?.childStudentId) {
        setIsLoadingData(false);
        setChildProfile(null);
    }
  }, [currentUser, authLoading, fetchDashboardData]);

  return {
    childProfile,
    upcomingAssignmentsCount,
    recentGradesCount,
    attendanceIssuesCount,
    recentActivities,
    isLoading: authLoading || isLoadingData,
  };
}

    