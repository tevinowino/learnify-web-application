
'use server';
/**
 * @fileOverview AI flow to analyze student performance based on provided summaries.
 *
 * - analyzeStudentPerformance - A function that generates a performance analysis.
 * - AnalyzeStudentPerformanceInput - The input type for the function.
 * - AnalyzeStudentPerformanceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { AnalyzeStudentPerformanceInput, AnalyzeStudentPerformanceOutput } from '@/types'; // Import from types

const AnalyzeStudentPerformanceInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  examResultsSummary: z.string().describe("A summary of the student's recent exam performance, including subjects and scores/grades. For example: 'Math: 85% (Mid-Term), Science: 72% (Mid-Term), English: 92% (Mid-Term)'."),
  assignmentSummary: z.string().describe("A summary of the student's assignment completion and quality. For example: 'Average assignment score: 80%. Completes 90% of assignments on time. Shows good understanding in practical tasks but struggles with analytical essay questions.'"),
  attendanceSummary: z.string().optional().describe("A summary of the student's attendance record. For example: '95% attendance rate over the last term, with 2 instances of lateness.'"),
  // Future enhancement: could include specific subjects list, teacher comments, or parent concerns.
});

const AnalyzeStudentPerformanceOutputSchema = z.object({
  strengths: z.string().describe("A paragraph identifying the student's key academic strengths based on the provided data. Be specific and positive."),
  weaknesses: z.string().describe("A paragraph identifying areas where the student could improve, based on the provided data. Be constructive and suggest general areas of focus."),
  recommendations: z.string().describe("Actionable recommendations for the student, parents, or teachers to help the student improve. These should be practical suggestions."),
  overallSummary: z.string().describe("A concise overall summary of the student's performance and potential."),
});

// Exporting the Zod schemas for potential use elsewhere if needed, though types.ts is primary
export { AnalyzeStudentPerformanceInputSchema, AnalyzeStudentPerformanceOutputSchema };


export async function analyzeStudentPerformance(
  input: AnalyzeStudentPerformanceInput
): Promise<AnalyzeStudentPerformanceOutput> {
  return analyzeStudentPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStudentPerformancePrompt',
  input: { schema: AnalyzeStudentPerformanceInputSchema },
  output: { schema: AnalyzeStudentPerformanceOutputSchema },
  system: `You are an expert educational analyst. Your role is to provide a comprehensive, balanced, and constructive analysis of a student's academic performance based on the summaries provided. Focus on being encouraging and actionable.`,
  prompt: `Please analyze the performance of {{studentName}}.

Exam Results Summary:
{{{examResultsSummary}}}

Assignment Performance Summary:
{{{assignmentSummary}}}

{{#if attendanceSummary}}
Attendance Summary:
{{{attendanceSummary}}}
{{/if}}

Based on this information, provide:
1.  **Strengths**: Identify key academic strengths.
2.  **Areas for Improvement (Weaknesses)**: Constructively point out areas where the student could improve.
3.  **Actionable Recommendations**: Suggest specific steps or strategies for improvement for the student, and potentially for parents/teachers.
4.  **Overall Summary**: A brief, holistic view of the student's current standing and potential.

Ensure your analysis is balanced, insightful, and uses supportive language.
`,
});

const analyzeStudentPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeStudentPerformanceFlow',
    inputSchema: AnalyzeStudentPerformanceInputSchema,
    outputSchema: AnalyzeStudentPerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI analysis failed to generate an output.");
    }
    return output;
  }
);
