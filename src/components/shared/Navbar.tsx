
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { siteConfig } from '@/config/site';
import { LogOut, LayoutDashboard, UserCircle, UserPlus, LogInIcon, Menu, HomeIcon, InfoIcon, MessageSquareIcon, UserCog, Sparkles, Settings, Brain } from 'lucide-react';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ui/theme-toggle';

export default function Navbar() {
  const { currentUser, logOut, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getDashboardPath = () => {
    if (!currentUser || !currentUser.role) return '/auth/login';
    switch (currentUser.role) {
      case 'admin':
        return currentUser.schoolId ? '/admin/dashboard' : '/admin/onboarding';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        if (currentUser.status === 'pending_verification') return '/auth/pending-verification';
        return (currentUser.classIds && currentUser.classIds.length > 0) ? '/student/dashboard' : '/student/onboarding';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/';
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
  
  const mainNavLinks = siteConfig.mainNav.map(item => {
    let icon: React.ReactNode = <HomeIcon className="mr-2 h-4 w-4" />;
    switch (item.title) {
        case "About": icon = <InfoIcon className="mr-2 h-4 w-4" />; break;
        case "Contact Us": icon = <MessageSquareIcon className="mr-2 h-4 w-4" />; break;
    }
    return { ...item, icon };
  });

  const isOnHomepage = pathname === '/';

  const mobileNavLinksToDisplay = [];
  if (isOnHomepage) {
    mobileNavLinksToDisplay.push(...mainNavLinks);
  }

  if (currentUser) {
    mobileNavLinksToDisplay.push({ href: getDashboardPath(), label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> });
    if (currentUser.role === 'student') {
      mobileNavLinksToDisplay.push({ href: "/student/akili", label: "Akili Chat", icon: <Sparkles className="mr-2 h-4 w-4" /> });
    }
    if (currentUser.role === 'teacher') {
      mobileNavLinksToDisplay.push({ href: "/teacher/mwalimu", label: "Mwalimu AI", icon: <Brain className="mr-2 h-4 w-4" /> });
    }
  } else {
    mobileNavLinksToDisplay.push({ href: "/auth/login", label: "Login", icon: <LogInIcon className="mr-2 h-4 w-4" /> });
    mobileNavLinksToDisplay.push({ href: "/auth/signup", label: "Sign Up", icon: <UserPlus className="mr-2 h-4 w-4" /> });
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Go to Homepage">
          <Logo />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-1">
          {isOnHomepage && mainNavLinks.map(item => (
            <Button variant="ghost" asChild key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
          
          {currentUser?.role === 'student' && (
             <Button variant="ghost" asChild>
              <Link href="/student/akili">
                <Sparkles className="mr-2 h-4 w-4 text-primary" /> Akili Chat
              </Link>
            </Button>
          )}
          {currentUser?.role === 'teacher' && (
             <Button variant="ghost" asChild>
              <Link href="/teacher/mwalimu">
                <Brain className="mr-2 h-4 w-4 text-primary" /> Mwalimu AI
              </Link>
            </Button>
          )}

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
                <DropdownMenuItem asChild>
                  <Link href={getProfilePath()}>
                    <UserCog className="mr-2 h-4 w-4" /> My Profile 
                  </Link>
                </DropdownMenuItem>
                {currentUser.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" /> School Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={logOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
           {loading && <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>}
           <ThemeToggle />
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>
                 <Link href="/" aria-label="Go to Homepage" onClick={() => setIsMobileMenuOpen(false)}>
                    <Logo />
                  </Link>
              </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-1 p-2">
                {mobileNavLinksToDisplay.map((item) => (
                    <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start text-left text-base py-3 h-auto" asChild key={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href={item.href} className="flex items-center">
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  )
                 )}
                {currentUser && (
                  <>
                    <div className="pt-4 mt-4 border-t">
                       <div className="px-3 pb-2">
                          <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                         <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto" asChild onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href={getProfilePath()} className="flex items-center">
                                <UserCog className="mr-2 h-4 w-4" /> My Profile
                            </Link>
                        </Button>
                        {currentUser.role === 'admin' && (
                           <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto" asChild onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/admin/settings" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" /> School Settings
                            </Link>
                           </Button>
                        )}
                        <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { logOut(); setIsMobileMenuOpen(false);}}>
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
