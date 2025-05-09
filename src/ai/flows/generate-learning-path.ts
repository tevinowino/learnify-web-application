'use server';

/**
 * @fileOverview A personalized learning path generation AI agent.
 *
 * - generateLearningPath - A function that handles the learning path generation process.
 * - GenerateLearningPathInput - The input type for the generateLearningPath function.
 * - GenerateLearningPathOutput - The return type for the generateLearningPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLearningPathInputSchema = z.object({
  studentPerformance: z
    .string()
    .describe('A description of the student performance in the subject.'),
  teacherContent: z.string().describe('The content provided by the teacher.'),
  studentGoals: z.string().describe('The learning goals of the student.'),
});
export type GenerateLearningPathInput = z.infer<
  typeof GenerateLearningPathInputSchema
>;

const GenerateLearningPathOutputSchema = z.object({
  learningPath: z
    .string()
    .describe('The generated personalized learning path for the student.'),
});
export type GenerateLearningPathOutput = z.infer<
  typeof GenerateLearningPathOutputSchema
>;

export async function generateLearningPath(
  input: GenerateLearningPathInput
): Promise<GenerateLearningPathOutput> {
  return generateLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningPathPrompt',
  input: {schema: GenerateLearningPathInputSchema},
  output: {schema: GenerateLearningPathOutputSchema},
  prompt: `You are an expert learning path generator, specializing in creating personalized learning paths for students based on their performance and teacher's content.

You will use the student's performance, teacher's content, and student's goals to generate a personalized learning path for the student.

Student Performance: {{{studentPerformance}}}
Teacher Content: {{{teacherContent}}}
Student Goals: {{{studentGoals}}}

Generate a personalized learning path for the student:
`,
});

const generateLearningPathFlow = ai.defineFlow(
  {
    name: 'generateLearningPathFlow',
    inputSchema: GenerateLearningPathInputSchema,
    outputSchema: GenerateLearningPathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
