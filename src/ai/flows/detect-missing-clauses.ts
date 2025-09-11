'use server';

/**
 * @fileOverview Detects critical clauses that may be missing from a legal document.
 *
 * - detectMissingClauses - A function that identifies missing clauses.
 * - DetectMissingClausesInput - The input type for the detectMissingClauses function.
 * - DetectMissingClausesOutput - The return type for the detectMissingClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectMissingClausesInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
  userRole: z.string().describe('The role of the user in the legal agreement (e.g., Tenant, Landlord).'),
  language: z.string().describe('The language for the analysis output (e.g., "English", "Hindi").'),
});
export type DetectMissingClausesInput = z.infer<typeof DetectMissingClausesInputSchema>;


const MissingClauseSchema = z.object({
    clauseName: z.string().describe('The name of the missing clause (e.g., "Confidentiality").'),
    description: z.string().describe('A brief explanation of what this clause typically covers.'),
    risk: z.string().describe("The potential risk to the user due to the absence of this clause."),
});

const DetectMissingClausesOutputSchema = z.array(MissingClauseSchema).describe("An array of potentially missing clauses.");
export type DetectMissingClausesOutput = z.infer<typeof DetectMissingClausesOutputSchema>;

export async function detectMissingClauses(input: DetectMissingClausesInput): Promise<DetectMissingClausesOutput> {
  return detectMissingClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectMissingClausesPrompt',
  input: {schema: DetectMissingClausesInputSchema},
  output: {schema: DetectMissingClausesOutputSchema},
  prompt: `You are an AI legal assistant with expertise in contract analysis. Your task is to identify critical clauses that are MISSING from a legal document, based on the document's content and the user's role.

First, identify the type of document (e.g., "Non-Disclosure Agreement," "Lease Agreement," "Employment Contract").

Then, based on the document type and standard legal practices, identify important clauses that are commonly included for the protection of the specified user role but are absent from this document.

For each missing clause you identify, provide its name, a description of its purpose, and the potential risk to the user if it's not included.

IMPORTANT: Your entire response must be in the following language: {{{language}}}

Document Text: {{{documentText}}}
User Role: {{{userRole}}}

Return an array of objects for each missing clause found. If no critical clauses are missing, return an empty array.
`,
});

const detectMissingClausesFlow = ai.defineFlow(
  {
    name: 'detectMissingClausesFlow',
    inputSchema: DetectMissingClausesInputSchema,
    outputSchema: DetectMissingClausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
