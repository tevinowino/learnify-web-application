
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Search, Link as LinkIcon, FileTextIcon, VideoIcon, Filter } from 'lucide-react';
import type { LearningMaterial, LearningMaterialWithTeacherInfo, LearningMaterialType, Subject } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const materialTypeIcons: Record<LearningMaterialType, React.ReactNode> = {
  text: <FileTextIcon className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
  pdf_link: <FileTextIcon className="h-4 w-4 text-red-500" />, 
  video_link: <VideoIcon className="h-4 w-4 text-blue-500" />,
  pdf_upload: <FileTextIcon className="h-4 w-4 text-orange-500" />,
};

export default function StudentResourcesPage() {
  const { currentUser, getLearningMaterialsBySchool, getSubjectsBySchool, getSubjectById, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<LearningMaterialWithTeacherInfo[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<LearningMaterialWithTeacherInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]); // Added
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all'); // Added

  const fetchMaterialsAndSubjects = useCallback(async () => { // Renamed
    if (currentUser?.schoolId) {
      setIsLoading(true);
      const [schoolMaterials, subjects] = await Promise.all([ // Fetch subjects
        getLearningMaterialsBySchool(currentUser.schoolId),
        getSubjectsBySchool(currentUser.schoolId)
      ]);
      
      // Enrich materials with subjectName client-side if needed
      const enrichedMaterials = await Promise.all(schoolMaterials.map(async (material) => {
        let subjectName = 'N/A';
        if (material.subjectId && getSubjectById) {
          const subject = await getSubjectById(material.subjectId);
          subjectName = subject?.name || 'N/A';
        }
        return { ...material, subjectName };
      }));

      const sortedMaterials = enrichedMaterials.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setMaterials(sortedMaterials);
      setFilteredMaterials(sortedMaterials);
      setSchoolSubjects(subjects); // Set subjects
      setIsLoading(false);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [currentUser, getLearningMaterialsBySchool, getSubjectsBySchool, getSubjectById, authLoading]); // Added getSubjectsBySchool

  useEffect(() => {
    if (currentUser) {
      fetchMaterialsAndSubjects();
    }
  }, [currentUser, fetchMaterialsAndSubjects]);

  useEffect(() => {
    let results = materials.filter(material =>
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.className && material.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.teacherDisplayName && material.teacherDisplayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.subjectName && material.subjectName.toLowerCase().includes(searchTerm.toLowerCase())) || // Added subjectName search
      material.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (selectedSubjectFilter !== 'all') { // Added subject filter logic
      results = results.filter(material => material.subjectId === selectedSubjectFilter);
    }
    setFilteredMaterials(results);
  }, [searchTerm, selectedSubjectFilter, materials]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser?.schoolId) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>School Not Assigned</CardTitle>
          <CardDescription>
            You need to be part of a school to view resources.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Learning Resources</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto md:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Select onValueChange={setSelectedSubjectFilter} value={selectedSubjectFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4 inline-block" />
                    <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {schoolSubjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {filteredMaterials.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm || selectedSubjectFilter !== 'all' ? 'No resources match your search or filter.' : 'No learning materials available yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map(material => (
            <Card key={material.id} className="card-shadow hover:border-primary transition-colors flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                    {materialTypeIcons[material.materialType]}
                    {material.title}
                </CardTitle>
                <CardDescription>
                  Class: {material.className || 'General'} | Teacher: {material.teacherDisplayName || 'N/A'} <br/>
                  Subject: {material.subjectName || 'N/A'} <br/> {/* Display subject */}
                  Uploaded {material.createdAt ? formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {material.materialType === 'text' ? (
                    <p className="text-sm text-muted-foreground line-clamp-4">{material.content}</p>
                ) : material.materialType === 'pdf_upload' ? (
                  <p className="text-sm text-primary hover:underline break-all line-clamp-3">
                    <FileTextIcon className="inline h-4 w-4 mr-1 text-orange-500"/> 
                    {/* Assuming content is placeholder for uploaded PDF, actual link/download would be here */}
                    {material.content} (View PDF)
                  </p>
                ) : (
                    <Link href={material.content} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all line-clamp-3">
                        {material.content}
                    </Link>
                )}
              </CardContent>
              <CardContent className="pt-0">
                 {material.materialType !== 'text' && material.materialType !== 'pdf_upload' && (
                     <Button variant="outline" size="sm" asChild className="w-full button-shadow">
                        <Link href={material.content} target="_blank" rel="noopener noreferrer">
                            Open Link <LinkIcon className="ml-2 h-4 w-4"/>
                        </Link>
                     </Button>
                 )}
                  {material.materialType === 'text' && (
                     <Button variant="outline" size="sm" className="w-full button-shadow" onClick={() => alert("Full text view coming soon!")}>
                        View Full Text
                     </Button>
                 )}
                  {material.materialType === 'pdf_upload' && (
                     <Button variant="outline" size="sm" className="w-full button-shadow" onClick={() => alert("PDF download/view coming soon for: " + material.content)}>
                        View PDF
                     </Button>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

