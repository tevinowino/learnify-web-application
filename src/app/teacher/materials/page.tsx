
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, BookOpen, UploadCloud } from 'lucide-react';
import type { LearningMaterial } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ManageMaterialsPage() {
  const { currentUser, addLearningMaterial, getLearningMaterialsBySchool, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (currentUser?.schoolId) {
        setIsLoading(true);
        const schoolMaterials = await getLearningMaterialsBySchool(currentUser.schoolId);
        setMaterials(schoolMaterials);
        setIsLoading(false);
      } else if (!authLoading) {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchMaterials();
    }
  }, [currentUser, getLearningMaterialsBySchool, authLoading]);

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser?.schoolId || !currentUser?.uid) {
      toast({ title: "Missing Information", description: "Please provide a title and content for the material.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const materialData = {
      title,
      content,
      schoolId: currentUser.schoolId,
      teacherId: currentUser.uid,
    };
    const materialId = await addLearningMaterial(materialData);
    setIsSubmitting(false);
    if (materialId) {
      toast({ title: "Material Added!", description: `"${title}" has been successfully added.` });
      setTitle('');
      setContent('');
      // Refresh materials list
      const schoolMaterials = await getLearningMaterialsBySchool(currentUser.schoolId);
      setMaterials(schoolMaterials);
    } else {
      toast({ title: "Error", description: "Failed to add material. Please try again.", variant: "destructive" });
    }
  };

  const pageLoading = authLoading || isLoading;

  if (pageLoading) {
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
            You need to be part of a school to manage materials.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Learning Materials</h1>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-5 w-5 text-primary" />Add New Material</CardTitle>
          <CardDescription>Create and upload new learning resources for your students.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitMaterial} className="space-y-4">
            <div>
              <label htmlFor="materialTitle" className="block text-sm font-medium text-foreground mb-1">Title</label>
              <Input 
                id="materialTitle" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Introduction to Algebra" 
                required 
              />
            </div>
            <div>
              <label htmlFor="materialContent" className="block text-sm font-medium text-foreground mb-1">Content</label>
              <Textarea 
                id="materialContent" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Enter the learning material content here. You can use Markdown." 
                rows={8} 
                required 
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()} className="bg-primary hover:bg-primary/90 button-shadow">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-4 w-4" /> Add Material
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" />Existing Materials</CardTitle>
          <CardDescription>List of materials available in your school.</CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No learning materials found. Add some above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map(material => (
                <Card key={material.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle>{material.title}</CardTitle>
                    <CardDescription>
                      Uploaded {material.createdAt ? formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{material.content}</p>
                    {/* Add view/edit/delete buttons later */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
