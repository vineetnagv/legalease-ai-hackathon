/**
 * @fileOverview Shared types and constants for document generation.
 * This file contains only types and runtime constants (no AI/server dependencies)
 * so it can be safely imported by client components.
 */

// Supported document templates
export const DocumentTemplates = [
  'Non-Disclosure Agreement (NDA)',
  'Employment Contract',
  'Service Agreement',
  'Consulting Agreement',
  'Independent Contractor Agreement',
  'Software License Agreement',
  'Partnership Agreement',
  'Lease Agreement',
  'Purchase Agreement',
  'Terms of Service',
  'Privacy Policy',
  'Custom Document',
] as const;

export type DocumentTemplate = typeof DocumentTemplates[number];
