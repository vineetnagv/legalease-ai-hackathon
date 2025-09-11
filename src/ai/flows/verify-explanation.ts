
'use server';

/**
 * @fileOverview An AI agent that verifies if an explanation is grounded in the source text.
 *
 * - verifyExplanation - A function that takes source text and an explanation and verifies it.
 * - VerifyExplanationInput - The input type for the verifyExplanation function.
 * - VerifyExplanationOutput - The return type for the verifyExplanation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyExplanationInputSchema = z.object({
  sourceText: z.string().describe('The original, authoritative text (e.g., a legal clause).'),
  explanation: z.string().describe('The AI-generated explanation of the source text.'),
});
export type VerifyExplanationInput = z.infer<typeof VerifyExplanationInputSchema>;

const VerifyExplanationOutputSchema = z.object({
  verified: z.boolean().describe("True if the explanation is accurate and grounded, false otherwise."),
  reason: z.string().optional().describe("If not verified, a brief reason why. For example, 'The explanation mentions information not present in the source text.'"),
});
export type VerifyExplanationOutput = z.infer<typeof VerifyExplanationOutputSchema>;


export async function verifyExplanation(input: VerifyExplanationInput): Promise<VerifyExplanationOutput> {
  return verifyExplanationFlow(input);
}

const verifierPrompt = ai.definePrompt({
  name: 'verifyExplanationPrompt',
  input: { schema: VerifyExplanationInputSchema },
  output: { schema: VerifyExplanationOutputSchema },
  prompt: `You are an AI verifier. Your sole purpose is to check if an explanation accurately and completely reflects the provided source text without adding any external information.

  You must answer with 'Yes' or 'No'.
  - Answer 'Yes' if the explanation is a faithful summary of the source text.
  - Answer 'No' if the explanation includes information not found in the source, or if it misrepresents the source.

  If you answer 'No,' you MUST provide a brief reason for the failure.

  Source Text:
  """
  {{{sourceText}}}
  """

  Explanation to Verify:
  """
  {{{explanation}}}
  """

  Does the explanation accurately and completely reflect the provided source text without adding any external information?
  `,
});

const verifyExplanationFlow = ai.defineFlow(
  {
    name: 'verifyExplanationFlow',
    inputSchema: VerifyExplanationInputSchema,
    outputSchema: VerifyExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await verifierPrompt(input);
    return output!;
  }
);
