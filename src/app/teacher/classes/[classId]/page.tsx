
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookCopy, Library, Edit3, PlusCircle, ArrowLeft, Users, Link as LinkIcon, FileTextIcon, VideoIcon } from 'lucide-react';
import type { ClassWithTeacherInfo, LearningMaterial, Assignment, LearningMaterialType, UserProfileWithId } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const materialTypeIcons: Record<LearningMaterialType, React.ReactNode> = {
  text: <FileTextIcon className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
  pdf_link: <FileTextIcon className="h-4 w-4 text-red-500" />,
  video_link: <VideoIcon className="h-4 w-4 text-blue-500" />,
};

export default function TeacherClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { 
    currentUser, 
    getClassDetails, 
    getLearningMaterialsByClass, 
    getAssignmentsByClass,
    getStudentsInClass,
    loading: authLoading 
  } = useAuth();

  const [classDetails, setClassDetails] = useState<ClassWithTeacherInfo | null>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<UserProfileWithId[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchData = useCallback(async () => {
    if (!classId || !currentUser) {
        setIsLoadingPage(false);
        return;
    }
    setIsLoadingPage(true);
    try {
      const [fetchedClassDetails, fetchedMaterials, fetchedAssignments, fetchedStudents] = await Promise.all([
        getClassDetails(classId),
        getLearningMaterialsByClass(classId),
        getAssignmentsByClass(classId),
        getStudentsInClass(classId)
      ]);
      
      if (fetchedClassDetails && fetchedClassDetails.teacherId !== currentUser.uid && currentUser.role !== 'admin') {
        router.push('/teacher/classes');
        toast({title:"Unauthorized", description: "You are not assigned to this class.", variant:"destructive"});
        return;
      }

      setClassDetails(fetchedClassDetails);
      // Sort materials and assignments client-side
      setMaterials(fetchedMaterials.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setAssignments(fetchedAssignments.sort((a,b) => b.deadline.toMillis() - a.deadline.toMillis())); // Sort by deadline desc
      setStudents(fetchedStudents.sort((a,b) => (a.displayName || "").localeCompare(b.displayName || "")));

    } catch (error) {
      console.error("Failed to fetch class data:", error);
      toast({title: "Error", description: "Could not load class data.", variant: "destructive"});
    } finally {
      setIsLoadingPage(false);
    }
  }, [classId, currentUser, getClassDetails, getLearningMaterialsByClass, getAssignmentsByClass, getStudentsInClass, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { toast } = useToast(); 

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
          <CardDescription>The class details could not be loaded or you do not have permission to view it.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/teacher/classes')} className="mb-4 button-shadow">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Classes
      </Button>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-3xl">
            <BookCopy className="mr-3 h-8 w-8 text-primary" /> {classDetails.name}
          </CardTitle>
          <CardDescription>
            Teacher: {classDetails.teacherDisplayName || currentUser?.displayName || 'N/A'} <br/>
            {classDetails.studentIds?.length || 0} student(s) enrolled.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="card-shadow">
        <CardHeader className="flex flex-row justify-between items-center">
          <div >
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Enrolled Students ({students.length})</CardTitle>
            <CardDescription>List of students in this class.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground">No students are currently enrolled in this class.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.displayName}</TableCell>
                    <TableCell>{student.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


      <Card className="card-shadow">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center"><Library className="mr-2 h-5 w-5 text-primary" />Learning Materials ({materials.length})</CardTitle>
            <CardDescription>Resources uploaded for this class.</CardDescription>
          </div>
          <Button asChild className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href={`/teacher/materials?classId=${classId}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Material
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-muted-foreground">No learning materials uploaded for this class yet.</p>
          ) : (
            <div className="space-y-3">
              {materials.map(material => (
                <div key={material.id} className="p-3 border rounded-md hover:bg-muted/50">
                  <h4 className="font-semibold flex items-center">{materialTypeIcons[material.materialType]} {material.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {format(material.createdAt.toDate(), 'PPp')}
                  </p>
                   {material.materialType === 'text' ? (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{material.content}</p>
                      ) : (
                        <Link href={material.content} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all mt-1 block">
                          {material.content} <LinkIcon className="inline h-3 w-3 ml-1"/>
                        </Link>
                      )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader className="flex flex-row justify-between items-center">
           <div>
            <CardTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary" />Assignments ({assignments.length})</CardTitle>
            <CardDescription>Assignments created for this class.</CardDescription>
          </div>
          <Button asChild className="button-shadow">
            <Link href={`/teacher/assignments/create?classId=${classId}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground">No assignments created for this class yet.</p>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{format(assignment.deadline.toDate(), 'PPp')}</TableCell>
                    <TableCell>
                       <Badge variant={ (assignment.totalSubmissions || 0) > 0 ? "default" : "secondary"}>
                        {assignment.totalSubmissions || 0} / {students.length}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/teacher/assignments/${assignment.id}`}>View Details</Link>
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

import { useToast as useOriginalToast } from '@/hooks/use-toast';
function toast(options: { title: string, description?: string, variant?: 'default' | 'destructive' }) {
    const { toast: showToast } = useOriginalToast();
    showToast(options);
}

