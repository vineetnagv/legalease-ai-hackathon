/**
 * @fileOverview Shared document type definitions and schemas.
 * This file contains all document-related types and Zod schemas.
 * It does NOT use 'use server' so it can export objects and types.
 */

import { z } from 'zod';

// Common document type categories (for reference and fallback)
export const CommonDocumentTypes = [
  'Lease',
  'Employment',
  'ServiceAgreement',
  'LoanAgreement',
  'NDA',
  'Purchase',
  'Contract',
  'Other'
] as const;

// Document type is now a flexible string that can be any type, not just predefined ones
export const DocumentType = z.string().min(1, 'Document type cannot be empty');

export type DocumentType = z.infer<typeof DocumentType>;

// Input schema for document type detection
export const DetectDocumentTypeInputSchema = z.object({
  documentText: z.string().min(1, 'Document text is required'),
});

// Output schema for document type detection with confidence scoring
export const DetectDocumentTypeOutputSchema = z.object({
  documentType: DocumentType,
  confidence: z.number().min(0).max(100).describe('Confidence score from 0-100'),
  reasoning: z.string().describe('Brief explanation for the classification'),
});

// Inferred types
export type DetectDocumentTypeInput = z.infer<typeof DetectDocumentTypeInputSchema>;
export type DetectDocumentTypeOutput = z.infer<typeof DetectDocumentTypeOutputSchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.date(),
  // Top-level metadata
  documentType: z.string().optional(),
  documentTypeConfidence: z.number().optional(),
  userRole: z.string().optional(),
  // Optional analysis results
  analysis: z.object({
    documentType: z.string().optional(),
    documentTypeConfidence: z.number().optional(),
    keyNumbers: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
    riskScore: z.number().optional(),
    riskSummary: z.string().optional(),
    missingClauses: z.any().optional(), // DetectMissingClausesOutput
    clauses: z.array(z.any()).optional(), // ClauseExplanation[]
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }).optional(),
});

export type Document = z.infer<typeof DocumentSchema>;