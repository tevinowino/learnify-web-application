
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, BookOpen, UploadCloud, Link as LinkLucideIcon, FileTextIcon, VideoIcon, Trash2, EditIcon as EditLucideIcon, Download } from 'lucide-react'; 
import type { LearningMaterial, LearningMaterialType, ClassWithTeacherInfo, Subject } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Link from 'next/link'; 
import { Label } from '@/components/ui/label';


const materialTypeIcons: Record<LearningMaterialType, React.ReactNode> = {
  text: <FileTextIcon className="h-4 w-4 mr-2" />,
  link: <LinkLucideIcon className="h-4 w-4 mr-2" />,
  pdf_link: <FileTextIcon className="h-4 w-4 mr-2 text-red-500" />, 
  video_link: <VideoIcon className="h-4 w-4 mr-2 text-blue-500" />, 
  pdf_upload: <UploadCloud className="h-4 w-4 mr-2 text-orange-500" />,
};

const materialTypeLabels: Record<LearningMaterialType, string> = {
  text: "Text / Notes",
  link: "General Link",
  pdf_link: "PDF Link",
  video_link: "Video Link",
  pdf_upload: "PDF Upload",
};

const GENERAL_MATERIAL_VALUE = "__GENERAL_MATERIAL__"; 
const NO_SUBJECT_VALUE = "__NO_SUBJECT__"; 

