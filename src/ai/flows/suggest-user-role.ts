'use server';
/**
 * @fileOverview A Genkit flow for suggesting a user's role in a legal document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const prompt = ai.definePrompt(
  {
    name: 'suggestUserRolePrompt',
    input: { schema: z.string() },
    output: { schema: z.string() },
    prompt: `You are an expert legal analyst. Your task is to read the provided legal document and determine the most likely role of the user reviewing it.

Analyze the text below and identify one of the primary parties involved. Common roles include "Tenant", "Landlord", "Employee", "Employer", "Contractor", "Client", "Lender", "Borrower", etc.

Output only a single, concise role name. For example, if the document is a lease agreement and the user seems to be the one renting, output only "Tenant".

Document:
{{{input}}}
`,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: input,
      model: 'gemini-pro',
      output: {
        format: 'text',
      },
    });
    return llmResponse.text;
  }
);


export const suggestUserRole = ai.defineFlow(
  {
    name: 'suggestUserRole',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (documentText) => {
    const role = await prompt(documentText);
    // Trim and ensure the output is a single line, just in case.
    return role.trim().split('\n')[0];
  }
);
