/**
 * @fileOverview A Genkit flow for generating a glossary of key terms from a legal document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateGlossaryInputSchema = z.object({
  documentText: z.string().describe('The full text of the legal document'),
});

const GlossaryTerm = z.object({
  term: z.string().describe('The key legal term'),
  definition: z.string().describe('A plain English definition of the term'),
});

const GenerateGlossaryOutputSchema = z.object({
  glossary: z.array(GlossaryTerm).describe('A list of key legal terms and their definitions'),
});

export type GenerateGlossaryInput = z.infer<typeof GenerateGlossaryInputSchema>;
export type GenerateGlossaryOutput = z.infer<typeof GenerateGlossaryOutputSchema>;

export const generateGlossary = ai.defineFlow(
  {
    name: 'generateGlossary',
    inputSchema: GenerateGlossaryInputSchema,
    outputSchema: GenerateGlossaryOutputSchema,
  },
  async ({ documentText }) => {
    const response = await ai.generate({
      prompt: `Identify the key legal terms in the following document and provide a plain English definition for each. Present the output as a list of terms and definitions.

      Document:
      ${documentText}`,
      output: {
        format: 'json',
        schema: GenerateGlossaryOutputSchema,
      },
    });

    return response.output || { glossary: [] };
  }
);
