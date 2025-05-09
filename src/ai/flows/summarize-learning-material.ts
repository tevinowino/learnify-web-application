'use server';
/**
 * @fileOverview Summarizes learning material provided by a student.
 *
 * - summarizeLearningMaterial - A function that summarizes the learning material.
 * - SummarizeLearningMaterialInput - The input type for the summarizeLearningMaterial function.
 * - SummarizeLearningMaterialOutput - The return type for the summarizeLearningMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLearningMaterialInputSchema = z.object({
  learningMaterial: z
    .string()
    .describe('The learning material to be summarized. This could be text, a URL, or any other form of content.'),
});
export type SummarizeLearningMaterialInput = z.infer<typeof SummarizeLearningMaterialInputSchema>;

const SummarizeLearningMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the learning material.'),
});
export type SummarizeLearningMaterialOutput = z.infer<typeof SummarizeLearningMaterialOutputSchema>;

export async function summarizeLearningMaterial(
  input: SummarizeLearningMaterialInput
): Promise<SummarizeLearningMaterialOutput> {
  return summarizeLearningMaterialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLearningMaterialPrompt',
  input: {schema: SummarizeLearningMaterialInputSchema},
  output: {schema: SummarizeLearningMaterialOutputSchema},
  prompt: `Summarize the following learning material so that a student can quickly understand the key concepts:\n\n{{{learningMaterial}}}`,
});

const summarizeLearningMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeLearningMaterialFlow',
    inputSchema: SummarizeLearningMaterialInputSchema,
    outputSchema: SummarizeLearningMaterialOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
