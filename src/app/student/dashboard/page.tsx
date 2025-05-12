import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const StudentDashboardPage = () => {
  const { currentUser } = useAuth();
  const { enrolledClasses, resourceCount, upcomingAssignments, recentActivities, isLoading } = useStudentDashboard();

  if (isLoading || currentUser === undefined) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser && (!currentUser.classIds || currentUser.classIds.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="w-full max-w-md shadow-xl text-center">
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
    <div className="dashboard-content">
      <h1>Welcome, {currentUser?.displayName}!</h1>
      <div className="dashboard-stats">
        <div>Total Resources: {resourceCount}</div>
        <div>Enrolled Classes: {enrolledClasses.length}</div>
      </div>
      <div className="upcoming-assignments">
        <h2>Upcoming Assignments</h2>
        {upcomingAssignments.length > 0 ? (
          <ul>
            {upcomingAssignments.map((assignment) => (
              <li key={assignment.id}>
                {assignment.title} - Due: {assignment.deadline.toDate().toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming assignments</p>
        )}
      </div>
      <div className="recent-activities">
        <h2>Recent Activities</h2>
        {recentActivities.length > 0 ? (
          <ul>
            {recentActivities.map((activity) => (
              <li key={activity.id}>
                {activity.type}: {activity.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent activities</p>
        )}
      </div>
      <div className="enrolled-classes">
        <h2>Your Classes</h2>
        {enrolledClasses.length > 0 ? (
          <ul>
            {enrolledClasses.map((class_) => (
              <li key={class_.id}>
                {class_.name} - {class_.teacherName}
              </li>
            ))}
          </ul>
        ) : (
          <p>No classes enrolled</p>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardPage;