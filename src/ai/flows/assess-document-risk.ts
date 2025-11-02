/**
 * @fileOverview A Genkit flow for assessing document risk based on user role.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DocumentType } from '@/types/document-types';

// Define the input schema
const AssessDocumentRiskInputSchema = z.object({
  documentText: z.string().describe('The full text of the legal document'),
  userRole: z.string().describe('The user\'s role in the agreement (e.g., Tenant, Landlord)'),
  documentType: DocumentType.optional().describe('The type of legal document'),
});

// Define the output schema
export const AssessDocumentRiskOutputSchema = z.object({
  riskScore: z.number().min(0).max(100).describe('Risk score from 0 (very low risk) to 100 (very high risk)'),
  riskSummary: z.string().describe('A brief, easy-to-understand summary of the main risk factors'),
});

export type AssessDocumentRiskInput = z.infer<typeof AssessDocumentRiskInputSchema>;
export type AssessDocumentRiskOutput = z.infer<typeof AssessDocumentRiskOutputSchema>;

export const assessDocumentRisk = ai.defineFlow(
  {
    name: 'assessDocumentRisk',
    inputSchema: AssessDocumentRiskInputSchema,
    outputSchema: AssessDocumentRiskOutputSchema,
  },
  async ({ documentText, userRole, documentType }) => {
    try {
      // Build document type-specific risk analysis prompt
      const getTypeSpecificRiskFactors = (docType?: string) => {
        const basePrompt = `You are an expert legal risk analyst. Your task is to assess the potential risks in this ${docType || 'legal'} document from the perspective of someone in the role of "${userRole}".`;

        let specificRisks = '';

        switch (docType) {
          case 'Lease':
            specificRisks = `
FOCUS ON LEASE-SPECIFIC RISKS:
- Rent increase clauses and frequency
- Security deposit return conditions
- Maintenance and repair responsibilities
- Early termination penalties
- Pet policies and restrictions
- Subletting restrictions
- Property access rights
- Utilities responsibility
- Late payment fees and eviction procedures`;
            break;

          case 'Employment':
            specificRisks = `
FOCUS ON EMPLOYMENT-SPECIFIC RISKS:
- Non-compete and non-solicitation clauses
- Termination conditions and severance
- Intellectual property ownership
- Overtime and compensation policies
- Confidentiality requirements
- Performance evaluation criteria
- Benefits vesting and portability
- Stock option vesting schedules`;
            break;

          case 'LoanAgreement':
            specificRisks = `
FOCUS ON LOAN-SPECIFIC RISKS:
- Interest rate changes and caps
- Prepayment penalties
- Default conditions and consequences
- Collateral requirements
- Personal guarantees
- Cross-default clauses
- Acceleration clauses
- Fees and charges`;
            break;

          case 'ServiceAgreement':
            specificRisks = `
FOCUS ON SERVICE-SPECIFIC RISKS:
- Scope creep and change orders
- Payment terms and late fees
- Intellectual property ownership
- Liability and indemnification
- Termination for convenience
- Performance standards and penalties
- Confidentiality obligations
- Dispute resolution mechanisms`;
            break;

          case 'NDA':
            specificRisks = `
FOCUS ON NDA-SPECIFIC RISKS:
- Definition scope of confidential information
- Duration of confidentiality obligations
- Permitted disclosure exceptions
- Return of materials requirements
- Breach penalties and remedies
- Mutual vs unilateral obligations
- Third-party disclosure rights`;
            break;

          case 'Purchase':
            specificRisks = `
FOCUS ON PURCHASE-SPECIFIC RISKS:
- Title and ownership transfer
- Warranties and representations
- Inspection and due diligence rights
- Financing contingencies
- Closing conditions and deadlines
- Risk of loss allocation
- Remedies for breach
- Tax and fee allocations`;
            break;

          default:
            specificRisks = `
ANALYZE GENERAL LEGAL DOCUMENT RISKS:
- Unfavorable clauses or terms
- Missing protections for the ${userRole}
- Potential financial risks
- Legal obligations that may be burdensome
- Termination conditions and penalties
- Dispute resolution mechanisms
- Any imbalanced power dynamics`;
        }

        return `${basePrompt}

${specificRisks}

Provide a risk assessment with:
1. A numerical risk score from 0-100 where:
   - 0-30: Low risk (generally favorable or balanced terms)
   - 31-70: Medium risk (some concerning clauses, review recommended)
   - 71-100: High risk (significant red flags, legal review strongly recommended)

2. A concise risk summary (2-3 sentences) explaining the main risk factors in plain English.

Document to analyze:
${documentText}

User Role: ${userRole}
Document Type: ${docType || 'General Legal Document'}

Return the assessment in this JSON format:
{
  "riskScore": [number between 0-100],
  "riskSummary": "[Brief explanation of main risks]"
}`;
      };

      const response = await ai.generate({
        prompt: getTypeSpecificRiskFactors(documentType),
        output: {
          format: 'json',
          schema: AssessDocumentRiskOutputSchema,
        },
      });

      // Parse and validate the response
      const result = response.output;

      if (!result || typeof result.riskScore !== 'number' || !result.riskSummary) {
        console.warn('AI returned invalid risk assessment response');
        return {
          riskScore: 50,
          riskSummary: 'Unable to properly assess document risk. Please review the document carefully.'
        };
      }

      // Ensure risk score is within bounds
      const boundedRiskScore = Math.max(0, Math.min(100, result.riskScore));

      console.log('Risk assessment completed:', {
        score: boundedRiskScore,
        summary: result.riskSummary.substring(0, 100) + '...'
      });

      return {
        riskScore: boundedRiskScore,
        riskSummary: result.riskSummary
      };

    } catch (error) {
      console.error('Error in assessDocumentRisk flow:', error);
      return {
        riskScore: 50,
        riskSummary: 'An error occurred during risk assessment. Please review the document manually or try again.'
      };
    }
  }
);