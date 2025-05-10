"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Logo from './Logo'; // Logo is now presentational
import { siteConfig } from '@/config/site';
import { LogOut, LayoutDashboard, UserCircle, UserPlus, LogInIcon, Menu, HomeIcon, BookOpenText, SettingsIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { currentUser, logOut, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getDashboardPath = () => {
    if (!currentUser || !currentUser.role) return '/';
    switch (currentUser.role) {
      case 'admin':
        return currentUser.schoolId ? '/admin/dashboard' : '/admin/onboarding';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  const commonNavLinks = [
    { href: "/", label: "Home", icon: <HomeIcon className="mr-2 h-4 w-4" /> },
    // Add other common links if any
  ];

  const guestLinks = [
    ...commonNavLinks,
    { href: "/auth/login", label: "Login", icon: <LogInIcon className="mr-2 h-4 w-4" /> },
    { href: "/auth/signup", label: "Sign Up", icon: <UserPlus className="mr-2 h-4 w-4" /> },
  ];

  const userLinks = [
    ...commonNavLinks,
    { href: getDashboardPath(), label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    // Profile link might be in user dropdown or a separate nav item for dashboard layouts
  ];
  
  const navLinksToDisplay = currentUser ? userLinks : guestLinks;
  // Filter out dashboard link from global nav if already in a dashboard section.
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/teacher') || pathname?.startsWith('/student');


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Learnify Home">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {!loading && !currentUser && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">
                  <LogInIcon className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
          {!loading && currentUser && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                    <AvatarFallback>{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle/>}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isDashboardRoute && (
                   <DropdownMenuItem asChild>
                    <Link href={getDashboardPath()}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                 <DropdownMenuItem onClick={logOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
           {loading && <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>}
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="p-4">
                <Link href="/" aria-label="Learnify Home" onClick={() => setIsMobileMenuOpen(false)}>
                  <Logo />
                </Link>
              </div>
              <nav className="flex flex-col space-y-2 p-4">
                {navLinksToDisplay.map((item) => {
                  if(isDashboardRoute && item.label === "Dashboard") return null; // Don't show dashboard link if already in dashboard
                  return (
                    <Button variant="ghost" className="w-full justify-start text-left text-base py-3" asChild key={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href={item.href} className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                 })}
                {currentUser && (
                  <>
                    <div className="pt-4 mt-4 border-t">
                       <DropdownMenuLabel className="font-normal px-3 pb-2">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {currentUser.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <Button variant="ghost" className="w-full justify-start text-left text-base py-3" onClick={() => { logOut(); setIsMobileMenuOpen(false);}}>
                          <LogOut className="mr-3 h-5 w-5" /> Log Out
                        </Button>
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