export default function ManageMaterialsPage() {
  const { 
    currentUser, 
    addLearningMaterial, 
    getLearningMaterialsByTeacher, 
    getClassesByTeacher,
    deleteLearningMaterial,
    updateLearningMaterial,
    getSubjectsBySchool, 
    loading: authLoading 
  } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); 
  const [materialType, setMaterialType] = useState<LearningMaterialType>('text');
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  
  const [materials, setMaterials] = useState<LearningMaterial[]>([]); 
  const [teacherClasses, setTeacherClasses] = useState<ClassWithTeacherInfo[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]); 
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMaterialType, setEditMaterialType] = useState<LearningMaterialType>('text');
  const [editSelectedClassId, setEditSelectedClassId] = useState<string | undefined>(undefined);
  const [editSelectedSubjectId, setEditSelectedSubjectId] = useState<string | undefined>(undefined); 
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null); 


  const fetchMaterialsAndClassesAndSubjects = useCallback(async () => { 
    if (currentUser?.uid && currentUser.schoolId) {
      setIsLoadingPage(true);
      const [fetchedMaterials, fetchedClasses, fetchedSubjects] = await Promise.all([ 
        getLearningMaterialsByTeacher(currentUser.uid),
        getClassesByTeacher(currentUser.uid),
        getSubjectsBySchool(currentUser.schoolId) 
      ]);
      setMaterials(fetchedMaterials.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setTeacherClasses(fetchedClasses);
      setSchoolSubjects(fetchedSubjects); 
      setIsLoadingPage(false);
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [currentUser, getLearningMaterialsByTeacher, getClassesByTeacher, getSubjectsBySchool, authLoading]); 

  useEffect(() => {
    fetchMaterialsAndClassesAndSubjects();
  }, [fetchMaterialsAndClassesAndSubjects]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMaterialType('text');
    setSelectedClassId(undefined);
    setSelectedSubjectId(undefined); 
    setSelectedFile(null); 
    const fileInput = document.getElementById('materialFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser?.schoolId || !currentUser?.uid || (materialType !== 'pdf_upload' && !content.trim()) || (materialType === 'pdf_upload' && !selectedFile) ) {
      toast({ title: "Missing Information", description: "Please provide title, content/URL or file, and select a type.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      content: materialType === 'pdf_upload' ? "" : content, // Content is empty for PDF upload, URL is stored in attachmentUrl
      materialType,
      schoolId: currentUser.schoolId,
      teacherId: currentUser.uid,
      classId: selectedClassId,
      subjectId: selectedSubjectId, 
      attachmentUrl: null, // Will be set by AuthContext if file exists
    };

    const materialId = await addLearningMaterial(materialData, selectedFile); // Pass selectedFile to AuthContext
    setIsSubmitting(false);
    if (materialId) {
      toast({ title: "Material Added!", description: `"${title}" has been successfully added.` });
      resetForm();
      fetchMaterialsAndClassesAndSubjects(); 
    } else {
      toast({ title: "Error", description: "Failed to add material. Please try again.", variant: "destructive" });
    }
  };

  const openEditDialog = (material: LearningMaterial) => {
    setEditingMaterial(material);
    setEditTitle(material.title);
    setEditContent(material.materialType !== 'pdf_upload' ? material.content : ''); // Content empty for PDF upload if attachmentUrl is primary
    setEditMaterialType(material.materialType);
    setEditSelectedClassId(material.classId || undefined); 
    setEditSelectedSubjectId(material.subjectId || undefined); 
    setEditSelectedFile(null);
    const editFileInput = document.getElementById('editMaterialFile') as HTMLInputElement;
    if (editFileInput) editFileInput.value = ''; 
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !editTitle.trim() || (editMaterialType !== 'pdf_upload' && !editContent.trim()) || (editMaterialType === 'pdf_upload' && !editSelectedFile && !editingMaterial.attachmentUrl) ) {
       toast({ title: "Missing Information", description: "Title and content/URL/file cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const updatePayload: Partial<Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'schoolId'>> = {
      title: editTitle,
      content: editMaterialType === 'pdf_upload' ? (editingMaterial.content || "") : editContent, // Keep original placeholder or update text/link
      materialType: editMaterialType,
      classId: editSelectedClassId === undefined ? null : editSelectedClassId,
      subjectId: editSelectedSubjectId === undefined ? null : editSelectedSubjectId,
      attachmentUrl: editingMaterial.attachmentUrl, // Will be updated by AuthContext if editSelectedFile exists
    };
    
    const success = await updateLearningMaterial(editingMaterial.id, updatePayload, editSelectedFile); // Pass editSelectedFile
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Material Updated!", description: "Successfully updated."});
      setEditingMaterial(null);
      fetchMaterialsAndClassesAndSubjects();
    } else {
      toast({ title: "Error Updating", description: "Failed to update material.", variant: "destructive"});
    }
  };

  const handleDeleteMaterial = async (materialId: string, materialTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${materialTitle}"?`)) return;
    setIsSubmitting(true); 
    const success = await deleteLearningMaterial(materialId, materialTitle); 
    setIsSubmitting(false);
    if (success) {
      toast({ title: "Material Deleted!", description: `"${materialTitle}" removed.`});
      fetchMaterialsAndClassesAndSubjects();
    } else {
      toast({ title: "Error Deleting", description: "Failed to delete material.", variant: "destructive"});
    }
  };

  const pageOverallLoading = authLoading || isLoadingPage;

  if (pageOverallLoading) {
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
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Manage Learning Materials</h1>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-5 w-5 text-primary" />Add New Material</CardTitle>
          <CardDescription>Create and upload new learning resources for your students. Assign to a class or keep as general material.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitMaterial} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="materialTitle" className="block text-sm font-medium text-foreground mb-1">Title</Label>
                <Input 
                  id="materialTitle" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., Introduction to Algebra" 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="materialType" className="block text-sm font-medium text-foreground mb-1">Type</Label>
                <Select onValueChange={(value) => {setMaterialType(value as LearningMaterialType); setContent(''); setSelectedFile(null);}} value={materialType}>
                  <SelectTrigger id="materialType">
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(materialTypeLabels) as LearningMaterialType[]).map(typeKey => (
                       <SelectItem key={typeKey} value={typeKey}>
                        <div className="flex items-center">
                          {materialTypeIcons[typeKey]}
                          {materialTypeLabels[typeKey]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor={materialType === 'pdf_upload' ? "materialFile" : "materialContent"} className="block text-sm font-medium text-foreground mb-1">
                {materialType === 'text' ? 'Content / Notes' : materialType === 'pdf_upload' ? 'Upload PDF File' : 'URL'}
              </Label>
              {materialType === 'pdf_upload' ? (
                <Input 
                  id="materialFile" 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                  required
                />
              ) : (
                <Textarea 
                  id="materialContent" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder={materialType === 'text' ? "Enter the learning material content here..." : "https://example.com/resource"}
                  rows={materialType === 'text' ? 8 : 3} 
                  required 
                />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="selectedSubjectIdAdd" className="block text-sm font-medium text-foreground mb-1">Subject (Optional)</Label>
                <Select 
                  value={selectedSubjectId ?? NO_SUBJECT_VALUE} 
                  onValueChange={(value) => setSelectedSubjectId(value === NO_SUBJECT_VALUE ? undefined : value)}
                >
                  <SelectTrigger id="selectedSubjectIdAdd"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SUBJECT_VALUE}>No Subject / General</SelectItem>
                    {schoolSubjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectedClassIdAdd" className="block text-sm font-medium text-foreground mb-1">Assign to Class (Optional)</Label>
                <Select 
                  value={selectedClassId ?? GENERAL_MATERIAL_VALUE} 
                  onValueChange={(value) => setSelectedClassId(value === GENERAL_MATERIAL_VALUE ? undefined : value)}
                >
                  <SelectTrigger id="selectedClassIdAdd">
                    <SelectValue placeholder="Select a class or leave general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL_MATERIAL_VALUE}>General Material (No Class)</SelectItem>
                    {teacherClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !title.trim() || (materialType !== 'pdf_upload' && !content.trim()) || (materialType === 'pdf_upload' && !selectedFile)} className="bg-primary hover:bg-primary/90 button-shadow w-full sm:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-4 w-4" /> Add Material
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" />My Uploaded Materials ({materials.length})</CardTitle>
          <CardDescription>List of all materials you have uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No learning materials found. Add some above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map(material => {
                const assignedClass = teacherClasses.find(c => c.id === material.classId);
                const assignedSubject = schoolSubjects.find(s => s.id === material.subjectId); 
                return (
                  <Card key={material.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-grow">
                           <CardTitle className="flex items-center text-lg">
                            {materialTypeIcons[material.materialType]}
                            {material.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Type: {materialTypeLabels[material.materialType]} | 
                            Class: {assignedClass?.name || 'General'} |
                            Subject: {assignedSubject?.name || 'N/A'} 
                            <br />
                            Uploaded {material.createdAt ? formatDistanceToNow(material.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0 self-start sm:self-auto flex-shrink-0">
                           <Button variant="outline" size="sm" onClick={() => openEditDialog(material)} className="button-shadow">
                              <EditLucideIcon className="mr-1 h-3 w-3"/> Edit
                            </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material.id, material.title)} disabled={isSubmitting && editingMaterial?.id !== material.id} className="button-shadow"> {/* Disable only if not current edit */}
                              <Trash2 className="mr-1 h-3 w-3"/> Delete
                           </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {material.materialType === 'text' ? (
                        <p className="text-sm text-muted-foreground line-clamp-3">{material.content}</p>
                      ) : material.materialType === 'pdf_upload' && material.attachmentUrl ? (
                        <Button variant="link" asChild className="p-0 h-auto text-sm">
                            <a href={material.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1 h-4 w-4"/> View Uploaded PDF: {material.content.replace("[Uploaded File: ", "").replace("]", "")}
                            </a>
                        </Button>
                      ) : (material.materialType !== 'pdf_upload' && material.content) ? (
                        <Link href={material.content} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {material.content} <LinkLucideIcon className="inline h-3 w-3 ml-1"/>
                        </Link>
                      ): (
                        <p className="text-sm text-muted-foreground italic">No content or link provided.</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editingMaterial && (
        <Dialog open={!!editingMaterial} onOpenChange={(isOpen) => !isOpen && setEditingMaterial(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Material: {editingMaterial.title}</DialogTitle>
              <DialogDescription>Modify the material details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
               <div className="space-y-2">
                <Label htmlFor="editMaterialTitle" className="block text-sm font-medium">Title</Label>
                <Input id="editMaterialTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaterialType" className="block text-sm font-medium">Type</Label>
                <Select onValueChange={(v) => {setEditMaterialType(v as LearningMaterialType); if (v === 'pdf_upload') setEditContent(''); setEditSelectedFile(null);}} value={editMaterialType}>
                  <SelectTrigger id="editMaterialType">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                     {(Object.keys(materialTypeLabels) as LearningMaterialType[]).map(typeKey => (
                       <SelectItem key={typeKey} value={typeKey}>
                        <div className="flex items-center">
                          {materialTypeIcons[typeKey]}
                          {materialTypeLabels[typeKey]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaterialContent" className="block text-sm font-medium">
                  {editMaterialType === 'text' ? 'Content / Notes' : editMaterialType === 'pdf_upload' ? 'Replace PDF (Optional)' : 'URL'}
                </Label>
                 {editMaterialType === 'pdf_upload' ? (
                    <>
                      {editingMaterial.attachmentUrl && (
                         <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                            Current: <a href={editingMaterial.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{editingMaterial.content.replace("[Uploaded File: ", "").replace("]", "")}</a>
                         </p>
                      )}
                      <Input 
                        id="editMaterialFile" 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setEditSelectedFile(e.target.files ? e.target.files[0] : null)} 
                      />
                      {editSelectedFile && <p className="text-xs text-muted-foreground">New file selected: {editSelectedFile.name}</p>}
                    </>
                  ) : (
                    <Textarea 
                        id="editMaterialContent" 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={editMaterialType === 'text' ? 8 : 3}
                    />
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSelectedSubjectId" className="block text-sm font-medium">Subject (Optional)</Label>
                <Select 
                  value={editSelectedSubjectId ?? NO_SUBJECT_VALUE} 
                  onValueChange={(value) => setEditSelectedSubjectId(value === NO_SUBJECT_VALUE ? undefined : value)}
                >
                  <SelectTrigger id="editSelectedSubjectId"><SelectValue placeholder="Select a subject"/></SelectTrigger>
                  <SelectContent>
                     <SelectItem value={NO_SUBJECT_VALUE}>No Subject / General</SelectItem>
                    {schoolSubjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSelectedClassId" className="block text-sm font-medium">Assign to Class (Optional)</Label>
                <Select 
                  value={editSelectedClassId ?? GENERAL_MATERIAL_VALUE} 
                  onValueChange={(value) => setEditSelectedClassId(value === GENERAL_MATERIAL_VALUE ? undefined : value)}
                >
                  <SelectTrigger id="editSelectedClassId"><SelectValue placeholder="General Material"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL_MATERIAL_VALUE}>General Material (No Class)</SelectItem>
                    {teacherClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleUpdateMaterial} disabled={isSubmitting || !editTitle.trim() || (editMaterialType !== 'pdf_upload' && !editContent.trim()) || (editMaterialType === 'pdf_upload' && !editSelectedFile && !editingMaterial?.attachmentUrl)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
