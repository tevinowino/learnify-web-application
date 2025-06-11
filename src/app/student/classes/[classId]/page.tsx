
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FolderOpen, Library, Edit3, ArrowLeft, Link as LinkIcon, FileTextIcon, VideoIcon, CheckSquare, Clock, AlertTriangle, Download } from 'lucide-react';
import type { ClassWithTeacherInfo, LearningMaterial, AssignmentWithClassAndSubmissionInfo, LearningMaterialType, UserProfileWithId, Subject, LearningMaterialWithTeacherInfo as EnrichedMaterial } from '@/types';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Loader from '@/components/shared/Loader'; // Import new Loader

const materialTypeIcons: Record<LearningMaterialType, React.ReactNode> = {
  text: <FileTextIcon className="h-4 w-4 mr-2" />,
  link: <LinkIcon className="h-4 w-4 mr-2" />,
  pdf_link: <FileTextIcon className="h-4 w-4 mr-2 text-red-500" />,
  video_link: <VideoIcon className="h-4 w-4 mr-2 text-blue-500" />,
  pdf_upload: <Download className="h-4 w-4 mr-2 text-orange-500" />,
};

export default function StudentClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const classId = params.classId;
  const { toast } = useToast();

  const { 
    currentUser, 
    getClassDetails, 
    getLearningMaterialsByClass, 
    getAssignmentsForStudentByClass,
    getSubjectById, 
    loading: authLoading 
  } = useAuth();

  const [classDetails, setClassDetails] = useState<ClassWithTeacherInfo | null>(null);
  const [materials, setMaterials] = useState<EnrichedMaterial[]>([]); 
  const [assignments, setAssignments] = useState<AssignmentWithClassAndSubmissionInfo[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchData = useCallback(async () => {
    if (!classId || !currentUser?.uid) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    try {
      const [fetchedClassDetails, fetchedMaterialsRaw, fetchedAssignmentsRaw] = await Promise.all([
        getClassDetails(classId),
        getLearningMaterialsByClass(classId),
        getAssignmentsForStudentByClass(classId, currentUser.uid)
      ]);
      
      if (!currentUser.classIds?.includes(classId) || !fetchedClassDetails) {
        toast({ title: "Unauthorized", description: "You are not enrolled in this class.", variant: "destructive" });
        router.push('/student/classes');
        return;
      }

      setClassDetails(fetchedClassDetails);

      const enrichedMaterials = await Promise.all(fetchedMaterialsRaw.map(async m => {
        let subjectName = 'N/A';
        if (m.subjectId && getSubjectById) {
          const subject = await getSubjectById(m.subjectId);
          subjectName = subject?.name || 'N/A';
        }
        return {...m, subjectName};
      }));
      setMaterials(enrichedMaterials.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      
      const enrichedAssignments = await Promise.all(fetchedAssignmentsRaw.map(async a => {
        let subjectName = 'N/A';
        if (a.subjectId && getSubjectById) {
            const subject = await getSubjectById(a.subjectId);
            subjectName = subject?.name || 'N/A';
        }
        return {...a, subjectName};
      }));
      setAssignments(enrichedAssignments);

    } catch (error) {
      console.error("Failed to fetch class data:", error);
      toast({ title: "Error", description: "Could not load class details.", variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [classId, currentUser, getClassDetails, getLearningMaterialsByClass, getAssignmentsForStudentByClass, getSubjectById, router, toast]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status?: 'submitted' | 'graded' | 'missing' | 'late') => {
    switch(status) {
        case 'graded': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckSquare className="mr-1 h-3 w-3"/>Graded</Badge>;
        case 'submitted': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'late': return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3"/>Late</Badge>;
        case 'missing': default: return <Badge variant="outline">Missing</Badge>;
    }
  };

  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading class details..." size="large" />
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
            {classDetails.classType === 'subject_based' && classDetails.subjectName && ` | Subject: ${classDetails.subjectName}`}
          </CardDescription>
        </CardHeader>
      </Card>

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
                    Subject: {material.subjectName || 'N/A'} | 
                    Uploaded {material.createdAt ? formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                  </p>
                   {material.materialType === 'text' ? (
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{material.content}</p>
                    ) : material.materialType === 'pdf_upload' && material.attachmentUrl ? (
                        <Button variant="link" asChild className="p-0 h-auto mt-1 text-sm">
                            <a href={material.attachmentUrl} target="_blank" rel="noopener noreferrer" download={material.content.replace("[Uploaded File: ", "").replace("]", "")}>
                                <Download className="inline h-4 w-4 mr-1 text-orange-500"/> 
                                {material.content.replace("[Uploaded File: ", "").replace("]", "")}
                            </a>
                        </Button>
                    ) : (material.content) ? ( 
                      <Button variant="link" asChild className="p-0 h-auto mt-1">
                        <a href={material.content} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all line-clamp-3">
                          {material.content} <LinkIcon className="inline h-3 w-3 ml-1"/>
                        </a>
                      </Button>
                    ) : <p className="text-sm text-muted-foreground italic mt-1">No content or link provided.</p>}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary" />Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground">No assignments for this class yet.</p>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.subjectName || 'N/A'}</TableCell>
                    <TableCell>{format(assignment.deadline.toDate(), 'PPp')}</TableCell>
                    <TableCell>{getStatusBadge(assignment.submissionStatus)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" asChild className="button-shadow">
                          <Link href={`/student/assignments/${assignment.id}`}>
                             {assignment.submissionStatus === 'missing' ? 'Submit / View' : 'View Details'}
                          </Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
