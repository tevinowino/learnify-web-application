
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, Filter, UserX, SearchCheck, Search } from 'lucide-react';
import type { UserProfileWithId, UserRole } from '@/types';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import UserTable from './components/UserTable';
import Loader from '@/components/shared/Loader'; 
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from '@/components/ui/tooltip'; // Import TooltipProvider

export default function ManageUsersPage() {
  const { currentUser, getUsersBySchool, approveUserForSchool, updateUserRoleAndSchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [allSchoolUsers, setAllSchoolUsers] = useState<UserProfileWithId[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfileWithId[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isProcessingUser, setIsProcessingUser] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_verification' | 'rejected' | 'disabled'>('all');


  const fetchUsers = useCallback(async () => {
    if (currentUser?.schoolId) {
      setIsLoadingUsers(true);
      const schoolUsers = await getUsersBySchool(currentUser.schoolId);
      setAllSchoolUsers(schoolUsers);
      // setFilteredUsers(schoolUsers); // Filtering will be handled by useEffect
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

  useEffect(() => {
    let tempUsers = [...allSchoolUsers];
    if (searchTerm) {
      tempUsers = tempUsers.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== 'all') {
      tempUsers = tempUsers.filter(user => user.role === roleFilter);
    }
    if (statusFilter !== 'all') {
        tempUsers = tempUsers.filter(user => (user.status || 'active') === statusFilter);
    }
    setFilteredUsers(tempUsers);
  }, [searchTerm, roleFilter, statusFilter, allSchoolUsers]);


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

  if (pageLoading && !allSchoolUsers.length) {
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
  
  const activeUsers = filteredUsers.filter(user => (user.status === 'active' || !user.status) && user.status !== 'rejected');
  const pendingUsers = filteredUsers.filter(user => user.status === 'pending_verification');
  const otherUsers = filteredUsers.filter(user => user.status === 'rejected' || user.status === 'disabled'); 


  return (
    <TooltipProvider> {/* Wrap with TooltipProvider */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Users</h1>
          <Button asChild className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
            <Link href="/admin/users/add"> 
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Link>
          </Button>
        </div>

        <Card className="card-shadow">
          <CardHeader>
              <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary"/>Filter & Search Users</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                  </div>
                  <Select onValueChange={(value) => setRoleFilter(value as UserRole | 'all')} value={roleFilter}>
                      <SelectTrigger><SelectValue placeholder="Filter by Role" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'pending_verification' | 'rejected' | 'disabled')} value={statusFilter}>
                      <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending_verification">Pending Verification</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </CardHeader>
        </Card>


        <Tabs defaultValue="active_users" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 h-auto">
            <TabsTrigger value="active_users" className="py-2 sm:py-1.5">Active Users ({activeUsers.length})</TabsTrigger>
            <TabsTrigger value="pending_verification" className="py-2 sm:py-1.5">
              Pending Verification ({pendingUsers.length})
              {pendingUsers.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-2 h-2 rounded-full bg-destructive"></span>}
            </TabsTrigger>
            <TabsTrigger value="other_users" className="py-2 sm:py-1.5">Other Statuses ({otherUsers.length})</TabsTrigger>
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
                  <div className="text-center py-12">
                    <SearchCheck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold text-muted-foreground">No active users found.</p>
                    <p className="text-muted-foreground mt-1">Try adjusting your search or filters, or add new users.</p>
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
                  <div className="text-center py-12">
                    <UserX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold text-muted-foreground">No users are currently pending verification.</p>
                    <p className="text-muted-foreground mt-1">All new user requests have been processed.</p>
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
          <TabsContent value="other_users">
            <Card className="card-shadow mt-4">
              <CardHeader>
                <CardTitle>Other User Statuses</CardTitle>
                <CardDescription>Users who are rejected or disabled.</CardDescription>
              </CardHeader>
              <CardContent>
                {pageLoading && otherUsers.length === 0 ? (
                  <div className="flex justify-center py-8"><Loader /></div>
                ) : otherUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <SearchCheck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold text-muted-foreground">No users with 'rejected' or 'disabled' status.</p>
                     <p className="text-muted-foreground mt-1">Try adjusting your filters if you expected to see users here.</p>
                  </div>
                ) : (
                  <UserTable 
                    users={otherUsers} 
                    isPendingTab={false} 
                    currentUserId={currentUser?.uid} 
                    isProcessingUser={isProcessingUser}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

