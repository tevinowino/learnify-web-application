
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth has getApprovedTestimonials
import type { Testimonial } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

const TestimonialSkeleton = () => (
  <Card className="card-shadow">
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
      </div>
    </CardContent>
  </Card>
);


export default function TestimonialsSection() {
  const { getApprovedTestimonials, loading: authProviderLoading } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    try {
      const approvedTestimonials = await getApprovedTestimonials(3); // Fetch top 3 approved
      setTestimonials(approvedTestimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      // Optionally set an error state or show a toast
    } finally {
      setIsLoading(false);
    }
  }, [getApprovedTestimonials]);

  useEffect(() => {
    // Only fetch if getApprovedTestimonials is available (i.e., AuthProvider has loaded)
    if (!authProviderLoading && getApprovedTestimonials) {
      fetchTestimonials();
    }
  }, [authProviderLoading, getApprovedTestimonials, fetchTestimonials]);

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Testimonials</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Join Schools Who Have Already Transformed Their Education with Learnify</h2>
        </div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TestimonialSkeleton />
            <TestimonialSkeleton />
            <TestimonialSkeleton />
          </div>
        ) : testimonials.length === 0 ? (
           <div className="text-center text-muted-foreground py-8">
            <Quote className="mx-auto h-12 w-12 text-primary/30 mb-2" />
            <p>No testimonials available yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="card-shadow">
                <CardContent className="p-6 space-y-4">
                  <Quote className="h-8 w-8 text-primary/50" />
                  <p className="text-muted-foreground italic">"{testimonial.feedbackText}"</p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {/* Assuming user might not have a photoURL in their testimonial data directly */}
                      <AvatarImage src={undefined} alt={testimonial.userName} /> 
                      <AvatarFallback>{testimonial.userName ? testimonial.userName.charAt(0).toUpperCase() : <UserCircle/>}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.userName}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.userRole} {testimonial.schoolName && `at ${testimonial.schoolName}`}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

