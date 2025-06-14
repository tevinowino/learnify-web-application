
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Edit, ShieldCheck, Briefcase, GraduationCap, UserCheck, UserX, UserCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import type { UserProfileWithId, UserStatus } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

interface UserTableProps {
  users: UserProfileWithId[];
  isPendingTab: boolean;
  currentUserId?: string;
  onApproveUser?: (userId: string, schoolId: string) => Promise<void>;
  onRejectUser?: (userId: string) => Promise<void>;
  isProcessingUser: string | null;
  currentSchoolId?: string;
}

export default function UserTable({
  users,
  isPendingTab,
  currentUserId,
  onApproveUser,
  onRejectUser,
  isProcessingUser,
  currentSchoolId,
}: UserTableProps) {

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="h-4 w-4 mr-1 inline-block" />;
      case 'teacher': return <Briefcase className="h-4 w-4 mr-1 inline-block" />;
      case 'student': return <GraduationCap className="h-4 w-4 mr-1 inline-block" />;
      default: return <UserCircle className="h-4 w-4 mr-1 inline-block" />;
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
      case 'active': return 'default' as const;
      case 'pending_verification': return 'secondary' as const;
      case 'rejected':
      case 'disabled': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
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
              {!isPendingTab && (
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                    {user.status || 'Active'}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="text-right space-x-2">
                {isPendingTab && currentSchoolId && onApproveUser && onRejectUser ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => onApproveUser(user.id, currentSchoolId)} 
                          disabled={isProcessingUser === user.id}
                          className="button-shadow text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {isProcessingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserCheck className="h-4 w-4"/>}
                          <span className="sr-only">Approve User</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Approve User</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => onRejectUser(user.id)}
                          disabled={isProcessingUser === user.id}
                          className="button-shadow"
                        >
                          {isProcessingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserX className="h-4 w-4"/>}
                          <span className="sr-only">Reject User</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Reject User</p></TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    {user.role === 'student' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" asChild className="button-shadow">
                            <Link href={`/student-profile/${user.id}`}>
                              <Eye className="h-4 w-4"/>
                              <span className="sr-only">View Profile</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>View Student Profile</p></TooltipContent>
                      </Tooltip>
                    )}
                    {currentUserId !== user.id && user.role !== 'admin' && (user.status === 'active' || user.status === 'disabled') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" asChild className="button-shadow">
                            <Link href={`/admin/users/${user.id}/edit`}>
                              <Edit className="h-4 w-4"/>
                              <span className="sr-only">Edit User</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Edit User</p></TooltipContent>
                      </Tooltip>
                    )}
                    {(currentUserId === user.id || user.role === 'admin') && (user.status === 'active' || user.status === 'disabled') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" disabled className="opacity-50">
                              <Edit className="h-4 w-4"/>
                              <span className="sr-only">Edit User (Disabled)</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Cannot edit own admin account or other admins</p></TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
