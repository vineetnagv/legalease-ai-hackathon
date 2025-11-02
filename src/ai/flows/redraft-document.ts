/**
 * @fileOverview A Genkit flow for redrafting a legal document with improvements.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AssessDocumentRiskOutputSchema } from './assess-document-risk';
import { DetectMissingClausesOutputSchema } from './detect-missing-clauses';

const RedraftDocumentInputSchema = z.object({
  documentText: z.string().describe('The full text of the original legal document'),
  riskAnalysis: AssessDocumentRiskOutputSchema.optional().describe('The risk analysis of the document'),
  missingClauses: DetectMissingClausesOutputSchema.optional().describe('The missing clauses analysis of the document'),
});

const RedraftDocumentOutputSchema = z.object({
  redraftedDocument: z.string().describe('The redrafted version of the legal document'),
  summaryOfChanges: z.string().describe('A summary of the changes made to the document'),
});

export type RedraftDocumentInput = z.infer<typeof RedraftDocumentInputSchema>;
export type RedraftDocumentOutput = z.infer<typeof RedraftDocumentOutputSchema>;

export const redraftDocument = ai.defineFlow(
  {
    name: 'redraftDocument',
    inputSchema: RedraftDocumentInputSchema,
    outputSchema: RedraftDocumentOutputSchema,
  },
  async ({ documentText, riskAnalysis, missingClauses }) => {
    let prompt = `Redraft the following legal document to improve it. Address the identified issues and incorporate the suggestions.`;

    if (riskAnalysis) {
      prompt += `

### Risk Analysis
- **Risk Score:** ${riskAnalysis.riskScore}/100
- **Summary:** ${riskAnalysis.riskSummary}`;
    }

    if (missingClauses) {
      prompt += `

### Missing Clauses
- **Summary:** ${missingClauses.summary}
- **Missing Clauses:**
`;
      missingClauses.missingClauses.forEach((clause: { clauseTitle: string; description: string; suggestedLanguage?: string; }) => {
        prompt += `  - **${clause.clauseTitle}**: ${clause.description}. Suggested language: "${clause.suggestedLanguage}"\n`;
      });
    }

    prompt += `

### Original Document
${documentText}

### Instructions
1.  Rewrite the document, incorporating the suggested clauses and addressing the identified risks.
2.  Maintain the original tone and style of the document as much as possible.
3.  Provide a summary of the changes you made.
4.  Output the redrafted document and the summary of changes.`;

    const response = await ai.generate({
      prompt,
      output: {
        format: 'json',
        schema: RedraftDocumentOutputSchema,
      },
    });

    return response.output || { redraftedDocument: '', summaryOfChanges: '' };
  }
);
