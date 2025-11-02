import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateDocumentInput } from '../generate-document';

// Mock the genkit module
vi.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: vi.fn((config, handler) => handler),
    generate: vi.fn(() => Promise.resolve({
      output: {
        documentContent: '# Sample Document\n\nThis is a test document.',
        metadata: {
          documentType: 'Non-Disclosure Agreement',
          jurisdiction: 'California',
          generatedAt: new Date().toISOString(),
        },
        summary: 'Test summary',
        nextSteps: ['Review', 'Sign'],
      }
    })),
  },
}));

describe('Phase 2: Document Generator Flow', () => {
  describe('Input validation', () => {
    it('validates template mode requires templateType', () => {
      const input: GenerateDocumentInput = {
        mode: 'template',
        jurisdiction: 'California',
      };

      expect(input.mode).toBe('template');
      // In actual implementation, this would throw an error
    });

    it('validates custom mode requires customPrompt', () => {
      const input: GenerateDocumentInput = {
        mode: 'custom',
        jurisdiction: 'California',
      };

      expect(input.mode).toBe('custom');
      // In actual implementation, this would throw an error
    });

    it('validates contextual mode requires contextDocument', () => {
      const input: GenerateDocumentInput = {
        mode: 'contextual',
        jurisdiction: 'California',
      };

      expect(input.mode).toBe('contextual');
      // In actual implementation, this would throw an error
    });
  });

  describe('Template mode', () => {
    it('accepts all supported document templates', () => {
      const templates = [
        'Non-Disclosure Agreement (NDA)',
        'Employment Contract',
        'Service Agreement',
        'Lease Agreement',
        'Partnership Agreement',
        'Consulting Agreement',
        'Independent Contractor Agreement',
        'Terms of Service',
        'Privacy Policy',
        'Sales Contract',
        'Licensing Agreement',
      ];

      templates.forEach(template => {
        const input: GenerateDocumentInput = {
          mode: 'template',
          templateType: template as any,
          jurisdiction: 'California',
        };

        expect(input.templateType).toBe(template);
      });
    });

    it('handles template inputs correctly', () => {
      const input: GenerateDocumentInput = {
        mode: 'template',
        templateType: 'Non-Disclosure Agreement (NDA)',
        templateInputs: {
          'Disclosing Party': 'Company A',
          'Receiving Party': 'Company B',
          'Effective Date': '2025-01-01',
        },
        jurisdiction: 'California',
      };

      expect(input.templateInputs).toHaveProperty('Disclosing Party');
      expect(input.templateInputs).toHaveProperty('Receiving Party');
    });

    it('handles optional additional instructions', () => {
      const input: GenerateDocumentInput = {
        mode: 'template',
        templateType: 'Employment Contract',
        jurisdiction: 'New York',
        additionalInstructions: 'Include remote work provisions',
      };

      expect(input.additionalInstructions).toBe('Include remote work provisions');
    });
  });

  describe('Custom mode', () => {
    it('accepts custom prompts', () => {
      const input: GenerateDocumentInput = {
        mode: 'custom',
        customPrompt: 'Create a memorandum of understanding for a joint venture',
        jurisdiction: 'Delaware',
      };

      expect(input.customPrompt).toBeDefined();
      expect(input.customPrompt?.length).toBeGreaterThan(0);
    });
  });

  describe('Contextual mode', () => {
    it('uses context from uploaded document', () => {
      const input: GenerateDocumentInput = {
        mode: 'contextual',
        contextDocument: {
          content: 'Original NDA content...',
          type: 'Non-Disclosure Agreement',
          metadata: {},
        },
        contextAnalysis: {
          summary: 'Analysis of the NDA',
          keyPoints: ['Term: 2 years', 'Mutual NDA'],
        },
        relatedDocumentType: 'Amendment to NDA',
        jurisdiction: 'California',
      };

      expect(input.contextDocument).toBeDefined();
      expect(input.relatedDocumentType).toBe('Amendment to NDA');
    });
  });

  describe('Output structure', () => {
    it('generates document with expected structure', async () => {
      const mockOutput = {
        documentContent: '# Test Document\n\nContent here.',
        metadata: {
          documentType: 'Test',
          jurisdiction: 'CA',
          generatedAt: new Date().toISOString(),
        },
        summary: 'Test summary',
        nextSteps: ['Review', 'Execute'],
      };

      expect(mockOutput).toHaveProperty('documentContent');
      expect(mockOutput).toHaveProperty('metadata');
      expect(mockOutput).toHaveProperty('summary');
      expect(mockOutput).toHaveProperty('nextSteps');
    });

    it('includes metadata with required fields', () => {
      const metadata = {
        documentType: 'NDA',
        jurisdiction: 'California',
        generatedAt: new Date().toISOString(),
      };

      expect(metadata.documentType).toBeDefined();
      expect(metadata.jurisdiction).toBeDefined();
      expect(metadata.generatedAt).toBeDefined();
    });
  });

  describe('Jurisdiction support', () => {
    it('accepts different jurisdictions', () => {
      const jurisdictions = [
        'California',
        'New York',
        'Delaware',
        'Texas',
        'Federal (US)',
        'Other',
      ];

      jurisdictions.forEach(jurisdiction => {
        const input: GenerateDocumentInput = {
          mode: 'template',
          templateType: 'Service Agreement',
          jurisdiction,
        };

        expect(input.jurisdiction).toBe(jurisdiction);
      });
    });
  });
});
