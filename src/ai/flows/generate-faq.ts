
'use server';

/**
 * @fileOverview Generates a list of frequently asked questions (FAQs) based on a legal document.
 *
 * - generateFaq - A function that creates FAQs from a document.
 * - GenerateFaqInput - The input type for the generateFaq function.
 * - GenerateFaqOutput - The return type for the generateFaq function.
 */

import { ai } from '@/ai/agents';
import {
  GenerateFaqInputSchema,
  GenerateFaqOutputSchema,
  type GenerateFaqInput,
  type GenerateFaqOutput,
} from '@/lib/ai-types';


export async function generateFaq(input: GenerateFaqInput): Promise<GenerateFaqOutput> {
  return generateFaqFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFaqPrompt',
  input: {schema: GenerateFaqInputSchema},
  output: {schema: GenerateFaqOutputSchema},
  prompt: `You are an AI legal assistant. Your task is to generate a list of frequently asked questions (FAQs) based on the provided legal document. These FAQs should be relevant to the user's specified role.

  IMPORTANT: Your entire response (questions and answers) must be in the following language: {{{language}}}

  Include questions that cover key aspects of the document, potential ambiguities, and "what if" scenarios that the user might encounter. For example: "What if I am late on a payment?", "What are my rights if the other party breaches the contract?".

  Document Text: {{{documentText}}}
  User Role: {{{userRole}}}

  Generate a list of questions and answers that would be helpful for someone in the user's role.
  `,
});

const generateFaqFlow = ai.defineFlow(
  {
    name: 'generateFaqFlow',
    inputSchema: GenerateFaqInputSchema,
    outputSchema: GenerateFaqOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
