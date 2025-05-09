
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, SchoolIcon, Copy, Check, RefreshCw } from 'lucide-react';
import type { School } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function SchoolSettingsPage() {
  const { currentUser, getSchoolDetails, regenerateInviteCode, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      if (currentUser?.schoolId) {
        setIsLoading(true);
        const schoolDetails = await getSchoolDetails(currentUser.schoolId);
        setSchool(schoolDetails);
        setIsLoading(false);
      } else if (!authLoading) {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchSchool();
    }
  }, [currentUser, getSchoolDetails, authLoading]);

  const handleRegenerateCode = async () => {
    if (!school?.id) return;
    setIsRegenerating(true);
    const newCode = await regenerateInviteCode(school.id);
    if (newCode) {
      setSchool(prev => prev ? { ...prev, inviteCode: newCode } : null);
      toast({ title: "Invite Code Regenerated!", description: "The school invite code has been updated." });
    } else {
      toast({ title: "Error", description: "Failed to regenerate invite code.", variant: "destructive" });
    }
    setIsRegenerating(false);
  };

  const handleCopyCode = () => {
    if (school?.inviteCode) {
      navigator.clipboard.writeText(school.inviteCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Invite code copied to clipboard."});
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>School Not Found</CardTitle>
          <CardDescription>
            School details could not be loaded. Please ensure you are assigned to a school or contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">School Settings</h1>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><SchoolIcon className="mr-2 h-5 w-5 text-primary" /> School Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-foreground mb-1">School Name</label>
            <Input id="schoolName" value={school.name} readOnly className="bg-muted/50" />
          </div>
          <div>
            <label htmlFor="adminId" className="block text-sm font-medium text-foreground mb-1">Admin ID</label>
            <Input id="adminId" value={school.adminId} readOnly className="bg-muted/50" />
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Invite Code</CardTitle>
          <CardDescription>Share this code with teachers and students to join your school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input value={school.inviteCode} readOnly className="text-lg font-mono tracking-widest bg-muted/50" />
            <Button variant="outline" size="icon" onClick={handleCopyCode} disabled={copied} className="button-shadow">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">{copied ? 'Copied' : 'Copy code'}</span>
            </Button>
          </div>
          <Button onClick={handleRegenerateCode} disabled={isRegenerating} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
            {isRegenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Invite Code
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Regenerating the code will invalidate the old one.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
