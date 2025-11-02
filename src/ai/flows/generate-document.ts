/**
 * @fileOverview A Genkit flow for generating legal documents.
 * Supports template-based, custom, and context-aware generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DocumentTemplates, type DocumentTemplate } from '@/types/document-generator-types';

// Re-export for backward compatibility
export { DocumentTemplates, type DocumentTemplate };

const GenerateDocumentInputSchema = z.object({
  mode: z.enum(['template', 'custom', 'contextual']).describe('Generation mode: template, custom, or contextual'),

  // For template mode
  templateType: z.enum(DocumentTemplates).optional().describe('The type of document template to use'),
  templateInputs: z.record(z.string()).optional().describe('Key-value pairs for template fields (e.g., party names, dates, amounts)'),

  // For custom mode
  customPrompt: z.string().optional().describe('Free-form description of the document to generate'),

  // For contextual mode (using uploaded document analysis)
  contextDocument: z.string().optional().describe('The uploaded document text for context'),
  contextAnalysis: z.object({
    documentType: z.string().optional(),
    keyNumbers: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
    riskScore: z.number().optional(),
    riskSummary: z.string().optional(),
    missingClauses: z.array(z.object({
      clauseTitle: z.string(),
      description: z.string(),
    })).optional(),
  }).optional().describe('Analysis results from the uploaded document'),
  relatedDocumentType: z.string().optional().describe('Type of related document to generate (e.g., "addendum", "amendment", "counter-proposal")'),

  // Common options
  jurisdiction: z.string().optional().describe('Legal jurisdiction (e.g., "California, USA", "New York, USA")'),
  additionalInstructions: z.string().optional().describe('Any additional instructions or requirements'),
});

const GenerateDocumentOutputSchema = z.object({
  document: z.string().describe('The generated legal document in markdown format'),
  metadata: z.object({
    documentType: z.string().describe('The type of document generated'),
    sections: z.array(z.string()).describe('List of main sections in the document'),
    wordCount: z.number().describe('Approximate word count'),
    suggestedFilename: z.string().describe('Suggested filename for the document'),
  }),
  summary: z.string().describe('A brief summary of what was generated and key terms'),
  nextSteps: z.array(z.string()).describe('Recommended next steps after generating this document'),
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;
export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;

export const generateDocument = ai.defineFlow(
  {
    name: 'generateDocument',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {
    let prompt = '';

    // Build prompt based on mode
    if (input.mode === 'template' && input.templateType) {
      prompt = buildTemplatePrompt(input.templateType, input.templateInputs, input.jurisdiction, input.additionalInstructions);
    } else if (input.mode === 'custom' && input.customPrompt) {
      prompt = buildCustomPrompt(input.customPrompt, input.jurisdiction, input.additionalInstructions);
    } else if (input.mode === 'contextual' && input.contextDocument) {
      prompt = buildContextualPrompt(
        input.contextDocument,
        input.contextAnalysis,
        input.relatedDocumentType,
        input.jurisdiction,
        input.additionalInstructions
      );
    } else {
      throw new Error('Invalid input: mode and required fields must be provided');
    }

    const response = await ai.generate({
      prompt,
      output: {
        format: 'json',
        schema: GenerateDocumentOutputSchema,
      },
    });

    return response.output || {
      document: '',
      metadata: {
        documentType: 'Unknown',
        sections: [],
        wordCount: 0,
        suggestedFilename: 'document.md',
      },
      summary: '',
      nextSteps: [],
    };
  }
);

// Helper: Build template-based prompt
function buildTemplatePrompt(
  templateType: DocumentTemplate,
  inputs?: Record<string, string>,
  jurisdiction?: string,
  additionalInstructions?: string
): string {
  let prompt = `Generate a professional ${templateType} document.

## Document Requirements
- **Template Type:** ${templateType}
- **Jurisdiction:** ${jurisdiction || 'United States'}
- **Format:** Professional legal document with clear sections and proper formatting
- **Language:** Clear, legally sound, and accessible`;

  if (inputs && Object.keys(inputs).length > 0) {
    prompt += `

## Template Information
`;
    Object.entries(inputs).forEach(([key, value]) => {
      prompt += `- **${key}:** ${value}\n`;
    });
  }

  if (additionalInstructions) {
    prompt += `

## Additional Instructions
${additionalInstructions}`;
  }

  prompt += `

## Output Requirements
1. Generate a complete, professional ${templateType}
2. Include all standard sections and clauses appropriate for this document type
3. Use proper legal formatting with numbered sections
4. Include signature blocks and date fields where appropriate
5. Provide the document in clean markdown format
6. Include metadata about sections, word count, and suggested filename
7. Provide a brief summary of key terms and obligations
8. Suggest next steps for the user

Generate the document now.`;

  return prompt;
}

// Helper: Build custom prompt
function buildCustomPrompt(
  customPrompt: string,
  jurisdiction?: string,
  additionalInstructions?: string
): string {
  let prompt = `Generate a legal document based on the following description:

## User Request
${customPrompt}

## Requirements
- **Jurisdiction:** ${jurisdiction || 'United States'}
- **Format:** Professional legal document with clear sections
- **Language:** Clear, legally sound, and accessible`;

  if (additionalInstructions) {
    prompt += `

## Additional Instructions
${additionalInstructions}`;
  }

  prompt += `

## Output Requirements
1. Analyze the user's request and determine the appropriate document type
2. Generate a complete, professional legal document
3. Include all relevant sections and clauses
4. Use proper legal formatting with numbered sections
5. Provide the document in clean markdown format
6. Include metadata about document type, sections, word count, and suggested filename
7. Provide a brief summary of what was generated
8. Suggest next steps for the user

Generate the document now.`;

  return prompt;
}

// Helper: Build contextual prompt
function buildContextualPrompt(
  contextDocument: string,
  contextAnalysis?: any,
  relatedDocumentType?: string,
  jurisdiction?: string,
  additionalInstructions?: string
): string {
  let prompt = `Generate a legal document related to an existing document.

## Context: Existing Document
${contextDocument.substring(0, 2000)}${contextDocument.length > 2000 ? '...(truncated)' : ''}`;

  if (contextAnalysis) {
    prompt += `

## Analysis of Existing Document`;

    if (contextAnalysis.documentType) {
      prompt += `
- **Document Type:** ${contextAnalysis.documentType}`;
    }

    if (contextAnalysis.riskScore) {
      prompt += `
- **Risk Score:** ${contextAnalysis.riskScore}/100
- **Risk Summary:** ${contextAnalysis.riskSummary}`;
    }

    if (contextAnalysis.keyNumbers && contextAnalysis.keyNumbers.length > 0) {
      prompt += `
- **Key Terms:**`;
      contextAnalysis.keyNumbers.slice(0, 5).forEach((kn: any) => {
        prompt += `\n  - ${kn.label}: ${kn.value}`;
      });
    }

    if (contextAnalysis.missingClauses && contextAnalysis.missingClauses.length > 0) {
      prompt += `
- **Missing Clauses:**`;
      contextAnalysis.missingClauses.slice(0, 5).forEach((clause: any) => {
        prompt += `\n  - ${clause.clauseTitle}: ${clause.description}`;
      });
    }
  }

  prompt += `

## Task
Generate a ${relatedDocumentType || 'related document'} based on the context above.`;

  if (jurisdiction) {
    prompt += `
- **Jurisdiction:** ${jurisdiction}`;
  }

  if (additionalInstructions) {
    prompt += `

## Additional Instructions
${additionalInstructions}`;
  }

  prompt += `

## Output Requirements
1. Generate a professional legal document that relates to the context provided
2. Ensure consistency with key terms and parties from the original document
3. ${relatedDocumentType === 'addendum' || relatedDocumentType === 'amendment' ? 'Reference the original document and specify what is being added or changed' : 'Create a complementary document that works alongside the original'}
4. Use proper legal formatting with numbered sections
5. Provide the document in clean markdown format
6. Include metadata about document type, sections, word count, and suggested filename
7. Provide a brief summary of what was generated
8. Suggest next steps for the user

Generate the document now.`;

  return prompt;
}
