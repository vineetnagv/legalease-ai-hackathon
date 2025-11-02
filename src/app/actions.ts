
'use server';

import { suggestUserRole } from '@/ai/flows/suggest-user-role';
import { extractKeyNumbers, type ExtractKeyNumbersOutput, type ExtractKeyNumbersInput } from '@/ai/flows/extract-key-numbers';
import { assessDocumentRisk, type AssessDocumentRiskInput, type AssessDocumentRiskOutput } from '@/ai/flows/assess-document-risk';
import { explainClauses, type ExplainClausesInput, type ExplainClausesOutput } from '@/ai/flows/explain-clauses';
import { generateFaq, type GenerateFaqInput, type GenerateFaqOutput } from '@/ai/flows/generate-faq';
import { detectDocumentType } from '@/ai/flows/detect-document-type';
import { chatWithDocument, type ChatWithDocumentInput, type ChatWithDocumentOutput } from '@/ai/flows/chat-with-document';
import { detectMissingClauses, type DetectMissingClausesInput, type DetectMissingClausesOutput } from '@/ai/flows/detect-missing-clauses';
import { summarizeDocument, type SummarizeDocumentInput, type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { generateGlossary, type GenerateGlossaryInput, type GenerateGlossaryOutput } from '@/ai/flows/generate-glossary';
import { redraftDocument, type RedraftDocumentInput, type RedraftDocumentOutput } from '@/ai/flows/redraft-document';
import { generateDocument, type GenerateDocumentInput, type GenerateDocumentOutput } from '@/ai/flows/generate-document';

import { type DetectDocumentTypeOutput, type DocumentType } from '@/types/document-types';
import { type ChatMessage, type DocumentContext, type SuggestedQuestion } from '@/types/chat-types';
import { SuggestedQuestionsService } from '@/lib/suggested-questions';

/**
 * Calls an AI model to suggest a user's role based on the document's text.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to the suggested role string.
 * @throws An error if the document text is empty.
 */
export async function suggestRole(documentText: string): Promise<string> {
  if (!documentText) {
    throw new Error('Document text is required to suggest a role.');
  }

  const role = await suggestUserRole(documentText);
  return role;
}

/**
 * Calls an AI model to extract key numbers and dates from the document's text.
 * @param documentText The text content of the legal document.
 * @param documentType Optional document type for context-aware extraction.
 * @returns A promise that resolves to the extracted key numbers and dates.
 * @throws An error if the document text is empty.
 */
export async function extractDocumentKeyNumbers(
  documentText: string,
  documentType?: DocumentType
): Promise<ExtractKeyNumbersOutput> {
  if (!documentText) {
    throw new Error('Document text is required to extract key numbers.');
  }

  const result = await extractKeyNumbers({ documentText, documentType });
  return result;
}

/**
 * Calls an AI model to assess the risk level of a document for a specific user role.
 * @param documentText The text content of the legal document.
 * @param userRole The user's role in the agreement (e.g., "Tenant", "Landlord").
 * @param documentType Optional document type for context-aware risk assessment.
 * @returns A promise that resolves to the risk assessment with score and summary.
 * @throws An error if the document text or user role is empty.
 */
export async function assessDocumentRiskLevel(
  documentText: string,
  userRole: string,
  documentType?: DocumentType
): Promise<AssessDocumentRiskOutput> {
  if (!documentText) {
    throw new Error('Document text is required to assess risk.');
  }

  if (!userRole) {
    throw new Error('User role is required to assess risk.');
  }

  const result = await assessDocumentRisk({ documentText, userRole, documentType });
  return result;
}

/**
 * Calls an AI model to explain legal clauses in plain English with jargon definitions.
 * @param documentText The text content of the legal document.
 * @param userRole The user's role in the agreement (e.g., "Tenant", "Landlord").
 * @returns A promise that resolves to clause explanations with plain English translations.
 * @throws An error if the document text or user role is empty.
 */
export async function explainDocumentClauses(documentText: string, userRole: string): Promise<ExplainClausesOutput> {
  if (!documentText) {
    throw new Error('Document text is required to explain clauses.');
  }

  if (!userRole) {
    throw new Error('User role is required to explain clauses.');
  }

  const result = await explainClauses({ documentText, userRole });
  return result;
}

/**
 * Calls an AI model to generate frequently asked questions about the legal document.
 * @param documentText The text content of the legal document.
 * @param userRole The user's role in the agreement (e.g., "Tenant", "Landlord").
 * @returns A promise that resolves to FAQ items with questions and answers.
 * @throws An error if the document text or user role is empty.
 */
export async function generateDocumentFAQs(documentText: string, userRole: string): Promise<GenerateFaqOutput> {
  if (!documentText) {
    throw new Error('Document text is required to generate FAQs.');
  }

  if (!userRole) {
    throw new Error('User role is required to generate FAQs.');
  }

  const result = await generateFaq({ documentText, userRole });
  return result;
}

/**
 * Detects the type of legal document based on its content.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to the document type classification result.
 * @throws An error if the document text is empty.
 */
export async function detectDocumentTypeFromText(documentText: string): Promise<DetectDocumentTypeOutput> {
  if (!documentText || documentText.trim() === '') {
    throw new Error('Document text is required to detect document type.');
  }

  const result = await detectDocumentType({ documentText });
  return result;
}

/**
 * Sends a chat message to the AI with full document context and conversation history.
 * @param message The user's message.
 * @param conversationHistory Array of previous messages in the conversation.
 * @param documentContext Full context of the document analysis.
 * @returns A promise that resolves to the AI response with suggested follow-ups.
 * @throws An error if required parameters are missing.
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  documentContext: DocumentContext
): Promise<ChatWithDocumentOutput> {
  if (!message || message.trim() === '') {
    throw new Error('Message is required to send a chat message.');
  }

  if (!documentContext) {
    throw new Error('Document context is required for chat functionality.');
  }

  const result = await chatWithDocument({
    message: message.trim(),
    conversationHistory,
    documentContext
  });

  return result;
}

/**
 * Generates intelligent suggested questions based on document analysis context.
 * @param documentContext Full context of the document analysis.
 * @returns Array of suggested questions prioritized by relevance.
 */
export async function generateSuggestedQuestions(documentContext: DocumentContext): Promise<SuggestedQuestion[]> {
  if (!documentContext) {
    throw new Error('Document context is required to generate suggested questions.');
  }

  return SuggestedQuestionsService.generateSuggestedQuestions(documentContext);
}

/**
 * Generates contextual follow-up questions based on the user's last message.
 * @param lastUserMessage The user's most recent message.
 * @param documentContext Full context of the document analysis.
 * @returns Array of follow-up question strings.
 */
export async function generateFollowUpQuestions(
  lastUserMessage: string,
  documentContext: DocumentContext
): Promise<string[]> {
  if (!lastUserMessage || lastUserMessage.trim() === '') {
    throw new Error('Last user message is required to generate follow-up questions.');
  }

  if (!documentContext) {
    throw new Error('Document context is required to generate follow-up questions.');
  }

  return SuggestedQuestionsService.getFollowUpQuestions(lastUserMessage, documentContext);
}

/**
 * Analyzes a legal document to identify important clauses that may be missing.
 * @param documentText The text content of the legal document.
 * @param userRole The user's role in the agreement (e.g., "Tenant", "Landlord").
 * @param documentType Optional document type for context-aware analysis.
 * @returns A promise that resolves to missing clause analysis with recommendations.
 * @throws An error if the document text or user role is empty.
 */
export async function detectMissingClausesInDocument(
  documentText: string,
  userRole: string,
  documentType?: DocumentType
): Promise<DetectMissingClausesOutput> {
  if (!documentText) {
    throw new Error('Document text is required to detect missing clauses.');
  }

  if (!userRole) {
    throw new Error('User role is required to detect missing clauses.');
  }

  const result = await detectMissingClauses({ documentText, userRole, documentType });
  return result;
}

/**
 * Calls an AI model to summarize a legal document.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to the summary of the document.
 * @throws An error if the document text is empty.
 */
export async function summarize(documentText: string): Promise<SummarizeDocumentOutput> {
  if (!documentText) {
    throw new Error('Document text is required to summarize.');
  }

  const result = await summarizeDocument({ documentText });
  return result;
}

/**
 * Calls an AI model to generate a glossary of key terms from a legal document.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to the glossary of the document.
 * @throws An error if the document text is empty.
 */
export async function glossary(documentText: string): Promise<GenerateGlossaryOutput> {
  if (!documentText) {
    throw new Error('Document text is required to generate a glossary.');
  }

  const result = await generateGlossary({ documentText });
  return result;
}

/**
 * Calls an AI model to redraft a legal document with improvements.
 * @param documentText The text content of the original legal document.
 * @param riskAnalysis The risk analysis of the document.
 * @param missingClauses The missing clauses analysis of the document.
 * @returns A promise that resolves to the redrafted document and a summary of changes.
 * @throws An error if the document text is empty.
 */
export async function redraft(
  documentText: string,
  riskAnalysis?: AssessDocumentRiskOutput,
  missingClauses?: DetectMissingClausesOutput
): Promise<RedraftDocumentOutput> {
  if (!documentText) {
    throw new Error('Document text is required to redraft.');
  }

  const result = await redraftDocument({ documentText, riskAnalysis, missingClauses });
  return result;
}

/**
 * Calls an AI model to generate a legal document.
 * Supports template-based, custom, and context-aware generation.
 * @param input The input configuration for document generation.
 * @returns A promise that resolves to the generated document with metadata.
 * @throws An error if the input is invalid.
 */
export async function generate(input: GenerateDocumentInput): Promise<GenerateDocumentOutput> {
  // Validate input based on mode
  if (input.mode === 'template' && !input.templateType) {
    throw new Error('Template type is required for template mode.');
  }

  if (input.mode === 'custom' && !input.customPrompt) {
    throw new Error('Custom prompt is required for custom mode.');
  }

  if (input.mode === 'contextual' && !input.contextDocument) {
    throw new Error('Context document is required for contextual mode.');
  }

  const result = await generateDocument(input);
  return result;
}
