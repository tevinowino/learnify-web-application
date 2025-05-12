'use server';
/**
 * @fileOverview Mwalimu, an AI assistant for teachers.
 *
 * - processTeacherMessage - A function that handles Mwalimu's chat responses.
 * - MwalimuChatInput - The input type for the processTeacherMessage function.
 * - MwalimuChatOutput - The return type for the processTeacherMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MwalimuChatInputSchema = z.object({
  teacherMessage: z.string().describe('The message from the teacher to Mwalimu.'),
  // Optional: Add conversation history if needed for more context later
  // history: z.array(z.object({ role: z.enum(['user', 'model']), parts: z.array(z.object({ text: z.string() })) })).optional(),
});
export type MwalimuChatInput = z.infer<typeof MwalimuChatInputSchema>;

const MwalimuChatOutputSchema = z.object({
  mwalimuResponse: z.string().describe("Mwalimu's response to the teacher."),
});
export type MwalimuChatOutput = z.infer<typeof MwalimuChatOutputSchema>;

export async function processTeacherMessage(input: MwalimuChatInput): Promise<MwalimuChatOutput> {
  return mwalimuChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mwalimuChatPrompt',
  input: {schema: MwalimuChatInputSchema},
  output: {schema: MwalimuChatOutputSchema},
  system: `You are Mwalimu, an AI assistant for teachers. You can help with planning class notes, summarizing learning materials, and creating lesson plans based on topics. Provide structured and actionable responses. When asked to plan notes or lessons, provide a clear outline or structure. When summarizing, extract key points.`,
  prompt: `Teacher's request: {{{teacherMessage}}}

Provide a helpful and detailed response to assist the teacher with their task.`,
});

const mwalimuChatFlow = ai.defineFlow(
  {
    name: 'mwalimuChatFlow',
    inputSchema: MwalimuChatInputSchema,
    outputSchema: MwalimuChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({ teacherMessage: input.teacherMessage });
    return output!;
  }
);
