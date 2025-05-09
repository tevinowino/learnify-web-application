
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Search } from 'lucide-react';
import type { LearningMaterial } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input'; // For search
import { Button } from '@/components/ui/button';

export default function StudentResourcesPage() {
  const { currentUser, getLearningMaterialsBySchool, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMaterials = async () => {
      if (currentUser?.schoolId) {
        setIsLoading(true);
        const schoolMaterials = await getLearningMaterialsBySchool(currentUser.schoolId);
        setMaterials(schoolMaterials);
        setFilteredMaterials(schoolMaterials);
        setIsLoading(false);
      } else if (!authLoading) {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchMaterials();
    }
  }, [currentUser, getLearningMaterialsBySchool, authLoading]);

  useEffect(() => {
    const results = materials.filter(material =>
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaterials(results);
  }, [searchTerm, materials]);

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
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resources..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredMaterials.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm ? 'No resources match your search.' : 'No learning materials available in your school yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map(material => (
            <Card key={material.id} className="card-shadow hover:border-primary transition-colors flex flex-col">
              <CardHeader>
                <CardTitle>{material.title}</CardTitle>
                <CardDescription>
                  Uploaded {material.createdAt ? formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-4">{material.content}</p>
              </CardContent>
              <CardContent className="pt-0">
                 <Button variant="link" className="px-0">View Full Material</Button> {/* Placeholder for future view functionality */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
