'use server';

/**
 * @fileOverview An AI agent that explains legal clauses in plain English, highlighting jargon.
 *
 * - explainClauses - A function that takes legal clauses and returns plain English explanations.
 * - ExplainClausesInput - The input type for the explainClauses function.
 * - ExplainClausesOutput - The return type for the explainClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainClausesInputSchema = z.object({
  clauses: z.array(
    z.string().describe('A legal clause from the document.')
  ).describe('The legal clauses to be explained.'),
  userRole: z.string().describe('The role of the user in the legal agreement (e.g., Tenant, Landlord).')
});
export type ExplainClausesInput = z.infer<typeof ExplainClausesInputSchema>;

const ExplainClausesOutputSchema = z.array(
  z.object({
    original_text: z.string().describe('The original legal clause text.'),
    plain_english_explanation: z.string().describe('A simplified explanation of the clause in plain English.'),
    jargon_terms: z.array(z.string()).describe('An array of jargon terms identified in the clause.'),
  })
).describe('An array of explained clauses with jargon terms.');
export type ExplainClausesOutput = z.infer<typeof ExplainClausesOutputSchema>;

export async function explainClauses(input: ExplainClausesInput): Promise<ExplainClausesOutput> {
  return explainClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainClausesPrompt',
  input: {schema: ExplainClausesInputSchema},
  output: {schema: ExplainClausesOutputSchema},
  prompt: `You are an AI legal assistant specializing in simplifying complex legal documents for average people.

You will receive an array of legal clauses and your task is to explain each clause in plain English, so it can be easily understood by someone without legal expertise. For each clause, you should also identify any jargon terms and include them in the jargon_terms array.

User Role: {{{userRole}}}

Clauses:
{{#each clauses}}
- {{{this}}}
{{/each}}

Ensure that the output is a JSON array of objects, where each object contains the original clause, the plain English explanation, and an array of jargon terms found in the original clause.
`,
});

const explainClausesFlow = ai.defineFlow(
  {
    name: 'explainClausesFlow',
    inputSchema: ExplainClausesInputSchema,
    outputSchema: ExplainClausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
