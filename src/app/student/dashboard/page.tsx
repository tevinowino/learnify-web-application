
"use client"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { BookOpen, ListChecks, Activity as ActivityIcon } from "lucide-react"; 
import Link from "next/link";
import { format, formatDistanceToNow } from 'date-fns'; 
import Loader from "@/components/shared/Loader"; // Import new Loader
import { useRouter } from "next/navigation"; // Import useRouter

const StudentDashboardPage = () => {
  const { currentUser, loading: authLoading } = useAuth(); // Use authLoading for initial auth check
  const { enrolledClasses, resourceCount, upcomingAssignments, recentActivities, isLoading: dashboardLoading } = useStudentDashboard();
  const router = useRouter(); // Initialize useRouter

  const isLoading = authLoading || dashboardLoading; // Combine loading states

  if (isLoading && (!currentUser || currentUser.status !== 'active')) { // Show main loader if auth or initial dashboard data is loading
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader message="Loading your dashboard..." size="large" />
      </div>
    );
  }

  if (currentUser && currentUser.status === 'pending_verification') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="w-full max-w-md shadow-xl text-center card-shadow">
          <CardHeader>
            <CardTitle>Account Pending Verification</CardTitle>
            <CardDescription>
              Your account is awaiting approval from a school administrator. Please check back later.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <Button asChild className="button-shadow" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser && (!currentUser.classIds || currentUser.classIds.length === 0) && currentUser.status === 'active') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="w-full max-w-md shadow-xl text-center card-shadow">
          <CardHeader>
            <CardTitle>Complete Your Onboarding</CardTitle>
            <CardDescription>
              Please select your class and subjects to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="button-shadow">
              <Link href="/student/onboarding">Go to Onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {currentUser?.displayName || "Student"}!</h1>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{enrolledClasses.length}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/student/classes">View My Classes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Resources</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{resourceCount}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/student/resources">Browse Resources</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Loader size="small" /> : <div className="text-2xl font-bold">{upcomingAssignments.length}</div>}
            <Button variant="link" asChild className="px-0 pt-2 text-sm">
              <Link href="/student/assignments">View Assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader /> : 
              upcomingAssignments.length > 0 ? (
              <ul className="space-y-3 max-h-60 overflow-y-auto">
                {upcomingAssignments.map(assignment => (
                  <li key={assignment.id} className="p-3 border rounded-md hover:bg-muted/30">
                    <Link href={`/student/assignments/${assignment.id}`} className="hover:underline">
                      <h4 className="font-semibold text-sm">{assignment.title}</h4>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      For: {assignment.className || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDistanceToNow(assignment.deadline.toDate(), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming assignments. Great job!</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><ActivityIcon className="mr-2 h-5 w-5 text-primary"/>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
           {isLoading ? <Loader /> : 
            recentActivities.length > 0 ? (
              <ul className="space-y-3 max-h-60 overflow-y-auto">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="p-3 border rounded-md hover:bg-muted/30 text-sm">
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                    </p>
                    {activity.link && <Link href={activity.link} className="text-xs text-primary hover:underline">View Details</Link>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity to show.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboardPage;

