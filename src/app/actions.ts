// @ts-nocheck
'use server';

import {
  assessDocumentRisk,
  type AssessDocumentRiskOutput,
} from '@/ai/flows/assess-document-risk';
import {
  extractKeyNumbers,
  type ExtractKeyNumbersOutput,
} from '@/ai/flows/extract-key-numbers';
import {
  explainClauses,
  type ExplainClausesOutput,
} from '@/ai/flows/explain-clauses';
import type { AnalysisResult } from '@/lib/types';

/**
 * Splits a document's text into an array of clauses.
 * This is a naive implementation that splits by double newlines.
 * A production application would use a more sophisticated method.
 * @param text The full text of the document.
 * @returns An array of strings, where each string is a clause.
 */
function splitIntoClauses(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20); // Filter out short paragraphs
}

/**
 * Analyzes a legal document by calling multiple AI flows in parallel.
 * @param documentText The full text content of the legal document.
 * @param userRole The user's role in the agreement (e.g., "Tenant").
 * @returns A promise that resolves to a consolidated `AnalysisResult` object.
 * @throws An error if documentText or userRole is missing.
 */
export async function analyzeDocument(
  documentText: string,
  userRole: string
): Promise<AnalysisResult> {
  if (!documentText || !userRole) {
    throw new Error('Document text and user role are required for analysis.');
  }

  // Split the document into clauses for explanation.
  const clauses = splitIntoClauses(documentText);
  if (clauses.length === 0) {
    throw new Error(
      'Could not find any clauses to analyze. Please ensure your document has distinct paragraphs.'
    );
  }

  try {
    // Run all AI analysis flows in parallel for efficiency.
    const [risk, keyNumbers, explainedClauses] = await Promise.all([
      assessDocumentRisk({ documentText, userRole }),
      extractKeyNumbers({ documentText }),
      explainClauses({ clauses, userRole }),
    ]);

    // This check is necessary because the `explainClauses` flow can sometimes return
    // an empty or invalid response, even if it doesn't throw an error.
    if (!explainedClauses || explainedClauses.length === 0) {
      throw new Error('The AI failed to provide clause explanations. The document might be too short or in an unsupported format.');
    }

    return {
      riskAssessment: risk,
      keyNumbers: keyNumbers.keyNumbers,
      clauseBreakdown: explainedClauses,
    };
  } catch (error) {
    console.error('Error during AI analysis:', error);
    // Provide a more user-friendly error message.
    throw new Error(
      'An unexpected error occurred during the AI analysis. Please try again later.'
    );
  }
}
