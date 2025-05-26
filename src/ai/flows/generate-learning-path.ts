
'use server';

/**
 * @fileOverview A personalized learning path generation AI agent for students.
 *
 * - generateLearningPath - A function that handles the learning path generation process.
 * - GenerateLearningPathInput - The input type for the generateLearningPath function.
 * - GenerateLearningPathOutput - The return type for the generateLearningPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLearningPathInputSchema = z.object({
  selectedSubject: z.string().describe('The subject the student wants a learning path for.'),
  currentUnderstanding: z
    .string()
    .describe("A description of the student's current understanding, strengths, or challenges in the subject."),
  studentGoals: z.string().describe('The specific learning goals of the student for this subject.'),
  teacherContent: z.string().optional().describe('Optional: Any specific content, curriculum overview, or topics provided by the teacher, if available. This can help tailor the path further.'),
});
export type GenerateLearningPathInput = z.infer<
  typeof GenerateLearningPathInputSchema
>;

const GenerateLearningPathOutputSchema = z.object({
  learningPath: z
    .string()
    .describe('The generated personalized learning path for the student. This should be a step-by-step guide with suggested topics, resources, and activities. Format it clearly, possibly using markdown-like structures (e.g., headings, bullet points).'),
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
  prompt: `You are an expert AI learning assistant. Your task is to generate a personalized learning path for a student based on the information they provide.

Subject: {{{selectedSubject}}}
Student's Current Understanding/Challenges: {{{currentUnderstanding}}}
Student's Learning Goals: {{{studentGoals}}}
{{#if teacherContent}}
Additional Context (e.g., Teacher's Curriculum Overview or Specific Topics): {{{teacherContent}}}
{{/if}}

Based on this information, create a clear, actionable, and personalized learning path.
The path should:
1.  Identify key concepts the student needs to focus on.
2.  Break down complex topics into smaller, manageable steps.
3.  Suggest a logical order for learning these topics.
4.  Recommend types of resources or activities for each step (e.g., "Read chapter X," "Watch a video on Y," "Practice Z exercises," "Review notes on A").
5.  Be encouraging and motivating.
6.  Structure the output clearly, perhaps using headings for sections and bullet points for steps or resources.

Generate the personalized learning path:
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

