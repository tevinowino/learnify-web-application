
"use client";

import React from 'react';
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, LogOut as LogOutIcon, Library, FileText, UserCircle2, BookCopy, UserCog, Edit3, ListChecks, FolderOpen, BarChart2, PanelLeft, BookText as BookTextIcon } from 'lucide-react'; 
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


interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

const navItemsConfig = {
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: <Home /> },
    { href: '/admin/users', label: 'Manage Users', icon: <Users /> },
    { href: '/admin/classes', label: 'Manage Classes', icon: <BookCopy /> },
    { href: '/admin/school-settings/subjects', label: 'Manage Subjects', icon: <BookTextIcon /> },
    { href: '/admin/settings', label: 'School Settings', icon: <Settings /> },
    { href: '/admin/profile', label: 'My Profile', icon: <UserCog /> },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <Home /> },
    { href: '/teacher/classes', label: 'My Classes', icon: <BookCopy /> },
    { href: '/teacher/materials', label: 'Manage Materials', icon: <Library /> },
    { href: '/teacher/assignments', label: 'Manage Assignments', icon: <Edit3 /> },
    { href: '/teacher/progress', label: 'Student Progress', icon: <BarChart2 /> },
    { href: '/teacher/profile', label: 'My Profile', icon: <UserCircle2 /> },

  ],
  student: [
    { href: '/student/dashboard', label: 'My Dashboard', icon: <Home /> }, 
    { href: '/student/classes', label: 'My Classes', icon: <FolderOpen /> },
    { href: '/student/assignments', label: 'My Assignments', icon: <ListChecks /> },
    { href: '/student/resources', label: 'Learning Resources', icon: <FileText /> },
    { href: '/student/progress', label: 'My Progress', icon: <BarChart2 /> },
    { href: '/student/profile', label: 'My Profile', icon: <UserCircle2 /> },
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
          <SidebarHeader className="p-4">
             <Link href="/" aria-label="Learnify Home">
                <Logo />
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-grow">
            <SidebarContent className="p-2">
              <SidebarMenu>
                {currentNavItems.map(item => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))}
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
          <SidebarFooter className="p-2 border-t">
            {currentUser && (
              <div className="p-2 mb-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground truncate">{currentUser.displayName || "User"}</p>
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

        <SidebarInset className="flex flex-col">
          {}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
              <span className="sr-only">Toggle sidebar</span>
            </SidebarTrigger>
            <div className="md:hidden">
                <Link href="/" aria-label="Learnify Home">
                  <Logo />
                </Link>
            </div>
            {}
          </header>
          
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            <div className="max-w-full mx-auto"> {}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
