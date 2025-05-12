
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, ListChecks, GraduationCap, BookOpen } from 'lucide-react';
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
import Loader from '@/components/shared/Loader'; // Import new Loader
import Logo from '@/components/shared/Logo';

export default function StudentOnboardingPage() {
  const { currentUser, getClassesBySchool, getSubjectsBySchool, completeStudentOnboarding, getClassDetails, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [availableClasses, setAvailableClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compulsorySubjectsForSelectedClass, setCompulsorySubjectsForSelectedClass] = useState<string[]>([]);

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
      const mainClasses = classes.filter(c => c.classType === 'main').sort((a,b) => a.name.localeCompare(b.name));
      setAvailableClasses(mainClasses); // Only show main classes for initial selection
      setAvailableSubjects(subjects.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
      toast({ title: "Error", description: "Could not load school data. Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, getClassesBySchool, getSubjectsBySchool, authLoading, toast]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role !== 'student' || (currentUser.classIds && currentUser.classIds.length > 0)) {
        router.push(currentUser.role === 'student' ? '/student/dashboard' : '/');
        return;
      }
      fetchData();
    }
  }, [currentUser, authLoading, router, fetchData]);

  const handleClassSelectionChange = async (classId: string) => {
    setSelectedClassId(classId);
    if (classId) {
        const classDetails = await getClassDetails(classId);
        if (classDetails?.classType === 'main' && classDetails.compulsorySubjectIds) {
            setCompulsorySubjectsForSelectedClass(classDetails.compulsorySubjectIds);
            setSelectedSubjectIds(Array.from(new Set([...classDetails.compulsorySubjectIds])));
        } else {
            setCompulsorySubjectsForSelectedClass([]);
            setSelectedSubjectIds([]); // Reset if not a main class or no compulsory subjects
        }
    } else {
        setCompulsorySubjectsForSelectedClass([]);
        setSelectedSubjectIds([]);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    if (compulsorySubjectsForSelectedClass.includes(subjectId)) return;
    setSelectedSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedClassId) {
      toast({ title: "Class Required", description: "Please select your main class to join.", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleCompleteOnboarding = async () => {
    if (!currentUser?.uid || !selectedClassId) {
      toast({ title: "Error", description: "Missing required information.", variant: "destructive" });
      return;
    }
    
    const finalSubjectIds = Array.from(new Set([...selectedSubjectIds, ...compulsorySubjectsForSelectedClass]));

    // Allow proceeding even if no elective subjects are chosen, as long as compulsory ones are handled
    // Only check for empty if there were elective subjects available AND no compulsory ones
    if (finalSubjectIds.length === 0 && availableSubjects.filter(s => !compulsorySubjectsForSelectedClass.includes(s.id)).length > 0 && compulsorySubjectsForSelectedClass.length === 0) {
      toast({ title: "Subjects Required", description: "Please select at least one elective subject or ensure compulsory subjects are assigned.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    // Pass array with just the main class ID
    const success = await completeStudentOnboarding(currentUser.uid, [selectedClassId], finalSubjectIds);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Onboarding Complete!", description: "Welcome to Learnify! You're all set.", duration: 5000 });
      router.push('/student/dashboard');
    } else {
      toast({ title: "Onboarding Failed", description: "Could not complete your onboarding. Please try again.", variant: "destructive" });
    }
  };
  
  const pageOverallLoading = authLoading || isLoadingData;

  if (pageOverallLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader message={authLoading ? "Loading user data..." : "Fetching school information..."} size="large" />
      </div>
    );
  }
  
  if (!currentUser || currentUser.role !== 'student') {
    // This case should ideally be handled by ProtectedRoute, but as a fallback.
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Card className="w-full max-w-md shadow-xl text-center card-shadow">
                <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
                <CardContent><p>You must be a student to access this page.</p><Button onClick={() => router.push('/auth/login')} className="mt-4">Go to Login</Button></CardContent>
            </Card>
        </div>
    );
  }
  if (!currentUser.schoolId) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Card className="w-full max-w-md shadow-xl text-center card-shadow">
                <CardHeader>
                    <CardTitle>School Information Missing</CardTitle>
                    <CardDescription>Your account is not yet associated with a school. Please contact your school administrator or ensure you have completed the initial school joining process if applicable.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button onClick={() => router.push('/auth/login')} className="mt-4">Go to Login</Button>
                </CardContent>
            </Card>
        </div>
     );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mb-8 text-center">
        <Logo />
      </div>
      <Card className="w-full max-w-lg shadow-xl card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl flex items-center justify-center">
            <GraduationCap className="mr-2 h-7 w-7 text-primary" /> Welcome to {currentUser.schoolName || 'Learnify'}!
          </CardTitle>
          <CardDescription>Let's get you set up. Please complete these steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center"><ListChecks className="mr-2 h-5 w-5 text-accent"/>Step 1: Select Your Main Class</h3>
              {availableClasses.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No main classes available in your school yet. Please check back later or contact your admin.</p>
              ) : (
                <div>
                  <Label htmlFor="class-select">Choose your main class</Label>
                  <Select onValueChange={handleClassSelectionChange} value={selectedClassId} disabled={isSubmitting}>
                    <SelectTrigger id="class-select" className="w-full">
                      <SelectValue placeholder="Select your main class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name} (Teacher: {cls.teacherDisplayName || 'N/A'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleNextStep} className="w-full button-shadow" disabled={isSubmitting || !selectedClassId || availableClasses.length === 0}>
                Next: Choose Subjects
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-accent"/>Step 2: Select Your Subjects</h3>
              {availableSubjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No subjects defined for your school yet. You can proceed.</p>
              ) : (
                <ScrollArea className="h-60 border rounded-md p-4">
                  <div className="space-y-3">
                    {availableSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`subject-${subject.id}`} 
                          checked={selectedSubjectIds.includes(subject.id) || compulsorySubjectsForSelectedClass.includes(subject.id)}
                          onCheckedChange={() => handleSubjectToggle(subject.id)}
                          disabled={isSubmitting || compulsorySubjectsForSelectedClass.includes(subject.id)}
                        />
                        <Label htmlFor={`subject-${subject.id}`} className={`font-normal ${compulsorySubjectsForSelectedClass.includes(subject.id) ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                          {subject.name} {compulsorySubjectsForSelectedClass.includes(subject.id) && '(Compulsory)'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-1/2" disabled={isSubmitting}>Back</Button>
                <Button onClick={handleCompleteOnboarding} className="w-full sm:w-1/2 button-shadow bg-primary hover:bg-primary/90" disabled={isSubmitting }>
                  {isSubmitting ? <Loader size="small" className="mr-2" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                  Complete Onboarding
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">You can manage your profile details later from your dashboard.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
