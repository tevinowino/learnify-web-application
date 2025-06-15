
"use client";

import React, { useEffect, useState } from 'react';
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, LogOut as LogOutIcon, Library, FileText, UserCircle2, BookCopy, UserCog, Edit3, ListChecks, FolderOpen, BarChart2, PanelLeft, BookText as BookTextIcon, Shield, HeartHandshake, Users2, FilePieChart, Activity, Sparkles, Brain, Bell, ShieldCheck, MessageSquare, ClipboardCheck, LayoutDashboard as DashboardIconLucide } from 'lucide-react'; 
import Logo from '@/components/shared/Logo'; 
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar'; 
import { usePathname } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';
import { ThemeToggle } from '../ui/theme-toggle'; 
import NotificationBell from '../shared/NotificationBell';
import TestimonialPromptDialog from '../shared/TestimonialPromptDialog'; 
import { Timestamp } from 'firebase/firestore'; 
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

const navItemsConfig = {
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: <Home /> },
    { href: '/admin/users', label: 'Manage Users', icon: <Users /> },
    { href: '/admin/classes', label: 'Manage Classes', icon: <BookCopy /> },
    { href: '/admin/exams', label: 'Exam Management', icon: <FilePieChart /> },
    { href: '/admin/results', label: 'Enter Exam Results', icon: <ClipboardCheck /> },
    { href: '/admin/attendance', label: 'View Attendance', icon: <Users2 />},
    { href: '/admin/activity', label: 'Activity Log', icon: <Activity /> },
    { href: '/admin/testimonials', label: 'Testimonials', icon: <MessageSquare /> },
    { href: '/admin/settings', label: 'School Settings', icon: <Settings /> },
    { href: '/admin/profile', label: 'My Profile', icon: <UserCog /> },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <Home /> },
    { href: '/teacher/mwalimu', label: 'Mwalimu AI', icon: <Brain /> },
    { href: '/teacher/classes', label: 'My Classes', icon: <BookCopy /> },
    { href: '/teacher/materials', label: 'Manage Materials', icon: <Library /> },
    { href: '/teacher/assignments', label: 'Manage Assignments', icon: <Edit3 /> },
    { href: '/teacher/results', label: 'Enter Exam Results', icon: <FilePieChart /> }, 
    { href: '/teacher/attendance', label: 'Attendance', icon: <Users2 /> },
    { href: '/teacher/progress', label: 'Student Progress', icon: <BarChart2 /> },
    { href: '/teacher/activity', label: 'Activity Log', icon: <Activity /> },
    { href: '/teacher/profile', label: 'My Profile', icon: <UserCircle2 /> },
  ],
  student: [
    { href: '/student/dashboard', label: 'My Dashboard', icon: <Home /> }, 
    { href: '/student/akili', label: 'Akili Chat', icon: <Sparkles /> },
    { href: '/student/classes', label: 'My Classes', icon: <FolderOpen /> },
    { href: '/student/assignments', label: 'My Assignments', icon: <ListChecks /> },
    { href: '/student/resources', label: 'Learning Resources', icon: <FileText /> },
    { href: '/student/results', label: 'My Exam Results', icon: <FilePieChart /> },
    { href: '/student/attendance', label: 'My Attendance', icon: <Users2 /> },
    { href: '/student/progress', label: 'My Progress', icon: <BarChart2 /> },
    { href: '/student/activity', label: 'Activity Log', icon: <Activity /> },
    { href: '/student/profile', label: 'My Profile', icon: <UserCircle2 /> },
  ],
  parent: [ 
    { href: '/parent/dashboard', label: 'Child Overview', icon: <Home /> },
    { href: '/parent/assignments', label: "Child's Assignments", icon: <ListChecks /> },
    { href: '/parent/results', label: "Child's Exam Results", icon: <FilePieChart /> },
    { href: '/parent/attendance', label: "Child's Attendance", icon: <Users2 /> },
    { href: '/parent/profile', label: 'My Profile', icon: <UserCircle2 /> },
  ],
};

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { logOut, currentUser, loading: authLoading } = useAuth(); 
  const currentNavItems = userRole ? navItemsConfig[userRole] || [] : [];
  const pathname = usePathname();
  const [isTestimonialPromptOpen, setIsTestimonialPromptOpen] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.status === 'active' && !authLoading) {
        const lastSurveyDate = currentUser.lastTestimonialSurveyAt?.toDate();
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        if (!lastSurveyDate || lastSurveyDate < tenDaysAgo) {
            if (!pathname.startsWith('/auth/') && !pathname.endsWith('/onboarding')) {
                const timer = setTimeout(() => {
                    setIsTestimonialPromptOpen(true);
                }, 5000); 
                return () => clearTimeout(timer);
            }
        }
    }
  }, [currentUser, authLoading, pathname]);

  const getDashboardPath = () => {
    if (!currentUser || !currentUser.role) return '/auth/login';
    switch (currentUser.role) {
      case 'admin': return '/admin/dashboard';
      case 'teacher': return '/teacher/dashboard';
      case 'student': return '/student/dashboard';
      case 'parent': return '/parent/dashboard';
      default: return '/';
    }
  };

  const getProfilePath = () => {
    if (!currentUser || !currentUser.role) return '/auth/login';
    switch (currentUser.role) {
        case 'admin': return '/admin/profile';
        case 'teacher': return '/teacher/profile';
        case 'student': return '/student/profile';
        case 'parent': return '/parent/profile';
        default: return '/';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar collapsible="icon" side="left" variant="sidebar" className="hidden md:flex"> 
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Logo />
          </SidebarHeader>
          <ScrollArea className="flex-grow">
            <SidebarContent className="px-2 pt-16"> 
              <SidebarMenu>
                {currentNavItems.map(item => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href) && item.href.split('/').length <= pathname.split('/').length)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        {React.cloneElement(item.icon, { className: "mr-3" })}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                 {currentUser?.role === 'teacher' && currentUser?.isAdminAlso === true && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Switch to Admin Dashboard"
                      className="mt-4 bg-accent/20 hover:bg-accent/30 text-accent-foreground"
                    >
                      <Link href="/admin/dashboard">
                        <ShieldCheck className="mr-3 text-accent" />
                        <span>Admin View</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            {currentUser && (
              <div className="p-2 mb-1 text-sm text-sidebar-foreground/80">
                <p className="font-semibold text-sidebar-foreground truncate">{currentUser.displayName || "User"}</p>
                <p className="truncate text-xs">{currentUser.email}</p>
              </div>
            )}
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={logOut} tooltip="Log Out">
                        <LogOutIcon className="mr-3"/>
                        <span>Log Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-hidden"> 
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 sm:gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden">
                <PanelLeft />
                <span className="sr-only">Toggle sidebar</span>
              </SidebarTrigger>
               <div className="md:hidden">
                 <Logo />
               </div>
            </div>

             <div className="flex-1 text-left sm:text-center md:text-left md:pl-0"> 
              {currentUser?.schoolName && (
                <span className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate max-w-[120px] xxs:max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                  {currentUser.schoolName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                {currentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-accent/20">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                          <AvatarFallback>{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle2/>}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl shadow-lg" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg focus:bg-accent/20">
                        <Link href={getDashboardPath()}>
                          <DashboardIconLucide className="mr-2 h-4 w-4" /> Dashboard {/* Changed icon */}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg focus:bg-accent/20">
                        <Link href={getProfilePath()}>
                          <UserCog className="mr-2 h-4 w-4" /> My Profile 
                        </Link>
                      </DropdownMenuItem>
                      {currentUser.role === 'admin' && (
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-accent/20">
                          <Link href="/admin/settings">
                            <Settings className="mr-2 h-4 w-4" /> School Settings
                          </Link>
                        </DropdownMenuItem>
                      )}
                       {currentUser.role === 'teacher' && currentUser.isAdminAlso === true && (
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-accent/20">
                            <Link href="/admin/dashboard">
                                <ShieldCheck className="mr-2 h-4 w-4 text-accent" /> Admin View
                            </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logOut} className="rounded-lg text-red-500 focus:text-red-500 focus:bg-red-50">
                        <LogOutIcon className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-full mx-auto"> 
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      {currentUser && currentUser.role !== 'admin' && (
        <TestimonialPromptDialog 
            isOpen={isTestimonialPromptOpen}
            onOpenChange={setIsTestimonialPromptOpen}
            user={currentUser}
        />
      )}
    </SidebarProvider>
  );
}
