
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings, BookText, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SchoolSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin/settings', label: 'General Settings', icon: <Settings className="mr-2 h-4 w-4" /> },
    { href: '/admin/school-settings/subjects', label: 'Manage Subjects', icon: <BookText className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
        <Button variant="outline" asChild className="mb-4 button-shadow">
            <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
        </Button>
        <div className="grid md:grid-cols-4 gap-6 items-start">
            <Card className="md:col-span-1 card-shadow">
                <CardContent className="p-4">
                    <nav className="flex flex-col space-y-1">
                    {navLinks.map(link => (
                        <Button
                        key={link.href}
                        variant={pathname === link.href ? 'default' : 'ghost'}
                        asChild
                        className="justify-start"
                        >
                        <Link href={link.href}>
                            {link.icon}
                            {link.label}
                        </Link>
                        </Button>
                    ))}
                    </nav>
                </CardContent>
            </Card>
            <div className="md:col-span-3">
                {children}
            </div>
        </div>
    </div>
  );
}
