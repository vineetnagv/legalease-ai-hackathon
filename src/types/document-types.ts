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