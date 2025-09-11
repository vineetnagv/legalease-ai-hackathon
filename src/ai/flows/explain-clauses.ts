'use server';

/**
 * @fileOverview An AI agent that explains legal clauses in plain English, with a self-correction verification loop.
 *
 * - explainClauses - A function that takes legal clauses and returns verified plain English explanations.
 * - ExplainClausesInput - The input type for the explainClauses function.
 * - ExplainClausesOutput - The return type for the explainClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { verifyExplanation } from './verify-explanation';

const ExplainClausesInputSchema = z.object({
  clauses: z.array(
    z.string().describe('A legal clause from the document.')
  ).describe('The legal clauses to be explained.'),
  userRole: z.string().describe('The role of the user in the legal agreement (e.g., Tenant, Landlord).'),
  language: z.string().describe('The language for the analysis output (e.g., "English", "Hindi").'),
});
export type ExplainClausesInput = z.infer<typeof ExplainClausesInputSchema>;

const JargonTermSchema = z.object({
    term: z.string().describe('The legal jargon term identified.'),
    definition: z.string().describe('A simple, plain language definition of the jargon term.'),
});

const ExplainedClauseSchema = z.object({
    original_text: z.string().describe('The original legal clause text.'),
    plain_english_explanation: z.string().describe('A simplified explanation of the clause in plain English.'),
    jargon_terms: z.array(JargonTermSchema).describe('An array of jargon terms identified in the clause, along with their definitions.'),
});

const ExplainClausesOutputSchema = z.array(ExplainedClauseSchema);

export type ExplainClausesOutput = z.infer<typeof ExplainClausesOutputSchema>;

export async function explainClauses(input: ExplainClausesInput): Promise<ExplainClausesOutput> {
  return explainClausesFlow(input);
}


// Internal schema for a single clause explanation, including verifier feedback
const SingleClauseExplanationInputSchema = z.object({
  clause: z.string(),
  userRole: z.string(),
  language: z.string(),
  retry_feedback: z.string().optional().describe("Feedback from the verifier agent on a previous failed attempt."),
});

// The prompt for the "Analyzer Agent"
const analyzerPrompt = ai.definePrompt({
  name: 'explainSingleClausePrompt',
  input: {schema: SingleClauseExplanationInputSchema},
  output: {schema: ExplainedClauseSchema},
  prompt: `You are an AI legal assistant specializing in simplifying complex legal documents.

Your task is to explain the following legal clause in plain English, tailored to the user's role. You must also:
1. Identify any legal jargon terms.
2. Provide a simple, one-sentence definition for each jargon term you find.
3. Ensure your explanation is grounded SOLELY in the provided text and does not add any external information.

IMPORTANT: Your entire response must be in the following language: {{{language}}}
{{#if retry_feedback}}
You are being asked to retry this explanation. A previous attempt was flagged as inaccurate by a verifier.
Reason for failure: {{{retry_feedback}}}
Please correct the explanation based on this feedback.
{{/if}}
User Role: {{{userRole}}}

Clause Text:
"""
{{{clause}}}
"""

Ensure that the output is a single JSON object containing the original clause, the plain English explanation, and an array of jargon term objects (with "term" and "definition").
`,
});

const explainClausesFlow = ai.defineFlow(
  {
    name: 'explainClausesFlow',
    inputSchema: ExplainClausesInputSchema,
    outputSchema: ExplainClausesOutputSchema,
  },
  async (input) => {
    const MAX_RETRIES = 2; // Allow up to 2 retries (3 attempts total) per clause.

    const explainedClauses = await Promise.all(
      input.clauses.map(async (clause) => {
        let lastExplanation: z.infer<typeof ExplainedClauseSchema> | null = null;
        let verifierFeedback: string | undefined = undefined;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const { output: explanation } = await analyzerPrompt({
              clause: clause,
              userRole: input.userRole,
              language: input.language,
              retry_feedback: verifierFeedback,
            });
            lastExplanation = explanation; // Store the current explanation

            if (!explanation) {
              throw new Error("Analyzer failed to produce an explanation.");
            }

            // Send to verifier
            const verification = await verifyExplanation({
              sourceText: clause,
              explanation: explanation.plain_english_explanation,
            });

            if (verification.verified) {
              // Success! The explanation is good.
              return explanation;
            }

            // Verification failed, set feedback for the next loop iteration.
            verifierFeedback = verification.reason;
            console.warn(`Verification failed for clause (attempt ${attempt + 1}): ${verifierFeedback}`);

          } catch (error) {
              console.error(`An error occurred during explanation/verification attempt ${attempt + 1}:`, error);
              // If an error happens, we can also treat it as a need to retry.
              verifierFeedback = error instanceof Error ? error.message : "An unknown error occurred.";
          }
        }

        // If we exit the loop, all retries have failed.
        console.error(`Could not generate a verified explanation for a clause after ${MAX_RETRIES + 1} attempts.`);
        // Return the last unverified explanation, or a fallback.
        return lastExplanation || {
            original_text: clause,
            plain_english_explanation: `Error: The AI was unable to generate a reliable explanation for this clause after multiple attempts. The last attempt failed due to: ${verifierFeedback}`,
            jargon_terms: [],
        };
      })
    );

    return explainedClauses;
  }
);
