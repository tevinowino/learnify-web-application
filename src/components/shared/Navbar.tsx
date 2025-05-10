"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { siteConfig } from '@/config/site';
import { LogOut, LayoutDashboard, UserCircle, UserPlus, LogInIcon, Menu, HomeIcon, InfoIcon, DollarSignIcon, MessageSquareIcon } from 'lucide-react';
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
    if (!currentUser || !currentUser.role) return '/auth/login'; // Default to login if role somehow missing
    switch (currentUser.role) {
      case 'admin':
        return currentUser.schoolId ? '/admin/dashboard' : '/admin/onboarding';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return (currentUser.classIds && currentUser.classIds.length > 0) || currentUser.status === 'pending_verification' ? '/student/dashboard' : '/student/onboarding';
      default:
        return '/';
    }
  };
  
  const mainNavLinks = siteConfig.mainNav.map(item => {
    let icon = <HomeIcon className="mr-2 h-4 w-4" />;
    if (item.title === "About") icon = <InfoIcon className="mr-2 h-4 w-4" />;
    if (item.title === "Pricing") icon = <DollarSignIcon className="mr-2 h-4 w-4" />;
    if (item.title === "Contact Us") icon = <MessageSquareIcon className="mr-2 h-4 w-4" />;
    return { ...item, icon };
  });


  const guestLinks = [
    ...mainNavLinks,
    { href: "/auth/login", label: "Login", icon: <LogInIcon className="mr-2 h-4 w-4" /> },
    { href: "/auth/signup", label: "Sign Up", icon: <UserPlus className="mr-2 h-4 w-4" /> },
  ];

  const userLinks = [
    ...mainNavLinks,
    { href: getDashboardPath(), label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
  ];
  
  const navLinksToDisplay = currentUser ? userLinks : guestLinks;
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/teacher') || pathname?.startsWith('/student');


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {mainNavLinks.map(item => (
            <Button variant="ghost" asChild key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

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
                <DropdownMenuItem asChild>
                  <Link href={getDashboardPath()}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
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
              <div className="p-4 border-b">
                <Logo />
              </div>
              <nav className="flex flex-col space-y-1 p-2">
                {navLinksToDisplay.map((item) => {
                  // Don't show dashboard link if already in a dashboard section (for mobile simplicity)
                  if(isDashboardRoute && item.label === "Dashboard" && item.href !== "/") return null; 
                  return (
                    <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start text-left text-base py-3 h-auto" asChild key={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href={item.href} className="flex items-center">
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                 })}
                {currentUser && (
                  <>
                    <div className="pt-4 mt-4 border-t">
                       <div className="px-3 pb-2">
                          <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto" onClick={() => { logOut(); setIsMobileMenuOpen(false);}}>
                          <LogOut className="mr-2 h-4 w-4" /> Log Out
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
