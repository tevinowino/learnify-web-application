
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Users, Edit, ShieldCheck, Briefcase, GraduationCap, UserCheck, UserX } from 'lucide-react';
import type { UserProfileWithId, UserStatus } from '@/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

export default function ManageUsersPage() {
  const { currentUser, getUsersBySchool, approveUserForSchool, updateUserRoleAndSchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfileWithId[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isProcessingUser, setIsProcessingUser] = useState<string | null>(null); // userId of user being processed

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
      fetchUsers(); // Refresh list
    } else {
      toast({ title: "Approval Failed", description: "Could not approve the user.", variant: "destructive" });
    }
    setIsProcessingUser(null);
  };
  
  const handleRejectUser = async (userId: string) => {
    // For now, "reject" means disabling them or marking as rejected. Full deletion is more complex.
    if(!confirm("Are you sure you want to reject this user's request? They will not be able to access your school.")) return;
    setIsProcessingUser(userId);
    // This assumes updateUserRoleAndSchool can also update status.
    // A more specific rejectUser function might be better.
    const success = await updateUserRoleAndSchool(userId, { status: 'rejected' }); 
    if (success) {
      toast({ title: "User Rejected", description: "User's request has been rejected." });
      fetchUsers(); // Refresh list
    } else {
      toast({ title: "Rejection Failed", description: "Could not reject the user.", variant: "destructive" });
    }
    setIsProcessingUser(null);
  };


  const pageLoading = authLoading || isLoadingUsers;

  if (pageLoading && !users.length) { // Show loader if page is loading and no users are fetched yet
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser?.schoolId && !authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No School Assigned</CardTitle>
          <CardDescription>
            You are not assigned to any school. Please complete onboarding or contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="h-4 w-4 mr-1 inline-block" />;
      case 'teacher': return <Briefcase className="h-4 w-4 mr-1 inline-block" />;
      case 'student': return <GraduationCap className="h-4 w-4 mr-1 inline-block" />;
      default: return null;
    }
  };
  
  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'teacher': return 'secondary' as const;
      case 'student': return 'default' as const;
      default: return 'outline' as const;
    }
  };

  const getStatusBadgeVariant = (status?: UserStatus) => {
    switch (status) {
      case 'active': return 'default' as const; // e.g. green or primary
      case 'pending_verification': return 'secondary' as const; // e.g. yellow or amber
      case 'rejected':
      case 'disabled': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };
  
  const activeUsers = users.filter(user => user.status === 'active' || !user.status); // Treat no status as active
  const pendingUsers = users.filter(user => user.status === 'pending_verification');


  const renderUserTable = (userList: UserProfileWithId[], isPendingTab: boolean) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {!isPendingTab && <TableHead>Status</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'}/>
                    <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {user.displayName || 'N/A'}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                  {getRoleIcon(user.role)}
                  {user.role || 'N/A'}
                </Badge>
              </TableCell>
              {!isPendingTab && (
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                    {user.status || 'Active'}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="text-right space-x-2">
                {isPendingTab ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleApproveUser(user.id, currentUser!.schoolId!)} 
                      disabled={isProcessingUser === user.id}
                      className="button-shadow text-green-600 border-green-600 hover:bg-green-50"
                    >
                      {isProcessingUser === user.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <UserCheck className="mr-1 h-3 w-3"/>} Approve
                    </Button>
                     <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRejectUser(user.id)}
                      disabled={isProcessingUser === user.id}
                      className="button-shadow"
                    >
                       {isProcessingUser === user.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <UserX className="mr-1 h-3 w-3"/>} Reject
                    </Button>
                  </>
                ) : (
                  currentUser?.uid !== user.id && user.role !== 'admin' && user.status === 'active' && (
                   <Button variant="outline" size="sm" asChild className="button-shadow">
                     <Link href={`/admin/users/${user.id}/edit`}>
                       <Edit className="mr-1 h-3 w-3"/> Edit
                     </Link>
                   </Button>
                  )
                )}
                {/* Simplified: Admins generally don't edit themselves or other admins from this list directly */}
                {(!isPendingTab && (currentUser?.uid === user.id || user.role === 'admin')) && user.status === 'active' && (
                    <Button variant="outline" size="sm" disabled className="opacity-50">
                        <Edit className="mr-1 h-3 w-3"/> Edit
                    </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 button-shadow">
          <Link href="/admin/users/add"> 
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active_users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active_users">Active Users ({activeUsers.length})</TabsTrigger>
          <TabsTrigger value="pending_verification">
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
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : activeUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No active users found in your school yet.</p>
                </div>
              ) : (
                renderUserTable(activeUsers, false)
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
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No users are currently pending verification.</p>
                </div>
              ) : (
                renderUserTable(pendingUsers, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

