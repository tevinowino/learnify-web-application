"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, FolderOpen, Library, Edit3, ArrowLeft, Link as LinkIcon, FileTextIcon, VideoIcon, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import type { ClassWithTeacherInfo, LearningMaterial, AssignmentWithClassAndSubmissionInfo, LearningMaterialType } from '@/types';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const materialTypeIcons: Record<LearningMaterialType, React.ReactNode> = {
  text: <FileTextIcon className="h-4 w-4 mr-2" />,
  link: <LinkIcon className="h-4 w-4 mr-2" />,
  pdf_link: <FileTextIcon className="h-4 w-4 mr-2 text-red-500" />,
  video_link: <VideoIcon className="h-4 w-4 mr-2 text-blue-500" />,
};

export default function StudentClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { toast } = useToast();

  const { 
    currentUser, 
    getClassDetails, 
    getLearningMaterialsByClass, 
    getAssignmentsForStudentByClass,
    loading: authLoading 
  } = useAuth();

  const [classDetails, setClassDetails] = useState<ClassWithTeacherInfo | null>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchData = useCallback(async () => {
    if (!classId || !currentUser?.uid) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const [fetchedClassDetails, fetchedMaterials, fetchedAssignments] = await Promise.all([
        getClassDetails(classId),
        getLearningMaterialsByClass(classId),
        getAssignmentsForStudentByClass(classId, currentUser.uid)
      ]);
      
      // Ensure student is actually enrolled or authorized
      if (!currentUser.classIds?.includes(classId) || !fetchedClassDetails) {
        toast({ title: "Unauthorized", description: "You are not enrolled in this class.", variant: "destructive" });
        router.push('/student/classes');
        return;
      }

      setClassDetails(fetchedClassDetails);
      setMaterials(fetchedMaterials.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setAssignments(fetchedAssignments); // Already sorted by deadline in AuthContext

    } catch (error) {
      console.error("Failed to fetch class data:", error);
      toast({ title: "Error", description: "Could not load class details.", variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [classId, currentUser, getClassDetails, getLearningMaterialsByClass, getAssignmentsForStudentByClass, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late') => {
    switch(status) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckSquare className="mr-1 h-3 w-3"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3"/>Late</Badge>;
        case 'missing': return <Badge variant="outline">Missing</Badge>;
        default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!classDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/student/classes')} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to My Classes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/student/classes')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Classes
      </Button>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-3xl">
            <FolderOpen className="mr-3 h-8 w-8 text-primary" /> {classDetails.name}
          </CardTitle>
          <CardDescription>
            Teacher: {classDetails.teacherDisplayName || 'N/A'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Learning Materials Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Library className="mr-2 h-5 w-5 text-primary" />Learning Materials ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-muted-foreground">No learning materials uploaded for this class yet.</p>
          ) : (
            <div className="space-y-3">
              {materials.map(material => (
                <Card key={material.id} className="p-4 hover:bg-muted/50">
                  <h4 className="font-semibold flex items-center">{materialTypeIcons[material.materialType]} {material.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {material.createdAt ? formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                  </p>
                   {material.materialType === 'text' ? (
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{material.content}</p>
                      // TODO: Add a "View Full Text" button/modal
                    ) : (
                      <Button variant="link" asChild className="px-0 h-auto mt-1">
                        <a href={material.content} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {material.content} <LinkIcon className="inline h-3 w-3 ml-1"/>
                        </a>
                      </Button>
                    )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary" />Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground">No assignments for this class yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map(assignment => (
                <Card key={assignment.id} className="p-4 hover:bg-muted/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/student/assignments/${assignment.id}`} className="hover:underline">
                                <h4 className="font-semibold text-lg">{assignment.title}</h4>
                            </Link>
                            <p className="text-xs text-muted-foreground">
                                Due: {format(assignment.deadline.toDate(), 'PPp')}
                            </p>
                        </div>
                        {getStatusBadge(assignment.submissionStatus)}
                    </div>
                     <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                    {assignment.submissionGrade && <p className="text-sm mt-1">Grade: <span className="font-semibold">{assignment.submissionGrade}</span></p>}
                     <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link href={`/student/assignments/${assignment.id}`}>
                            {assignment.submissionStatus === 'missing' ? 'Submit' : 'View Details'}
                        </Link>
                     </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
