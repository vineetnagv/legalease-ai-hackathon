'use server';

/**
 * @fileOverview Suggests a user role based on the content of a legal document.
 *
 * - suggestUserRole - A function that suggests a user role from a document.
 * - SuggestUserRoleInput - The input type for the suggestUserRole function.
 * - SuggestUserRoleOutput - The return type for the suggestUserRole function.
 */

import { analyzerAgent as ai } from '@/ai/agents';
import {z} from 'genkit';

const SuggestUserRoleInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
});
export type SuggestUserRoleInput = z.infer<typeof SuggestUserRoleInputSchema>;

const SuggestUserRoleOutputSchema = z.object({
    suggestedRole: z.string().describe('A likely role for the user based on the document (e.g., Tenant, Landlord, Employee).'),
});
export type SuggestUserRoleOutput = z.infer<typeof SuggestUserRoleOutputSchema>;


export async function suggestUserRole(input: SuggestUserRoleInput): Promise<SuggestUserRoleOutput> {
  return suggestUserRoleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestUserRolePrompt',
  input: {schema: SuggestUserRoleInputSchema},
  output: {schema: SuggestUserRoleOutputSchema},
  prompt: `You are an AI assistant that analyzes legal documents. Your task is to determine the most likely role of a user based on the content of the document they've provided.

  Analyze the following document text and suggest a single, concise role title. For example: "Tenant", "Landlord", "Employee", "Client", "Freelancer".

  Document Text: {{{documentText}}}

  Respond with a JSON object containing the suggested role.
  `,
});

const suggestUserRoleFlow = ai.defineFlow(
  {
    name: 'suggestUserRoleFlow',
    inputSchema: SuggestUserRoleInputSchema,
    outputSchema: SuggestUserRoleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
