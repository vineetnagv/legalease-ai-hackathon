'use server';

/**
 * @fileOverview Assesses the overall risk level of a legal document.
 *
 * - assessDocumentRisk - A function that assesses the risk level of a legal document.
 * - AssessDocumentRiskInput - The input type for the assessDocumentRisk function.
 * - AssessDocumentRiskOutput - The return type for the assessDocumentRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessDocumentRiskInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
  userRole: z.string().describe('The role of the user in the legal agreement (e.g., Tenant, Landlord).'),
});
export type AssessDocumentRiskInput = z.infer<typeof AssessDocumentRiskInputSchema>;

const AssessDocumentRiskOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The overall risk level of the document.'),
  riskScore: z.number().describe('A numerical score representing the risk level (0-100).'),
  summary: z.string().describe('A brief summary of the risks identified in the document.'),
});
export type AssessDocumentRiskOutput = z.infer<typeof AssessDocumentRiskOutputSchema>;

export async function assessDocumentRisk(input: AssessDocumentRiskInput): Promise<AssessDocumentRiskOutput> {
  return assessDocumentRiskFlow(input);
}

const assessDocumentRiskPrompt = ai.definePrompt({
  name: 'assessDocumentRiskPrompt',
  input: {schema: AssessDocumentRiskInputSchema},
  output: {schema: AssessDocumentRiskOutputSchema},
  prompt: `You are an AI legal assistant tasked with assessing the risk level of a legal document.

  Based on the document text and the user's role, determine the overall risk level (Low, Medium, or High) and provide a numerical risk score (0-100).
  Also, provide a brief summary of the key risks identified in the document.

  Document Text: {{{documentText}}}
  User Role: {{{userRole}}}

  Consider the following factors when assessing risk:
  - Unfavorable clauses for the user's role
  - Missing or incomplete information
  - Ambiguous language
  - Potential liabilities

  Respond with a JSON object that matches the following schema:
  {
    "riskLevel": "Low | Medium | High",
    "riskScore": number,
    "summary": string
  }`,
});

const assessDocumentRiskFlow = ai.defineFlow(
  {
    name: 'assessDocumentRiskFlow',
    inputSchema: AssessDocumentRiskInputSchema,
    outputSchema: AssessDocumentRiskOutputSchema,
  },
  async input => {
    const {output} = await assessDocumentRiskPrompt(input);
    return output!;
  }
);
