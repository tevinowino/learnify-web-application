
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

interface FinalizeExamPeriodDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  examPeriodName: string;
  allResultsSubmitted: boolean;
  isFinalizing: boolean;
}

export default function FinalizeExamPeriodDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  examPeriodName,
  allResultsSubmitted,
  isFinalizing,
}: FinalizeExamPeriodDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalize Exam Period: {examPeriodName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {!allResultsSubmitted && (
              <div className="flex items-start p-3 my-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Warning: Not all results have been submitted for all assigned classes and subjects. Finalizing now may result in an incomplete record.</span>
              </div>
            )}
            Finalizing this exam period will lock results from further edits by teachers and make them visible to students and parents. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isFinalizing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isFinalizing} className="bg-primary hover:bg-primary/90">
            {isFinalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Finalize Period
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
