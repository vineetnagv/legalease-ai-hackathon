/**
 * @fileOverview Chat-related types and interfaces for the document chatbot.
 */

import { z } from 'zod';
import { DocumentType } from './document-types';
import type { KeyNumber } from '@/ai/flows/extract-key-numbers';
import type { ClauseExplanation } from '@/ai/flows/explain-clauses';
import type { FAQItem } from '@/ai/flows/generate-faq';

// Chat message role enumeration
export const ChatMessageRole = z.enum(['user', 'assistant']);
export type ChatMessageRole = z.infer<typeof ChatMessageRole>;

// Individual chat message
export const ChatMessage = z.object({
  id: z.string().describe('Unique message ID'),
  role: ChatMessageRole,
  content: z.string().describe('Message content'),
  timestamp: z.date().describe('When the message was sent'),
});

export type ChatMessage = z.infer<typeof ChatMessage>;

// Document analysis context for the AI chatbot
export const DocumentContext = z.object({
  documentType: DocumentType,
  documentTypeConfidence: z.number().min(0).max(100),
  userRole: z.string().describe('User\'s role in the document (e.g., Tenant, Employee)'),
  documentText: z.string().describe('Original document text for reference'),

  // Analysis results from the waterfall
  keyNumbers: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).describe('Extracted key numbers and dates'),

  riskScore: z.number().min(0).max(100).nullable(),
  riskSummary: z.string(),

  clauses: z.array(z.object({
    clauseTitle: z.string(),
    originalText: z.string(),
    plainEnglish: z.string(),
    jargon: z.array(z.object({
      term: z.string(),
      definition: z.string()
    }))
  })).describe('Explained legal clauses'),

  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).describe('Generated FAQs'),
});

export type DocumentContext = z.infer<typeof DocumentContext>;

// Chat session state
export const ChatSession = z.object({
  sessionId: z.string().describe('Unique session identifier'),
  documentContext: DocumentContext,
  conversationHistory: z.array(ChatMessage),
  isActive: z.boolean().describe('Whether the chat session is currently active'),
  startedAt: z.date(),
  lastMessageAt: z.date().nullable(),
});

export type ChatSession = z.infer<typeof ChatSession>;

// Suggested questions for the chat interface
export const SuggestedQuestion = z.object({
  id: z.string(),
  text: z.string().describe('The question text to display'),
  category: z.enum(['general', 'risk', 'clauses', 'negotiation', 'missing']).describe('Question category'),
  priority: z.number().min(1).max(10).describe('Priority for display order'),
});

export type SuggestedQuestion = z.infer<typeof SuggestedQuestion>;

// Input schema for chat AI flow
export const ChatWithDocumentInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationHistory: z.array(ChatMessage),
  documentContext: DocumentContext,
});

// Output schema for chat AI flow
export const ChatWithDocumentOutputSchema = z.object({
  response: z.string().describe('AI response message'),
  suggestedFollowUps: z.array(z.string()).optional().describe('Suggested follow-up questions'),
  referencedSections: z.array(z.string()).optional().describe('Document sections referenced in response'),
});

export type ChatWithDocumentInput = z.infer<typeof ChatWithDocumentInputSchema>;
export type ChatWithDocumentOutput = z.infer<typeof ChatWithDocumentOutputSchema>;

// Helper type for creating suggested questions based on analysis results
export interface SuggestedQuestionGenerator {
  documentType: DocumentType;
  riskScore: number | null;
  hasKeyNumbers: boolean;
  hasRiskyTerms: boolean;
  userRole: string;
}