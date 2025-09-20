
'use server';

/**
 * @fileOverview Suggests a user role based on the content of a legal document.
 *
 * - suggestUserRole - A function that suggests a user role from a document.
 * - SuggestUserRoleInput - The input type for the suggestUserRole function.
 * - SuggestUserRoleOutput - The return type for the suggestUserRole function.
 */

import { ai } from '@/ai/agents';
import {
  SuggestUserRoleInputSchema,
  SuggestUserRoleOutputSchema,
  type SuggestUserRoleInput,
  type SuggestUserRoleOutput,
} from '@/lib/ai-types';


export async function suggestUserRole(input: SuggestUserRoleInput): Promise<SuggestUserRoleOutput> {
  return suggestUserRoleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestUserRolePrompt',
  input: {schema: SuggestUserRoleInputSchema},
  output: {schema: SuggestUserRoleOutputSchema},
  prompt: `You are an AI assistant that analyzes legal documents. Your task is to determine the most likely role of a user based on the content of the document they've provided.

  Analyze the following document text and suggest a single, concise but descriptive role title. For example: "Residential Tenant", "Commercial Landlord", "Software Development Employee", "Independent Contractor", "Client for Services".

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
