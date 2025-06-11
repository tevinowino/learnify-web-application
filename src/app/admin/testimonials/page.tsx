
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle, XCircle, MessageSquare, Users } from 'lucide-react';
import type { Testimonial } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function AdminTestimonialsPage() {
  const { currentUser, getAllTestimonialsForAdmin, updateTestimonialApproval, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Store ID of testimonial being processed

  const fetchTestimonials = useCallback(async () => {
    if (currentUser?.email === 'learnifyke@gmail.com') {
      setIsLoadingTestimonials(true);
      const fetchedTestimonials = await getAllTestimonialsForAdmin();
      setTestimonials(fetchedTestimonials);
      setIsLoadingTestimonials(false);
    } else {
      setTestimonials([]);
      setIsLoadingTestimonials(false);
    }
  }, [currentUser, getAllTestimonialsForAdmin]);

  useEffect(() => {
    if (!authLoading) {
      fetchTestimonials();
    }
  }, [authLoading, fetchTestimonials]);

  const handleApprovalToggle = async (testimonialId: string, currentApprovalStatus: boolean) => {
    setIsProcessing(testimonialId);
    const success = await updateTestimonialApproval(testimonialId, !currentApprovalStatus);
    if (success) {
      toast({ title: `Testimonial ${!currentApprovalStatus ? 'Approved' : 'Unapproved'}`, description: "Status updated successfully." });
      fetchTestimonials(); // Refresh the list
    } else {
      toast({ title: "Error", description: "Failed to update testimonial status.", variant: "destructive" });
    }
    setIsProcessing(null);
  };

  const renderRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
    ));
  };

  const pageLoading = authLoading || isLoadingTestimonials;

  if (pageLoading && testimonials.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader message="Loading testimonials..." size="large" />
      </div>
    );
  }

  if (currentUser?.email !== 'learnifyke@gmail.com' && !authLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You are not authorized to manage testimonials.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Manage Testimonials</h1>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary" />User Feedback ({testimonials.length})</CardTitle>
          <CardDescription>Review submitted testimonials and approve them for display on the landing page.</CardDescription>
        </CardHeader>
        <CardContent>
          {testimonials.length === 0 && !pageLoading ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No testimonials submitted yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-[70vh]">
              <div className="space-y-4 pr-3">
                {testimonials.map(testimonial => (
                  <Card key={testimonial.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h4 className="font-semibold">{testimonial.userName} <Badge variant="outline" className="ml-2 text-xs">{testimonial.userRole}</Badge></h4>
                        {testimonial.schoolName && <p className="text-xs text-muted-foreground">School: {testimonial.schoolName}</p>}
                        <div className="flex items-center my-1">
                          {renderRatingStars(testimonial.rating)}
                          <span className="ml-2 text-xs text-muted-foreground">({testimonial.rating}/5)</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic mt-1 whitespace-pre-wrap">"{testimonial.feedbackText}"</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted: {formatDistanceToNow(testimonial.submittedAt.toDate(), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 ml-4 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                          <Button
                            variant={testimonial.isApprovedForDisplay ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleApprovalToggle(testimonial.id, testimonial.isApprovedForDisplay)}
                            disabled={isProcessing === testimonial.id}
                            className="button-shadow"
                          >
                            {isProcessing === testimonial.id ? <Loader size="small" /> : 
                              testimonial.isApprovedForDisplay ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />
                            }
                            {testimonial.isApprovedForDisplay ? 'Unapprove' : 'Approve'}
                          </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{testimonial.isApprovedForDisplay ? 'Remove from landing page' : 'Approve for landing page'}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                     <Badge variant={testimonial.isApprovedForDisplay ? "default" : "secondary"} className={`mt-2 text-xs ${testimonial.isApprovedForDisplay ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                        {testimonial.isApprovedForDisplay ? 'Approved for Display' : 'Pending Approval'}
                      </Badge>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
