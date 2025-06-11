
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Star, Send, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import Loader from './Loader';

interface TestimonialPromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export default function TestimonialPromptDialog({ isOpen, onOpenChange, user }: TestimonialPromptDialogProps) {
  const { addTestimonial, updateUserLastTestimonialSurveyAt } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (rating === 0) {
      toast({ title: "Rating Required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }
    if (!feedbackText.trim()) {
      toast({ title: "Feedback Required", description: "Please enter your feedback.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const testimonialData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous User',
      userRole: user.role || 'user', // Adjust if role isn't always present on user object
      schoolId: user.schoolId,
      schoolName: user.schoolName,
      rating,
      feedbackText,
    };

    const success = await addTestimonial(testimonialData);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Thank You!", description: "Your feedback has been submitted." });
      await updateUserLastTestimonialSurveyAt(user.uid); // Update timestamp on successful submission
      onOpenChange(false);
      resetForm();
    } else {
      toast({ title: "Submission Failed", description: "Could not submit your feedback. Please try again.", variant: "destructive" });
    }
  };

  const handleDismiss = async () => {
    if (user) {
        await updateUserLastTestimonialSurveyAt(user.uid); // Update timestamp even on dismiss
    }
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setFeedbackText('');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Feedback!</DialogTitle>
          <DialogDescription>
            We'd love to hear about your experience with Learnify. Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Your Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-7 w-7 cursor-pointer transition-colors
                    ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300'}
                  `}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleStarClick(star)}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="feedbackText" className="block text-sm font-medium text-foreground mb-1">Your Feedback</label>
            <Textarea
              id="feedbackText"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what you think..."
              rows={5}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
           <Button variant="outline" onClick={handleDismiss} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" /> Maybe Later
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0 || !feedbackText.trim()} className="button-shadow">
            {isSubmitting ? <Loader size="small" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
