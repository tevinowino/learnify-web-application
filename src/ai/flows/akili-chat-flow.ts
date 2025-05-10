'use server';
/**
 * @fileOverview Akili, a smart study companion and tutor chatbot for students.
 *
 * - akiliChatFlow - A function that handles Akili's chat responses.
 * - AkiliChatInput - The input type for the akiliChatFlow function.
 * - AkiliChatOutput - The return type for the akiliChatFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AkiliChatInputSchema = z.object({
  studentMessage: z.string().describe('The message from the student to Akili.'),
  // Optional: Add conversation history if needed for more context later
  // history: z.array(z.object({ role: z.enum(['user', 'model']), parts: z.array(z.object({ text: z.string() })) })).optional(),
});
export type AkiliChatInput = z.infer<typeof AkiliChatInputSchema>;

const AkiliChatOutputSchema = z.object({
  akiliResponse: z.string().describe("Akili's response to the student."),
});
export type AkiliChatOutput = z.infer<typeof AkiliChatOutputSchema>;

export async function processStudentMessage(input: AkiliChatInput): Promise<AkiliChatOutput> {
  return akiliChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'akiliChatPrompt',
  input: {schema: AkiliChatInputSchema},
  output: {schema: AkiliChatOutputSchema},
  system: `You are Akili, a smart and friendly AI tutor designed to help students. Explain concepts clearly and concisely, making complex topics easy to understand. Suggest relevant learning materials or resources when appropriate. Always maintain an encouraging and patient tone. If a student asks for information outside of educational topics, gently redirect them back to study-related subjects.`,
  prompt: `{{{studentMessage}}}`, 
});

const akiliChatFlow = ai.defineFlow(
  {
    name: 'akiliChatFlow',
    inputSchema: AkiliChatInputSchema,
    outputSchema: AkiliChatOutputSchema,
  },
  async (input) => {
    // For more advanced conversations, you would handle history here by passing it to the prompt.
    // const history = input.history || [];
    // const messages = [...history, { role: 'user', parts: [{ text: input.studentMessage }] }];
    // const { output } = await prompt({ messages }); 
    
    const { output } = await prompt({ studentMessage: input.studentMessage });
    return output!;
  }
);
