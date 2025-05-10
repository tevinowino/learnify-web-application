
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckSquare, ListChecks, GraduationCap, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassWithTeacherInfo, Subject } from '@/types';

export default function StudentOnboardingPage() {
  const { currentUser, getClassesBySchool, getSubjectsBySchool, completeStudentOnboarding, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1 for class, 2 for subjects
  const [availableClasses, setAvailableClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentUser?.schoolId) {
      if (!authLoading) setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const [classes, subjects] = await Promise.all([
        getClassesBySchool(currentUser.schoolId),
        getSubjectsBySchool(currentUser.schoolId)
      ]);
      setAvailableClasses(classes.sort((a,b) => a.name.localeCompare(b.name)));
      setAvailableSubjects(subjects.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
      toast({ title: "Error", description: "Could not load school data.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, getClassesBySchool, getSubjectsBySchool, authLoading, toast]);

  useEffect(() => {
    // Redirect if already onboarded (has classIds) or not a student
    if (!loading && currentUser) {
      if (currentUser.role !== 'student' || (currentUser.classIds && currentUser.classIds.length > 0)) {
        router.push(currentUser.role === 'student' ? '/student/dashboard' : '/');
        return;
      }
      fetchData();
    }
  }, [currentUser, loading, router, fetchData]);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedClassId) {
      toast({ title: "Class Required", description: "Please select a class to join.", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleCompleteOnboarding = async () => {
    if (!currentUser?.uid || !selectedClassId) {
      toast({ title: "Error", description: "Missing required information.", variant: "destructive" });
      return;
    }
    if (selectedSubjectIds.length === 0) {
      toast({ title: "Subjects Required", description: "Please select at least one subject.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const success = await completeStudentOnboarding(currentUser.uid, selectedClassId, selectedSubjectIds);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Onboarding Complete!", description: "Welcome to Learnify! You're all set." });
      router.push('/student/dashboard');
    } else {
      toast({ title: "Onboarding Failed", description: "Could not complete your onboarding. Please try again.", variant: "destructive" });
    }
  };
  
  const pageOverallLoading = authLoading || isLoadingData;

  if (pageOverallLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser || currentUser.role !== 'student') {
    // This case should ideally be handled by ProtectedRoute, but as a fallback
    return <div className="text-center p-4">Access Denied. You must be a student.</div>;
  }
  if (!currentUser.schoolId) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <Card className="w-full max-w-md shadow-xl text-center">
                <CardHeader>
                    <CardTitle>School Information Missing</CardTitle>
                    <CardDescription>Your account is not yet associated with a school. Please contact your school administrator or ensure you have completed the initial school joining process if applicable.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
                </CardContent>
            </Card>
        </div>
     );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <GraduationCap className="mr-2 h-7 w-7 text-primary" /> Welcome to {currentUser.schoolName || 'Learnify'}!
          </CardTitle>
          <CardDescription>Let's get you set up. Please complete these steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center"><ListChecks className="mr-2 h-5 w-5 text-accent"/>Step 1: Select Your Class</h3>
              {availableClasses.length === 0 ? (
                <p className="text-muted-foreground">No classes available in your school yet. Please check back later or contact your admin.</p>
              ) : (
                <div>
                  <Label htmlFor="class-select">Choose your primary class</Label>
                  <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                    <SelectTrigger id="class-select" className="w-full">
                      <SelectValue placeholder="Select a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name} (Teacher: {cls.teacherDisplayName || 'N/A'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleNextStep} className="w-full button-shadow" disabled={!selectedClassId || availableClasses.length === 0}>
                Next: Choose Subjects
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-accent"/>Step 2: Select Your Subjects</h3>
              {availableSubjects.length === 0 ? (
                <p className="text-muted-foreground">No subjects defined for your school yet. You can proceed without selecting subjects for now.</p>
              ) : (
                <ScrollArea className="h-60 border rounded-md p-4">
                  <div className="space-y-3">
                    {availableSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`subject-${subject.id}`} 
                          checked={selectedSubjectIds.includes(subject.id)}
                          onCheckedChange={() => handleSubjectToggle(subject.id)}
                        />
                        <Label htmlFor={`subject-${subject.id}`} className="font-normal cursor-pointer">{subject.name}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-1/2">Back</Button>
                <Button onClick={handleCompleteOnboarding} className="w-1/2 button-shadow bg-primary hover:bg-primary/90" disabled={isSubmitting || selectedSubjectIds.length === 0 && availableSubjects.length > 0}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                  Complete Onboarding
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">You can manage your classes and profile details later from your dashboard.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
