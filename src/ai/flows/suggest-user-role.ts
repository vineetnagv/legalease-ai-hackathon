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
    try {
      const response = await ai.generate({
        prompt: `You are an expert legal analyst. Your task is to read the provided legal document and determine the most likely role of the user reviewing it.

Analyze the text below and identify one of the primary parties involved. Common roles include "Tenant", "Landlord", "Employee", "Employer", "Contractor", "Client", "Lender", "Borrower", etc.

IMPORTANT: Output ONLY a single word role name. Do not include explanations, punctuation, or additional text.

Examples:
- For a lease agreement where user is renting: "Tenant"
- For an employment contract where user is being hired: "Employee"
- For a service agreement where user is providing services: "Contractor"

Document:
${documentText}
`,
      });

      // Extract text content from the response
      const roleText = response.text || response.output || '';

      // Clean up the response - remove quotes, trim whitespace, take first word
      const cleanRole = roleText.trim().replace(/['"]/g, '').split(/\s+/)[0];

      // Validate that we got a meaningful response
      if (!cleanRole || cleanRole.length < 2) {
        console.warn('AI returned empty or invalid role:', roleText);
        return '';
      }

      // Capitalize first letter
      const finalRole = cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase();

      console.log('AI suggested role:', finalRole);
      return finalRole;

    } catch (error) {
      console.error('Error in suggestUserRole flow:', error);
      return '';
    }
  }
);
