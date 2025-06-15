'use server';
/**
 * @fileOverview AI flow to generate a simple analysis for a student's report card.
 *
 * - generateReportCardAnalysis - A function that generates the report card analysis.
 * - ReportCardAnalysisInput - The input type for the function.
 * - ReportCardAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for individual subject result entry
const SubjectResultSchema = z.object({
  subjectName: z.string().describe("The name of the subject."),
  marks: z.string().describe("The marks or grade obtained by the student in the subject. E.g., '85%', 'A+'."),
  remarks: z.string().optional().describe("Teacher's remarks for the subject, if any."),
});

const ReportCardAnalysisInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  examPeriodName: z.string().describe("The name of the exam period. E.g., 'Mid-Term Exams Fall 2024'."),
  results: z.array(SubjectResultSchema).min(1, "At least one subject result is required.")
    .describe("An array of the student's results for this exam period."),
});
export type ReportCardAnalysisInput = z.infer<typeof ReportCardAnalysisInputSchema>;

const ReportCardAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A concise, positive, and constructive AI-generated overview of the student's performance based on the provided results. Highlight strengths and suggest general areas for focus. Maximum 2-3 sentences."),
});
export type ReportCardAnalysisOutput = z.infer<typeof ReportCardAnalysisOutputSchema>;

export async function generateReportCardAnalysis(
  input: ReportCardAnalysisInput
): Promise<ReportCardAnalysisOutput> {
  return generateReportCardAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportCardAnalysisPrompt',
  input: { schema: ReportCardAnalysisInputSchema },
  output: { schema: ReportCardAnalysisOutputSchema },
  system: `You are an encouraging AI assistant helping to summarize student performance for a report card. Provide a brief (2-3 sentences) overview. Be positive and constructive.`,
  prompt: `Student: {{studentName}}
Exam Period: {{examPeriodName}}
Results:
{{#each results}}
- Subject: {{this.subjectName}}, Marks: {{this.marks}}{{#if this.remarks}}, Remarks: "{{this.remarks}}"{{/if}}
{{/each}}

Please provide a concise (2-3 sentences) and encouraging performance overview. Highlight one key strength and one area for potential focus.
Example: "Overall, {{studentName}} has shown commendable effort in the {{examPeriodName}}. They particularly excelled in [Strongest Subject/Area based on marks/remarks]. Continued focus on [Subject with lower marks/area mentioned in remarks] could further enhance their performance."
Or if all results are good: "{{studentName}} demonstrated excellent performance in the {{examPeriodName}}, with strong results across all subjects. Keep up the great work!"
If results are mixed: "{{studentName}} put in good effort during the {{examPeriodName}}. They showed particular strength in [Subject] and can continue to build on their understanding in [another subject area]."
`,
});

const generateReportCardAnalysisFlow = ai.defineFlow(
  {
    name: 'generateReportCardAnalysisFlow',
    inputSchema: ReportCardAnalysisInputSchema,
    outputSchema: ReportCardAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI analysis failed to generate an output for the report card.");
    }
    return output;
  }
);
