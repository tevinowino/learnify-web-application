"use client";

import React from 'react';
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, BookOpen, BarChart2, Settings, LogOut as LogOutIcon, ChevronLeft } from 'lucide-react';
import Logo from '@/components/shared/Logo';


interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

const navItems = {
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: <Home className="h-5 w-5" /> },
    { href: '/admin/users', label: 'Manage Users', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/settings', label: 'School Settings', icon: <Settings className="h-5 w-5" /> },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'My Classes', icon: <Home className="h-5 w-5" /> },
    { href: '/teacher/materials', label: 'Upload Materials', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/teacher/progress', label: 'Student Progress', icon: <BarChart2 className="h-5 w-5" /> },
  ],
  student: [
    { href: '/student/dashboard', label: 'My Learning Path', icon: <Home className="h-5 w-5" /> },
    { href: '/student/progress', label: 'My Progress', icon: <BarChart2 className="h-5 w-5" /> },
    { href: '/student/resources', label: 'Resources', icon: <BookOpen className="h-5 w-5" /> },
  ],
};

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { currentUser, logOut } = useAuth();
  const currentNavItems = userRole ? navItems[userRole] || [] : [];

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside className="w-64 bg-background p-4 border-r flex flex-col shadow-lg">
        <div className="mb-8">
          <Logo/>
        </div>
        <nav className="flex-grow space-y-2">
          {currentNavItems.map(item => (
            <Button variant="ghost" className="w-full justify-start text-left" asChild key={item.href}>
              <Link href={item.href} className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto">
           <Button variant="ghost" className="w-full justify-start text-left" onClick={logOut}>
             <LogOutIcon className="mr-3 h-5 w-5" /> Log Out
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
