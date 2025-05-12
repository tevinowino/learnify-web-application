
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users } from 'lucide-react';
import type { UserProfileWithId } from '@/types';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import UserTable from './components/UserTable';
import Loader from '@/components/shared/Loader'; // Import new Loader

export default function ManageUsersPage() {
  const { currentUser, getUsersBySchool, approveUserForSchool, updateUserRoleAndSchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfileWithId[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isProcessingUser, setIsProcessingUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingUsers(true);
      const schoolUsers = await getUsersBySchool(currentUser.schoolId);
      setUsers(schoolUsers);
      setIsLoadingUsers(false);
    } else if (!authLoading) {
      setIsLoadingUsers(false);
    }
  }, [currentUser, getUsersBySchool, authLoading]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const handleApproveUser = async (userId: string, schoolId: string) => {
    setIsProcessingUser(userId);
    const success = await approveUserForSchool(userId, schoolId);
    if (success) {
      toast({ title: "User Approved", description: "User has been activated and can now access the platform." });
      fetchUsers(); 
    } else {
      toast({ title: "Approval Failed", description: "Could not approve the user.", variant: "destructive" });
    }
    setIsProcessingUser(null);
  };
  
  const handleRejectUser = async (userId: string) => {
    if(!confirm("Are you sure you want to reject this user's request? They will not be able to access your school.")) return;
    setIsProcessingUser(userId);
    const success = await updateUserRoleAndSchool(userId, { status: 'rejected' }); 
    if (success) {
      toast({ title: "User Rejected", description: "User's request has been rejected." });
      fetchUsers(); 
    } else {
      toast({ title: "Rejection Failed", description: "Could not reject the user.", variant: "destructive" });
    }
    setIsProcessingUser(null);
  };

  const pageLoading = authLoading || isLoadingUsers;

  if (pageLoading && !users.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading users..." size="large" />
      </div>
    );
  }

  if (!currentUser?.schoolId && !authLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>No School Assigned</CardTitle>
          <CardDescription>
            You are not assigned to any school. Please complete onboarding or contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const activeUsers = users.filter(user => user.status === 'active' || !user.status);
  const pendingUsers = users.filter(user => user.status === 'pending_verification');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Users</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
          <Link href="/admin/users/add"> 
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active_users" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto sm:h-10">
          <TabsTrigger value="active_users" className="py-2 sm:py-1.5">Active Users ({activeUsers.length})</TabsTrigger>
          <TabsTrigger value="pending_verification" className="py-2 sm:py-1.5">
            Pending Verification ({pendingUsers.length})
            {pendingUsers.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-2 h-2 rounded-full bg-destructive"></span>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active_users">
          <Card className="card-shadow mt-4">
            <CardHeader>
              <CardTitle>Active School Users</CardTitle>
              <CardDescription>List of all active users in your school. Admins can edit user roles and profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading && activeUsers.length === 0 ? (
                <div className="flex justify-center py-8"><Loader /></div>
              ) : activeUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No active users found in your school yet.</p>
                </div>
              ) : (
                <UserTable 
                  users={activeUsers} 
                  isPendingTab={false} 
                  currentUserId={currentUser?.uid} 
                  isProcessingUser={isProcessingUser}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending_verification">
          <Card className="card-shadow mt-4">
            <CardHeader>
              <CardTitle>Pending Verification</CardTitle>
              <CardDescription>Users awaiting your approval to join the school.</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading && pendingUsers.length === 0 ? (
                <div className="flex justify-center py-8"><Loader /></div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No users are currently pending verification.</p>
                </div>
              ) : (
                <UserTable 
                  users={pendingUsers} 
                  isPendingTab={true} 
                  currentUserId={currentUser?.uid} 
                  onApproveUser={handleApproveUser}
                  onRejectUser={handleRejectUser}
                  isProcessingUser={isProcessingUser}
                  currentSchoolId={currentUser?.schoolId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
