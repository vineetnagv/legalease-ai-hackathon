'use server';

/**
 * @fileOverview An AI agent that explains legal clauses in plain English, highlighting and defining jargon.
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
  userRole: z.string().describe('The role of the user in the legal agreement (e.g., Tenant, Landlord).'),
  language: z.string().describe('The language for the analysis output (e.g., "English", "Hindi").'),
});
export type ExplainClausesInput = z.infer<typeof ExplainClausesInputSchema>;

const JargonTermSchema = z.object({
    term: z.string().describe('The legal jargon term identified.'),
    definition: z.string().describe('A simple, plain language definition of the jargon term.'),
});

const ExplainedClauseSchema = z.object({
    original_text: z.string().describe('The original legal clause text.'),
    plain_english_explanation: z.string().describe('A simplified explanation of the clause in plain English.'),
    jargon_terms: z.array(JargonTermSchema).describe('An array of jargon terms identified in the clause, along with their definitions.'),
});

const ExplainClausesOutputSchema = z.array(ExplainedClauseSchema);

export type ExplainClausesOutput = z.infer<typeof ExplainClausesOutputSchema>;

export async function explainClauses(input: ExplainClausesInput): Promise<ExplainClausesOutput> {
  return explainClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainClausesPrompt',
  input: {schema: ExplainClausesInputSchema},
  output: {schema: ExplainClausesOutputSchema},
  prompt: `You are an AI legal assistant specializing in simplifying complex legal documents.

Your task is to explain each legal clause you receive in plain English, tailored to the user's role. For each clause, you must also:
1. Identify any legal jargon terms.
2. Provide a simple, one-sentence definition for each jargon term you find.

IMPORTANT: Your entire response must be in the following language: {{{language}}}

User Role: {{{userRole}}}

Clauses:
{{#each clauses}}
- {{{this}}}
{{/each}}

Ensure that the output is a JSON array of objects, where each object contains the original clause, the plain English explanation, and an array of jargon term objects (with "term" and "definition").
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
