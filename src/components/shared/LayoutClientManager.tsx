
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';

export default function LayoutClientManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/admin') ||
                           pathname.startsWith('/teacher') ||
                           pathname.startsWith('/student') ||
                           pathname.startsWith('/parent');

  return (
    <div className="flex flex-col min-h-screen">
      {!isDashboardRoute && <Navbar />}
      <main className={`flex-grow ${!isDashboardRoute ? 'container mx-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
}
