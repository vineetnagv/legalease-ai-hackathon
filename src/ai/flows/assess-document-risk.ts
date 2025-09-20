
'use server';

/**
 * @fileOverview Assesses the overall risk level of a legal document.
 *
 * - assessDocumentRisk - A function that assesses the risk level of a legal document.
 * - AssessDocumentRiskInput - The input type for the assessDocumentRisk function.
 * - AssessDocumentRiskOutput - The return type for the assessDocumentRisk function.
 */

import { ai } from '@/ai/agents';
import {
  AssessDocumentRiskInputSchema,
  AssessDocumentRiskOutputSchema,
  type AssessDocumentRiskInput,
  type AssessDocumentRiskOutput,
} from '@/lib/ai-types';


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

  IMPORTANT: Your entire response must be in the following language: {{{language}}}

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
