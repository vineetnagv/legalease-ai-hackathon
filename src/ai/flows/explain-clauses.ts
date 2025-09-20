
'use server';

/**
 * @fileOverview An AI agent that explains legal clauses in plain English, with a self-correction verification loop.
 * This version uses batch processing to be more efficient and avoid API rate limits.
 *
 * - explainClauses - A function that takes legal clauses and returns verified plain English explanations.
 * - ExplainClausesInput - The input type for the explainClauses function.
 * - ExplainClausesOutput - The return type for the explainClauses function.
 */

import { ai } from '@/ai/agents';
import { verifyBatchExplanation } from './verify-explanation';
import {
  ExplainClausesInputSchema,
  ExplainClausesOutputSchema,
  AnalyzerInputSchema,
  type ExplainClausesInput,
  type ExplainClausesOutput,
} from '@/lib/ai-types';


export async function explainClauses(input: ExplainClausesInput): Promise<ExplainClausesOutput> {
  return explainClausesFlow(input);
}

// The prompt for the "Analyzer Agent" - now processes a batch of clauses
const analyzerPrompt = ai.definePrompt({
  name: 'explainClausesBatchPrompt',
  input: {schema: AnalyzerInputSchema},
  output: {schema: ExplainClausesOutputSchema},
  prompt: `You are an AI legal assistant specializing in simplifying complex legal documents.

Your task is to explain a list of legal clauses in plain English, tailored to the user's role. For each clause you must:
1. Provide a simplified explanation of the clause in plain English.
2. Identify any legal jargon terms within that clause.
3. Provide a simple, one-sentence definition for each jargon term you find.
4. Ensure your explanation is grounded SOLELY in the provided text and does not add any external information.
5. Your output must be an array of JSON objects, one for each clause, matching the order of the input clauses.

IMPORTANT: Your entire response (explanations and definitions) must be in the following language: {{{language}}}

{{#if retry_feedback}}
You are being asked to retry this explanation because a previous attempt was flagged as inaccurate by a verifier.
Reason for failure: {{{retry_feedback}}}
Please regenerate the explanations ONLY for the clauses that were flagged as inaccurate, paying close attention to the feedback. For clauses that were correct, return the original explanation.
{{/if}}

User Role: {{{userRole}}}

Clauses to explain:
{{#each clauses}}
Clause {{_index}}:
"""
{{{this}}}
"""
{{/each}}

Ensure that the output is a single JSON array, with one object per clause.
`,
});

const explainClausesFlow = ai.defineFlow(
  {
    name: 'explainClausesFlow',
    inputSchema: ExplainClausesInputSchema,
    outputSchema: ExplainClausesOutputSchema,
  },
  async (input) => {
    const MAX_RETRIES = 1; // Allow one retry for the whole batch.

    let lastExplanation: ExplainClausesOutput | null = null;
    let verifierFeedback: string | undefined = undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // First attempt: Generate explanations for all clauses
            const { output: initialExplanations } = await analyzerPrompt({
                clauses: input.clauses,
                userRole: input.userRole,
                language: input.language,
                retry_feedback: verifierFeedback, // Will be undefined on first loop
            });
            lastExplanation = initialExplanations;

            if (!initialExplanations || initialExplanations.length !== input.clauses.length) {
                throw new Error("Analyzer did not produce a valid explanation for every clause.");
            }

            // Send the entire batch to the verifier
            const verification = await verifyBatchExplanation({
                sourceClauses: input.clauses,
                explainedClauses: initialExplanations,
            });


            if (verification.all_verified) {
                // Success! All explanations are good.
                return initialExplanations;
            }

            // Verification failed for at least one clause.
            // Collate the feedback for the retry attempt.
            verifierFeedback = verification.feedback.map(f => `Clause regarding "${f.clause_substring}" failed because: ${f.reason}`).join('\n');
            console.warn(`Batch verification failed (attempt ${attempt + 1}):\n${verifierFeedback}`);

        } catch (error) {
            console.error(`An error occurred during explanation/verification attempt ${attempt + 1}:`, error);
            verifierFeedback = error instanceof Error ? error.message : "An unknown error occurred.";
        }
    }


    // If we exit the loop, all retries have failed.
    console.error(`Could not generate a fully verified explanation for the batch after ${MAX_RETRIES + 1} attempts.`);
    
    // Return the last explanation we got, even if it's partially or fully unverified.
    // A UI could potentially use this to show which clauses are unverified.
    if (lastExplanation) {
        return lastExplanation;
    }

    // Fallback if we never even got a first explanation.
    return input.clauses.map(clause => ({
        original_text: clause,
        plain_english_explanation: `Error: The AI was unable to generate a reliable explanation for this clause after multiple attempts. The process failed due to: ${verifierFeedback}`,
        jargon_terms: [],
    }));
  }
);
