
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SchoolIcon, Copy, Check, RefreshCw, Save, Settings2, AlertTriangle } from 'lucide-react';
import type { School } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Loader from '@/components/shared/Loader'; 
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function SchoolSettingsPage() {
  const { currentUser, getSchoolDetails, regenerateInviteCode, updateSchoolDetails, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [school, setSchool] = useState<School | null>(null);
  const [editableSchoolName, setEditableSchoolName] = useState('');
  const [isExamMode, setIsExamMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingExamMode, setIsSavingExamMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSchoolCreator = currentUser?.uid === school?.adminId;

  useEffect(() => {
    const fetchSchool = async () => {
      if (currentUser?.schoolId) {
        setIsLoading(true);
        const schoolDetails = await getSchoolDetails(currentUser.schoolId);
        setSchool(schoolDetails);
        if (schoolDetails) {
          setEditableSchoolName(schoolDetails.name);
          setIsExamMode(schoolDetails.isExamModeActive || false);
        }
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

  const handleSaveSchoolName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id || !editableSchoolName.trim() || !isSchoolCreator) return;
    setIsSavingName(true);
    const success = await updateSchoolDetails(school.id, { name: editableSchoolName.trim() });
    if (success) {
      setSchool(prev => prev ? { ...prev, name: editableSchoolName.trim() } : null);
      toast({ title: "School Name Updated!", description: "The school name has been successfully changed."});
    } else {
      toast({ title: "Error", description: "Failed to update school name.", variant: "destructive" });
    }
    setIsSavingName(false);
  };

  const handleToggleExamMode = async (checked: boolean) => {
    if (!school?.id || !isSchoolCreator) return;
    setIsSavingExamMode(true);
    const success = await updateSchoolDetails(school.id, { isExamModeActive: checked });
    if (success) {
      setIsExamMode(checked);
      setSchool(prev => prev ? { ...prev, isExamModeActive: checked } : null);
      toast({ title: `Exam Mode ${checked ? 'Activated' : 'Deactivated'}`, description: `School exam mode has been ${checked ? 'enabled' : 'disabled'}.` });
    } else {
      toast({ title: "Error", description: "Failed to update exam mode status.", variant: "destructive" });
    }
    setIsSavingExamMode(false);
  };


  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading school settings..." size="large" />
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
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">General School Settings</h1>
        
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center"><SchoolIcon className="mr-2 h-5 w-5 text-primary" /> School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSaveSchoolName} className="space-y-4">
              <div>
                <Label htmlFor="schoolName" className="block text-sm font-medium text-foreground mb-1">School Name</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="schoolName" 
                    value={editableSchoolName} 
                    onChange={(e) => setEditableSchoolName(e.target.value)}
                    readOnly={!isSchoolCreator || isSavingName} 
                    className={!isSchoolCreator ? "bg-muted/50" : ""}
                  />
                  {isSchoolCreator && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="submit" size="icon" disabled={isSavingName || editableSchoolName === school.name} className="button-shadow">
                          {isSavingName ? <Loader size="small" /> : <Save className="h-4 w-4" />}
                          <span className="sr-only">Save School Name</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Save School Name</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {!isSchoolCreator && <p className="text-xs text-muted-foreground mt-1">Only the school creator can edit the school name.</p>}
              </div>
            </form>
            <div>
              <Label htmlFor="adminId" className="block text-sm font-medium text-foreground mb-1">Admin ID (Creator)</Label>
              <Input id="adminId" value={school.adminId} readOnly className="bg-muted/50" />
            </div>
            {school.createdAt && (
              <div>
                <Label htmlFor="createdAt" className="block text-sm font-medium text-foreground mb-1">School Created On</Label>
                <Input id="createdAt" value={format(school.createdAt.toDate(), 'PPP')} readOnly className="bg-muted/50" />
              </div>
            )}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleCopyCode} disabled={copied} className="button-shadow">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">{copied ? 'Copied' : 'Copy code'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{copied ? 'Copied!' : 'Copy Invite Code'}</p></TooltipContent>
              </Tooltip>
            </div>
            {isSchoolCreator && (
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleRegenerateCode} disabled={isRegenerating} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
                    {isRegenerating && <Loader size="small" className="mr-2" />}
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Invite Code
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Generate a new invite code</p></TooltipContent>
              </Tooltip>
            )}
          </CardContent>
          {isSchoolCreator && (
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Regenerating the code will invalidate the old one.
              </p>
            </CardFooter>
          )}
        </Card>

        {isSchoolCreator && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/>Exam Mode</CardTitle>
              <CardDescription>
                Enable Exam Mode to allow teachers to enter results for designated exam periods.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="exam-mode-toggle"
                  checked={isExamMode}
                  onCheckedChange={handleToggleExamMode}
                  disabled={isSavingExamMode}
                  aria-label="Toggle Exam Mode"
                />
                <Label htmlFor="exam-mode-toggle" className="text-base">
                  {isExamMode ? "Exam Mode is ON" : "Exam Mode is OFF"}
                </Label>
                {isSavingExamMode && <Loader size="small" className="ml-2"/>}
              </div>
              {isExamMode && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center">
                      <AlertTriangle className="h-5 w-5 text-destructive mr-2"/>
                      <p className="text-sm text-destructive-foreground">
                          While Exam Mode is ON, certain student activities might be restricted or logged differently. Ensure exam periods are properly configured.
                      </p>
                  </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="button-shadow">
                <Link href="/admin/exams">Manage Exam Periods</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

