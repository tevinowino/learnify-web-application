
"use client";

import React from 'react';
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, LogOut as LogOutIcon, Library, FileText, UserCircle2, BookCopy, UserCog, Edit3, ListChecks, FolderOpen, BarChart2, PanelLeft, BookText as BookTextIcon, Shield, HeartHandshake, Users2, FilePieChart, Activity, Sparkles } from 'lucide-react'; 
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
// import { ThemeToggle } from '../ui/theme-toggle'; // Removed


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
    { href: '/admin/activity', label: 'Activity Log', icon: <Activity /> },
    { href: '/admin/settings', label: 'School Settings', icon: <Settings /> },
    { href: '/admin/profile', label: 'My Profile', icon: <UserCog /> },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <Home /> },
    { href: '/teacher/classes', label: 'My Classes', icon: <BookCopy /> },
    { href: '/teacher/materials', label: 'Manage Materials', icon: <Library /> },
    { href: '/teacher/assignments', label: 'Manage Assignments', icon: <Edit3 /> },
    { href: '/teacher/results', label: 'Enter Exam Results', icon: <FilePieChart /> }, 
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
    { href: '/student/progress', label: 'My Progress', icon: <BarChart2 /> },
    { href: '/student/activity', label: 'Activity Log', icon: <Activity /> },
    { href: '/student/profile', label: 'My Profile', icon: <UserCircle2 /> },
  ],
  parent: [ 
    { href: '/parent/dashboard', label: 'Child Overview', icon: <Home /> },
    { href: '/parent/results', label: "Child's Exam Results", icon: <FilePieChart /> },
    // Add activity log for parent if needed: { href: '/parent/activity', label: 'Child Activity', icon: <Activity /> },
    { href: '/parent/profile', label: 'My Profile', icon: <UserCircle2 /> },
  ],
};

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { logOut, currentUser } = useAuth(); 
  const currentNavItems = userRole ? navItemsConfig[userRole] || [] : [];
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar collapsible="icon" side="left" variant="sidebar" className="hidden md:flex"> {}
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Link href="/" aria-label="Go to Homepage">
                <Logo />
            </Link>
            {/* {currentUser?.schoolName && (
              <p className="mt-2 text-xs text-center text-sidebar-foreground/70 truncate group-data-[collapsible=icon]:hidden">
                {currentUser.schoolName}
              </p>
            )} */}
          </SidebarHeader>
          <ScrollArea className="flex-grow">
            <SidebarContent className="px-2 pt-16"> {}
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

        <SidebarInset className="flex flex-col flex-1 overflow-hidden"> {}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 sm:gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left Group: Mobile trigger & logo (if no school name) */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden">
                <PanelLeft />
                <span className="sr-only">Toggle sidebar</span>
              </SidebarTrigger>
              {/* Mobile Logo: Shown if no school name, or if school name is short enough */}
              <Link href="/" aria-label="Go to Homepage" className={`md:hidden ${currentUser?.schoolName ? 'hidden xs:flex' : 'flex'}`}>
                <Logo />
              </Link>
            </div>

            {/* Center/Main Group: School Name */}
             <div className="flex-1 text-left sm:text-center md:text-left md:pl-0"> 
              {currentUser?.schoolName && (
                <span className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate max-w-[120px] xxs:max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                  {currentUser.schoolName}
                </span>
              )}
            </div>

            {/* Right Group: Theme Toggle */}
            {/* <div className="flex items-center"> // Removed ThemeToggle container
              <ThemeToggle />
            </div> */}
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-full mx-auto"> {}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
