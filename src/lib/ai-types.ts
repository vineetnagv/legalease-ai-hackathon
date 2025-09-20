
'use server';

/**
 * @fileOverview Centralized Zod schemas and TypeScript types for AI-related data structures.
 */

import { z } from 'zod';

// --- Common Schemas ---
const BaseInputSchema = z.object({
  documentText: z.string().describe('The full text content of the legal document.'),
  userRole: z.string().describe("The user's role in the context of the document (e.g., Tenant, Employee)."),
  language: z.string().describe('The language for the AI response (e.g., "English", "Spanish").'),
});

// --- AssessDocumentRisk ---
export const AssessDocumentRiskInputSchema = BaseInputSchema;
export type AssessDocumentRiskInput = z.infer<typeof AssessDocumentRiskInputSchema>;

export const AssessDocumentRiskOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The overall risk assessment level for the user.'),
  riskScore: z.number().min(0).max(100).describe('A numerical score from 0 (no risk) to 100 (highest risk).'),
  summary: z.string().describe('A brief summary explaining the key risks identified.'),
});
export type AssessDocumentRiskOutput = z.infer<typeof AssessDocumentRiskOutputSchema>;


// --- ChatAboutDocument ---
export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

export const ChatAboutDocumentInputSchema = BaseInputSchema.extend({
  question: z.string().describe("The user's current question about the document."),
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});
export type ChatAboutDocumentInput = z.infer<typeof ChatAboutDocumentInputSchema>;

export const ChatAboutDocumentOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type ChatAboutDocumentOutput = z.infer<typeof ChatAboutDocumentOutputSchema>;


// --- DetectMissingClauses ---
export const DetectMissingClausesInputSchema = BaseInputSchema;
export type DetectMissingClausesInput = z.infer<typeof DetectMissingClausesInputSchema>;

export const DetectMissingClausesOutputSchema = z.array(
  z.object({
    clauseName: z.string().describe('The name of the missing clause (e.g., "Confidentiality").'),
    description: z.string().describe('A brief explanation of what this clause typically covers.'),
    risk: z.string().describe('The potential risk to the user due to the absence of this clause.'),
  })
);
export type DetectMissingClausesOutput = z.infer<typeof DetectMissingClausesOutputSchema>;


// --- ExplainClauses ---
export const JargonTermSchema = z.object({
  term: z.string().describe('The specific legal jargon term identified.'),
  definition: z.string().describe('A simple, one-sentence definition of the term.'),
});

export const ExplainedClauseSchema = z.object({
  original_text: z.string().describe('The original text of the clause.'),
  plain_english_explanation: z.string().describe('The explanation of the clause in plain English.'),
  jargon_terms: z.array(JargonTermSchema).describe('A list of jargon terms found in the clause and their definitions.'),
});

export const ExplainClausesInputSchema = BaseInputSchema.extend({
  clauses: z.array(z.string()).describe('An array of strings, where each string is a clause from the document to be explained.'),
});
export type ExplainClausesInput = z.infer<typeof ExplainClausesInputSchema>;
export const ExplainClausesOutputSchema = z.array(ExplainedClauseSchema);
export type ExplainClausesOutput = z.infer<typeof ExplainClausesOutputSchema>;


// Used internally by explain-clauses flow
export const AnalyzerInputSchema = ExplainClausesInputSchema.extend({
  retry_feedback: z.string().optional().describe('Feedback from the verifier agent if a previous attempt failed.'),
});


// --- ExtractKeyNumbers ---
export const ExtractKeyNumbersInputSchema = z.object({
  documentText: z.string().describe('The full text content of the legal document.'),
  language: z.string().describe('The language for the AI response (e.g., "English", "Spanish").'),
});
export type ExtractKeyNumbersInput = z.infer<typeof ExtractKeyNumbersInputSchema>;

export const ExtractKeyNumbersOutputSchema = z.object({
  keyNumbers: z.array(z.object({
    key: z.string().describe('The label for the extracted number (e.g., "Rent Amount", "Notice Period").'),
    value: z.string().describe('The extracted number or date as a string (e.g., "$2,500/month", "30 days").'),
  })),
});
export type ExtractKeyNumbersOutput = z.infer<typeof ExtractKeyNumbersOutputSchema>;


// --- GenerateFaq ---
export const GenerateFaqInputSchema = BaseInputSchema;
export type GenerateFaqInput = z.infer<typeof GenerateFaqInputSchema>;

export const GenerateFaqOutputSchema = z.object({
  faqs: z.array(z.object({
    question: z.string().describe('A frequently asked question.'),
    answer: z.string().describe('The answer to the question.'),
  })),
});
export type GenerateFaqOutput = z.infer<typeof GenerateFaqOutputSchema>;


// --- SuggestUserRole ---
export const SuggestUserRoleInputSchema = z.object({
  documentText: z.string().describe('The text of the legal document.'),
});
export type SuggestUserRoleInput = z.infer<typeof SuggestUserRoleInputSchema>;

export const SuggestUserRoleOutputSchema = z.object({
  suggestedRole: z.string().describe('The suggested role for the user (e.g., "Tenant", "Landlord", "Employee").'),
});
export type SuggestUserRoleOutput = z.infer<typeof SuggestUserRoleOutputSchema>;


// --- VerifyExplanation ---
export const VerifyBatchExplanationInputSchema = z.object({
  sourceClauses: z.array(z.string()).describe('The original, legal source clauses.'),
  explainedClauses: z.array(ExplainedClauseSchema).describe('The AI-generated explanations of the clauses.'),
});
export type VerifyBatchExplanationInput = z.infer<typeof VerifyBatchExplanationInputSchema>;

export const VerifyBatchExplanationOutputSchema = z.object({
    all_verified: z.boolean().describe('True if every explanation is a faithful and accurate summary of its source clause.'),
    feedback: z.array(z.object({
        clause_substring: z.string().describe('A short, unique quote from the original clause that failed verification.'),
        reason: z.string().describe('The specific reason why the explanation was inaccurate or misleading.'),
    })).describe('A list of feedback for each explanation that failed verification. Empty if all are verified.'),
});
export type VerifyBatchExplanationOutput = z.infer<typeof VerifyBatchExplanationOutputSchema>;
