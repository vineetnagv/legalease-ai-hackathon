'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting key numbers from a legal document.
 *
 * - extractKeyNumbers - A function that takes a document and extracts key numbers from it.
 * - ExtractKeyNumbersInput - The input type for the extractKeyNumbers function.
 * - ExtractKeyNumbersOutput - The return type for the extractKeyNumbers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyNumbersInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the legal document to analyze.'),
});
export type ExtractKeyNumbersInput = z.infer<typeof ExtractKeyNumbersInputSchema>;

const ExtractKeyNumbersOutputSchema = z.object({
  keyNumbers: z.record(z.string(), z.string()).describe('A key-value map of extracted key numbers from the document.'),
});
export type ExtractKeyNumbersOutput = z.infer<typeof ExtractKeyNumbersOutputSchema>;

export async function extractKeyNumbers(input: ExtractKeyNumbersInput): Promise<ExtractKeyNumbersOutput> {
  return extractKeyNumbersFlow(input);
}

const extractKeyNumbersPrompt = ai.definePrompt({
  name: 'extractKeyNumbersPrompt',
  input: {schema: ExtractKeyNumbersInputSchema},
  output: {schema: ExtractKeyNumbersOutputSchema},
  prompt: `You are an expert legal document analyst. Your task is to extract key numbers from the following legal document text and provide them in a structured key-value format. Only extract what is explicitly mentioned in the document. If a particular key is not mentioned in the document, do not invent the content; the key should not be in the output. Example output: { \"Monthly Rent\": \"$2,000\", \"Contract End Date\": \"2026-12-31\" }.\n\nDocument Text: {{{documentText}}}`,
});

const extractKeyNumbersFlow = ai.defineFlow(
  {
    name: 'extractKeyNumbersFlow',
    inputSchema: ExtractKeyNumbersInputSchema,
    outputSchema: ExtractKeyNumbersOutputSchema,
  },
  async input => {
    const {output} = await extractKeyNumbersPrompt(input);
    return output!;
  }
);
