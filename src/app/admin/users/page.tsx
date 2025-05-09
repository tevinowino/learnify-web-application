
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Users, Edit, ShieldCheck, Briefcase, GraduationCap } from 'lucide-react';
import type { UserProfileWithId } from '@/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ManageUsersPage() {
  const { currentUser, getUsersBySchool, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfileWithId[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser?.schoolId) {
        setIsLoadingUsers(true);
        const schoolUsers = await getUsersBySchool(currentUser.schoolId);
        setUsers(schoolUsers);
        setIsLoadingUsers(false);
      } else if (!authLoading) {
        setIsLoadingUsers(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, getUsersBySchool, authLoading]);

  const pageLoading = authLoading || isLoadingUsers;

  if (pageLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser?.schoolId) {
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

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>School Users ({users.length})</CardTitle>
          <CardDescription>List of all users in your school. Admins can edit user roles and profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No users found in your school yet.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/users/add">Add First User</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
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
                      <TableCell className="text-right">
                        {currentUser.uid !== user.id && user.role !== 'admin' && ( // Prevent admin from editing self or other admins directly here for simplicity
                           <Button variant="outline" size="sm" asChild className="button-shadow">
                             <Link href={`/admin/users/${user.id}/edit`}>
                               <Edit className="mr-1 h-3 w-3"/> Edit
                             </Link>
                           </Button>
                        )}
                        {(currentUser.uid === user.id || user.role === 'admin') && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
