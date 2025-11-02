/**
 * @fileOverview A Genkit flow for summarizing a legal document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeDocumentInputSchema = z.object({
  documentText: z.string().describe('The full text of the legal document'),
});

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise, high-level summary of the document'),
});

export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export const summarizeDocument = ai.defineFlow(
  {
    name: 'summarizeDocument',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async ({ documentText }) => {
    const response = await ai.generate({
      prompt: `Summarize the following legal document in a few paragraphs. Focus on the key points, obligations, and rights of the parties involved.

      Document:
      ${documentText}`,
      output: {
        format: 'json',
        schema: SummarizeDocumentOutputSchema,
      },
    });

    return response.output || { summary: '' };
  }
);
