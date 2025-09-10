'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting key numbers from a legal document.
 *
 * - extractKeyNumbers - A function that takes a document and extracts key numbers from it.
 * - ExtractKeyNumbersInput - The input type for the extractKeynumbers function.
 * - ExtractKeyNumbersOutput - The return type for the extractKeynumbers function.
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
    keyNumbers: z.array(z.object({
        key: z.string().describe("The name of the extracted value (e.g., 'Monthly Rent', 'Contract End Date')."),
        value: z.string().describe("The extracted value from the document (e.g., '$2,000', '2026-12-31').")
    })).describe("A list of key-value pairs extracted from the document.")
});
export type ExtractKeyNumbersOutput = z.infer<typeof ExtractKeyNumbersOutputSchema>;


export async function extractKeyNumbers(input: ExtractKeyNumbersInput): Promise<ExtractKeyNumbersOutput> {
  return extractKeyNumbersFlow(input);
}

const extractKeyNumbersPrompt = ai.definePrompt({
  name: 'extractKeyNumbersPrompt',
  input: {schema: ExtractKeyNumbersInputSchema},
  output: {schema: ExtractKeyNumbersOutputSchema},
  prompt: `You are an expert legal document analyst. Your task is to extract key numbers, amounts, and dates from the following legal document text. Provide them in a structured format. Only extract what is explicitly mentioned in the document. If a particular key is not mentioned in the document, do not invent the content; the key should not be in the output. Example output: { "keyNumbers": [ { "key": "Monthly Rent", "value": "$2,000" }, { "key": "Contract End Date", "value": "2026-12-31" } ] }.\n\nDocument Text: {{{documentText}}}`,
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
