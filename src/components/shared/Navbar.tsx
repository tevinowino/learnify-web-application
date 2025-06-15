
  "use client";

  import Link from 'next/link';
  import { useAuth } from '@/hooks/useAuth';
  import { Button } from '@/components/ui/button';
  import Logo from './Logo';
  import { siteConfig } from '@/config/site';
  import { LogOut, LayoutDashboard, UserCircle, UserPlus, LogInIcon, Menu, HomeIcon, InfoIcon, MessageSquareIcon, UserCog, Sparkles, Settings, Brain, Bell, ShieldCheck } from 'lucide-react'; // Added LayoutDashboard, UserCog, Settings, Brain, Bell, ShieldCheck
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
  import NotificationBell from './NotificationBell'; 

  export default function Navbar() {
    const { currentUser, logOut, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // This Navbar is now primarily for public-facing pages.
    // Dashboard-specific navigation is handled in DashboardLayout.

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
      let icon: React.ReactNode;
      switch (item.title) {
          case "Home": icon = <HomeIcon className="mr-2 h-4 w-4" />; break;
          case "About": icon = <InfoIcon className="mr-2 h-4 w-4" />; break;
          case "Contact Us": icon = <MessageSquareIcon className="mr-2 h-4 w-4" />; break;
          default: icon = <span className="mr-2 h-4 w-4" />; 
      }
      return { ...item, label: item.title, icon };
    });

    const mobileNavLinksToDisplay = [...mainNavLinks]; 

    if (currentUser) {
      mobileNavLinksToDisplay.unshift({ href: getDashboardPath(), label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> });
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
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="container mx-auto backdrop-blur-lg bg-background/60 border rounded-2xl shadow-lg px-6 py-4">
          <div className="flex h-14 items-center justify-between">
            <Logo onClick={() => setIsMobileMenuOpen(false)} /> 
          
            <nav className="hidden md:flex items-center space-x-2">
              {mainNavLinks.map(item => (
                <Button variant="ghost" className="rounded-lg hover:bg-accent/20" asChild key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            
              {!loading && !currentUser && (
                <>
                  <Button variant="ghost" className="rounded-lg hover:bg-accent/20" asChild>
                    <Link href="/auth/login">
                      <LogInIcon className="mr-2 h-4 w-4" /> Login
                    </Link>
                  </Button>
                  <Button asChild className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                    <Link href="/auth/signup">
                      <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                    </Link>
                  </Button>
                </>
              )}
              {!loading && currentUser && (
                <>
                  <NotificationBell /> 
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-accent/20">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                          <AvatarFallback>{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle/>}</AvatarFallback>
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
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg focus:bg-accent/20">
                        <Link href={getProfilePath()}>
                          <UserCog className="mr-2 h-4 w-4" /> My Profile 
                        </Link>
                      </DropdownMenuItem>
                       {currentUser.role === 'teacher' && currentUser.isAdminAlso === true && (
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-accent/20">
                            <Link href="/admin/dashboard">
                                <ShieldCheck className="mr-2 h-4 w-4 text-accent" /> Admin View
                            </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logOut} className="rounded-lg text-red-500 focus:text-red-500 focus:bg-red-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
             {loading && <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>}
             <ThemeToggle />
            </nav>

            <div className="md:hidden flex items-center gap-2">
              {currentUser && <NotificationBell />}
              <ThemeToggle />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-lg hover:bg-accent/20">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 rounded-l-2xl">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>
                   <Logo onClick={() => setIsMobileMenuOpen(false)} /> 
                  </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-1 p-2">
                    {mobileNavLinksToDisplay.map((item) => (
                        <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start text-left text-base py-3 h-auto rounded-lg" asChild key={item.href} onClick={() => setIsMobileMenuOpen(false)}>
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
                           <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto rounded-lg" asChild onClick={() => setIsMobileMenuOpen(false)}>
                                <Link href={getProfilePath()} className="flex items-center">
                                    <UserCog className="mr-2 h-4 w-4" /> My Profile
                                </Link>
                            </Button>
                            {currentUser.role === 'teacher' && currentUser.isAdminAlso === true && (
                                <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto rounded-lg" asChild onClick={() => setIsMobileMenuOpen(false)}>
                                    <Link href="/admin/dashboard" className="flex items-center text-accent">
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Admin View
                                    </Link>
                                </Button>
                            )}
                            <Button variant="ghost" className="w-full justify-start text-left text-base py-3 h-auto rounded-lg text-red-500 hover:text-red-500 hover:bg-red-50" onClick={() => { logOut(); setIsMobileMenuOpen(false);}}>
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
        </div>
      </header>
    );
  }
