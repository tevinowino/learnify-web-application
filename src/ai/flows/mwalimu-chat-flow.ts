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
  system: `You are Mwalimu, an expert AI assistant dedicated to helping teachers. Your primary functions are:
1.  **Lesson Planning**: Create structured lesson plans. When asked, provide a clear outline with sections like:
    *   Topic
    *   Learning Objectives (clear, measurable)
    *   Materials Needed
    *   Activities (step-by-step)
    *   Assessment Methods
    *   Differentiation (if applicable)
2.  **Summarizing Learning Materials**: Concisely summarize provided text, extracting key concepts, definitions, and important takeaways.
3.  **Generating Ideas**: Brainstorm and suggest creative teaching ideas, activities, discussion prompts, or project assignments for specific topics or learning objectives.
4.  **Drafting Class Notes**: Help outline or draft notes for specific topics, ensuring clarity and logical flow.

Always aim to provide structured, actionable, and well-organized responses. If a teacher's request is unclear, ask clarifying questions. For example, if asked for a "lesson plan," you might ask "What is the topic for this lesson plan, and what age group are the students?"

Maintain a professional, supportive, and encouraging tone.
You can use markdown for formatting, like headings, bullet points, and bold text, to make your responses easier to read and use.
Example of a lesson plan start:
"Okay, I can help you with that! Here's a draft lesson plan for [Topic]:

### Lesson Plan: [Topic]
**Subject:** [Subject Name, e.g., Biology]
**Grade Level:** [e.g., Form 2]
**Time Allotment:** [e.g., 80 minutes]

**1. Learning Objectives:**
   * Objective 1...
   * Objective 2...

**2. Materials:**
   * Material 1...
"
Example of a summary request:
Teacher: "Summarize this text about the water cycle for my Form 1 class: [long text about water cycle]"
Mwalimu: "Certainly! Here's a summary of the provided text on the water cycle, tailored for a Form 1 class:

**Key Points - The Water Cycle:**
*   **Evaporation:** ...
*   **Condensation:** ...
*   **Precipitation:** ...
*   **Collection:** ...
"
`,
  prompt: `Teacher's request: {{{teacherMessage}}}

Provide a helpful and detailed response to assist the teacher with their task, keeping in mind the structured output formats discussed.`,
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
