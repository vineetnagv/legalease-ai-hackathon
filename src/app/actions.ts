
'use server';

import {
  assessDocumentRisk,
} from '@/ai/flows/assess-document-risk';
import {
  extractKeyNumbers,
} from '@/ai/flows/extract-key-numbers';
import {
  explainClauses,
} from '@/ai/flows/explain-clauses';
import { suggestUserRole } from '@/ai/flows/suggest-user-role';
import type { AnalysisResult } from '@/lib/types';
import { generateFaq } from '@/ai/flows/generate-faq';
import { supportedLanguages, languageForAI } from '@/lib/types';
import { chatAboutDocument, type ChatAboutDocumentInput } from '@/ai/flows/conversational-chat';
import { detectMissingClauses } from '@/ai/flows/detect-missing-clauses';

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
 * Calls the AI flow to suggest a user role based on the document text.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to the suggested role string.
 */
export async function suggestRole(documentText: string): Promise<string> {
  if (!documentText) {
    throw new Error('Document text is required to suggest a role.');
  }
  try {
    const { suggestedRole } = await suggestUserRole({ documentText });
    return suggestedRole;
  } catch (error: any) {
    console.error('Error suggesting user role:', error);
    // Pass the specific error message forward
    throw new Error(error.message || 'An unknown error occurred while suggesting a role.');
  }
}

/**
 * Analyzes a legal document by calling multiple AI flows sequentially.
 * @param documentText The full text content of the legal document.
 * @param userRole The user's role in the agreement (e.g., "Tenant").
 * @param languageCode The language code for the output (e.g., "en", "hi").
 * @returns A promise that resolves to a consolidated `AnalysisResult` object.
 * @throws An error if documentText or userRole is missing.
 */
export async function analyzeDocument(
  documentText: string,
  userRole: string,
  languageCode: keyof typeof supportedLanguages
): Promise<AnalysisResult> {
  if (!documentText || !userRole) {
    throw new Error('Document text and user role are required for analysis.');
  }

  const language = languageForAI[languageCode];

  // Split the document into clauses for explanation.
  const clauses = splitIntoClauses(documentText);
  if (clauses.length === 0) {
    // This now throws a more specific error.
    throw new Error(
      'Could not find any paragraphs to analyze. Please ensure your document is plain text and has distinct paragraphs separated by blank lines.'
    );
  }

  try {
    // Run AI analysis flows sequentially to avoid rate-limiting.
    const risk = await assessDocumentRisk({ documentText, userRole, language });
    const keyNumbersResult = await extractKeyNumbers({ documentText, language });
    const explainedClauses = await explainClauses({ clauses, userRole, language });
    const faqResult = await generateFaq({ documentText, userRole, language });
    const missingClausesResult = await detectMissingClauses({documentText, userRole, language});

    // This check is necessary because the `explainClauses` flow can sometimes return
    // an empty or invalid response, even if it doesn't throw an error.
    // If it fails, we assume the AI couldn't handle the content.
    if (!explainedClauses || explainedClauses.length === 0) {
      throw new Error('The AI failed to provide clause explanations. The document might be too short, in an unsupported format, or contain content the AI cannot process.');
    }

    return {
      riskAssessment: risk,
      keyNumbers: keyNumbersResult.keyNumbers,
      clauseBreakdown: explainedClauses,
      faq: faqResult,
      missingClauses: missingClausesResult
    };
  } catch (error: any) {
    console.error('Error during AI analysis:', error);
    
    // Provide a more user-friendly error message that includes the specific error.
    throw new Error(error.message || 'An unexpected error occurred during the AI analysis.');
  }
}

/**
 * Handles a single turn in the conversational chat about the document.
 * @param input The input for the chat flow, including document, history, and question.
 * @returns A promise that resolves to the AI's answer.
 */
export async function getChatResponse(
  input: Omit<ChatAboutDocumentInput, 'language'> & { languageCode: keyof typeof supportedLanguages }
): Promise<string> {
  if (!input.documentText || !input.question) {
    throw new Error('Document text and a question are required.');
  }

  const language = languageForAI[input.languageCode];

  try {
    const { answer } = await chatAboutDocument({
      ...input,
      language,
    });
    return answer;
  } catch (error: any) {
    console.error('Error getting chat response:', error);
    throw new Error(error.message || 'Sorry, I encountered an unknown error while trying to answer.');
  }
}
