
'use server';

import {
  assessDocumentRisk,
  type AssessDocumentRiskInput,
  type AssessDocumentRiskOutput,
} from '@/ai/flows/assess-document-risk';
import {
  extractKeyNumbers,
  type ExtractKeyNumbersInput,
  type ExtractKeyNumbersOutput,
} from '@/ai/flows/extract-key-numbers';
import {
  explainClauses,
  type ExplainClausesInput,
  type ExplainClausesOutput,
} from '@/ai/flows/explain-clauses';
import { suggestUserRole } from '@/ai/flows/suggest-user-role';
import {
  generateFaq,
  type GenerateFaqInput,
  type GenerateFaqOutput,
} from '@/ai/flows/generate-faq';
import { supportedLanguages, languageForAI } from '@/lib/types';
import {
  chatAboutDocument,
  type ChatAboutDocumentInput,
} from '@/ai/flows/conversational-chat';
import {
  detectMissingClauses,
  type DetectMissingClausesInput,
  type DetectMissingClausesOutput,
} from '@/ai/flows/detect-missing-clauses';

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
    throw new Error(
      error.message || 'An unknown error occurred while suggesting a role.'
    );
  }
}

// Helper to get language name for AI
const getLanguageForAI = (languageCode: keyof typeof supportedLanguages) => languageForAI[languageCode];

// Individual server actions for each analysis step
export async function getRisk(input: AssessDocumentRiskInput): Promise<AssessDocumentRiskOutput> {
    try {
        return await assessDocumentRisk(input);
    } catch (error: any) {
        console.error('Error in getRisk:', error);
        throw new Error(error.message || 'Failed to assess document risk.');
    }
}

export async function getKeyNumbers(input: ExtractKeyNumbersInput): Promise<ExtractKeyNumbersOutput> {
    try {
        return await extractKeyNumbers(input);
    } catch (error: any) {
        console.error('Error in getKeyNumbers:', error);
        throw new Error(error.message || 'Failed to extract key numbers.');
    }
}

export async function getExplainedClauses(documentText: string, userRole: string, languageCode: keyof typeof supportedLanguages): Promise<ExplainClausesOutput> {
    try {
        const clauses = splitIntoClauses(documentText);
        if (clauses.length === 0) {
            throw new Error('Could not find any paragraphs to analyze. Please ensure your document is plain text and has distinct paragraphs separated by blank lines.');
        }
        const language = getLanguageForAI(languageCode);
        const explainedClauses = await explainClauses({ clauses, userRole, language });
        if (!explainedClauses || explainedClauses.length === 0) {
            throw new Error('The AI failed to provide clause explanations. The document might be too short, in an unsupported format, or contain content the AI cannot process.');
        }
        return explainedClauses;
    } catch (error: any) {
        console.error('Error in getExplainedClauses:', error);
        throw new Error(error.message || 'Failed to explain clauses.');
    }
}

export async function getFaq(input: GenerateFaqInput): Promise<GenerateFaqOutput> {
    try {
        return await generateFaq(input);
    } catch (error: any) {
        console.error('Error in getFaq:', error);
        throw new Error(error.message || 'Failed to generate FAQ.');
    }
}

export async function getMissingClauses(input: DetectMissingClausesInput): Promise<DetectMissingClausesOutput> {
    try {
        return await detectMissingClauses(input);
    } catch (error: any) {
        console.error('Error in getMissingClauses:', error);
        throw new Error(error.message || 'Failed to detect missing clauses.');
    }
}


/**
 * Handles a single turn in the conversational chat about the document.
 * @param input The input for the chat flow, including document, history, and question.
 * @returns A promise that resolves to the AI's answer.
 */
export async function getChatResponse(
  input: Omit<ChatAboutDocumentInput, 'language'> & {
    languageCode: keyof typeof supportedLanguages;
  }
): Promise<string> {
  if (!input.documentText || !input.question) {
    throw new Error('Document text and a question are required.');
  }

  const language = getLanguageForAI(input.languageCode);

  try {
    const { answer } = await chatAboutDocument({
      ...input,
      language,
    });
    return answer;
  } catch (error: any) {
    console.error('Error getting chat response:', error);
    throw new Error(
      error.message ||
        'Sorry, I encountered an unknown error while trying to answer.'
    );
  }
}
