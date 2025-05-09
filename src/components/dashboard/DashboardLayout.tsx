
"use client";

import React from 'react';
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, BookOpen, BarChart2, Settings, LogOut as LogOutIcon, Library, FileText, UserCircle2, BookCopy, UserCog } from 'lucide-react'; 
import Logo from '@/components/shared/Logo';


interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

const navItems = {
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: <Home className="h-5 w-5" /> },
    { href: '/admin/users', label: 'Manage Users', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/classes', label: 'Manage Classes', icon: <BookCopy className="h-5 w-5" /> },
    { href: '/admin/settings', label: 'School Settings', icon: <Settings className="h-5 w-5" /> },
    { href: '/admin/profile', label: 'My Profile', icon: <UserCog className="h-5 w-5" /> },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/teacher/materials', label: 'Manage Materials', icon: <Library className="h-5 w-5" /> },
    { href: '/teacher/progress', label: 'Student Progress', icon: <BarChart2 className="h-5 w-5" /> },
    // Add Teacher Profile link if needed: { href: '/teacher/profile', label: 'My Profile', icon: <UserCircle2 className="h-5 w-5" /> },
  ],
  student: [
    { href: '/student/dashboard', label: 'My Dashboard', icon: <Home className="h-5 w-5" /> }, 
    { href: '/student/progress', label: 'My Progress', icon: <BarChart2 className="h-5 w-5" /> },
    { href: '/student/resources', label: 'Learning Resources', icon: <FileText className="h-5 w-5" /> },
     // Add Student Profile link if needed: { href: '/student/profile', label: 'My Profile', icon: <UserCircle2 className="h-5 w-5" /> },
  ],
};

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { logOut, currentUser } = useAuth(); 
  const currentNavItems = userRole ? navItems[userRole] || [] : [];

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside className="w-64 bg-background p-4 border-r flex flex-col shadow-lg">
        <div className="mb-8">
          <Link href="/" aria-label="Go to Homepage">
            <Logo/>
          </Link>
        </div>
        <nav className="flex-grow space-y-1">
          {currentNavItems.map(item => (
            <Button variant="ghost" className="w-full justify-start text-left text-sm" asChild key={item.href}>
              <Link href={item.href} className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-border">
          {currentUser && (
            <div className="p-3 mb-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground truncate">{currentUser.displayName || "User"}</p>
              <p className="truncate">{currentUser.email}</p>
            </div>
          )}
           <Button variant="ghost" className="w-full justify-start text-left text-sm" onClick={logOut}>
             <LogOutIcon className="mr-3 h-5 w-5" /> Log Out
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
