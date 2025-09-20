
'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting key numbers from a legal document.
 *
 * - extractKeyNumbers - A function that takes a document and extracts key numbers from it.
 * - ExtractKeyNumbersInput - The input type for the extractKeynumbers function.
 * - ExtractKeyNumbersOutput - The return type for the extractKeynumbers function.
 */

import { ai } from '@/ai/agents';
import {
  ExtractKeyNumbersInputSchema,
  ExtractKeyNumbersOutputSchema,
  type ExtractKeyNumbersInput,
  type ExtractKeyNumbersOutput,
} from '@/lib/ai-types';


export async function extractKeyNumbers(input: ExtractKeyNumbersInput): Promise<ExtractKeyNumbersOutput> {
  return extractKeyNumbersFlow(input);
}

const extractKeyNumbersPrompt = ai.definePrompt({
  name: 'extractKeyNumbersPrompt',
  input: {schema: ExtractKeyNumbersInputSchema},
  output: {schema: ExtractKeyNumbersOutputSchema},
  prompt: `You are an expert legal document analyst. Your task is to extract key numbers, amounts, and dates from the following legal document text. Provide them in a structured format. The "key" of the extracted value should be in {{{language}}}. Only extract what is explicitly mentioned in the document. If a particular key is not mentioned in the document, do not invent the content; the key should not be in the output. Example output: { "keyNumbers": [ { "key": "Monthly Rent", "value": "$2,000" }, { "key": "Contract End Date", "value": "2026-12-31" } ] }.\n\nDocument Text: {{{documentText}}}`,
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
