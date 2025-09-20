
'use server';

import { ai } from '@/ai/agents';
import {
  VerifyBatchExplanationInputSchema,
  VerifyBatchExplanationOutputSchema,
  type VerifyBatchExplanationInput,
  type VerifyBatchExplanationOutput,
} from '@/lib/ai-types';

/**
 * @fileOverview An AI agent that verifies if a batch of explanations are grounded in their source texts.
 *
 * - verifyBatchExplanation - Verifies a batch of explanations against their source clauses.
 * - VerifyBatchExplanationInput - Input for the batch verification function.
 * - VerifyBatchExplanationOutput - Output for the batch verification function.
 */


export async function verifyBatchExplanation(input: VerifyBatchExplanationInput): Promise<VerifyBatchExplanationOutput> {
  return verifyBatchExplanationFlow(input);
}


const verifierPrompt = ai.definePrompt({
  name: 'verifyBatchExplanationPrompt',
  input: { schema: VerifyBatchExplanationInputSchema },
  output: { schema: VerifyBatchExplanationOutputSchema },
  prompt: `You are an AI verifier. Your sole purpose is to check if a list of explanations accurately and completely reflects their provided source texts without adding any external information.

You will be given a list of source texts (clauses) and a corresponding list of explanations.

For EACH pair, you must determine if the explanation is a faithful summary of the source text.
- The explanation is VALID if it only contains information present in the source.
- The explanation is INVALID if it includes information not found in the source, or if it misrepresents the source.

After reviewing all pairs, you must respond with a single JSON object.

If ALL explanations are valid, respond with:
{
  "all_verified": true,
  "feedback": []
}

If ANY explanation is invalid, respond with:
{
  "all_verified": false,
  "feedback": [
    {
      "clause_substring": "<A short, unique quote from the original clause that failed>",
      "reason": "<The specific reason why this explanation failed>"
    }
    // ... include an object for each failed explanation
  ]
}

Here are the clauses and their explanations to verify:
{{#each sourceClauses}}
Pair {{_index}}:
Source Text:
"""
{{{this}}}
"""
Explanation to Verify:
"""
{{{lookup ../explainedClauses _index "plain_english_explanation"}}}
"""
---
{{/each}}

Now, provide your final assessment of all pairs in the required JSON format.
  `,
});


const verifyBatchExplanationFlow = ai.defineFlow(
  {
    name: 'verifyBatchExplanationFlow',
    inputSchema: VerifyBatchExplanationInputSchema,
    outputSchema: VerifyBatchExplanationOutputSchema,
  },
  async (input) => {
    // Handle the case where the analyzer might have failed to produce a matching list
    if (input.sourceClauses.length !== input.explainedClauses.length) {
      console.error("Mismatch between number of source clauses and explained clauses.");
      return {
        all_verified: false,
        feedback: [{
          clause_substring: "N/A",
          reason: "The number of explanations did not match the number of source clauses provided."
        }]
      };
    }
    
    const { output } = await verifierPrompt(input);
    return output!;
  }
);
