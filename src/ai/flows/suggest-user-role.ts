'use server';
/**
 * @fileOverview A Genkit flow for suggesting a user's role in a legal document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const suggestUserRole = ai.defineFlow(
  {
    name: 'suggestUserRole',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (documentText) => {
    const { output } = await ai.generate({
      prompt: `You are an expert legal analyst. Your task is to read the provided legal document and determine the most likely role of the user reviewing it.

Analyze the text below and identify one of the primary parties involved. Common roles include "Tenant", "Landlord", "Employee", "Employer", "Contractor", "Client", "Lender", "Borrower", etc.

Output only a single, concise role name. For example, if the document is a lease agreement and the user seems to be the one renting, output only "Tenant".

Document:
${documentText}
`,
    });
    return output || '';
  }
);
