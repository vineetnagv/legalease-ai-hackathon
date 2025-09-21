'use server';
/**
 * @fileOverview A Genkit flow for detecting important clauses missing from legal documents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DocumentType } from '@/types/document-types';

// Define the input schema
const DetectMissingClausesInputSchema = z.object({
  documentText: z.string().describe('The full text of the legal document'),
  userRole: z.string().describe('The user\'s role in the agreement (e.g., Tenant, Landlord)'),
  documentType: DocumentType.optional().describe('The type of legal document'),
});

// Define the output schema
const DetectMissingClausesOutputSchema = z.object({
  missingClauses: z.array(z.object({
    clauseTitle: z.string().describe('Title of the missing clause'),
    importance: z.enum(['Critical', 'Important', 'Recommended']).describe('How important this missing clause is'),
    description: z.string().describe('What this clause would protect or address'),
    riskWithoutClause: z.string().describe('The risk of not having this clause'),
    suggestedLanguage: z.string().optional().describe('Example language that could be added'),
  })).describe('Array of important clauses that are missing from the document'),
  overallCompleteness: z.number().min(0).max(100).describe('Overall completeness score of the document (0-100)'),
  summary: z.string().describe('Brief summary of the most important missing protections'),
});

export type DetectMissingClausesInput = z.infer<typeof DetectMissingClausesInputSchema>;
export type DetectMissingClausesOutput = z.infer<typeof DetectMissingClausesOutputSchema>;

export const detectMissingClauses = ai.defineFlow(
  {
    name: 'detectMissingClauses',
    inputSchema: DetectMissingClausesInputSchema,
    outputSchema: DetectMissingClausesOutputSchema,
  },
  async ({ documentText, userRole, documentType }) => {
    try {
      // Build document type-specific missing clause analysis prompt
      const getTypeSpecificMissingClauses = (docType?: string) => {
        const basePrompt = `You are an expert legal analyst specializing in identifying missing clauses and protections in ${docType || 'legal'} documents. Your task is to analyze this document from the perspective of someone in the role of "${userRole}" and identify important clauses that are missing.`;

        let specificClauses = '';

        switch (docType) {
          case 'Lease':
            specificClauses = `
ANALYZE FOR MISSING LEASE CLAUSES:
- Security deposit return procedures and timeline
- Maintenance and repair responsibility allocation
- Early termination conditions and penalties
- Rent increase limitations and notice requirements
- Pet policies and deposits
- Subletting and assignment rights
- Property access rights and notice requirements
- Utilities responsibility and payment
- Parking and storage provisions
- Noise and conduct restrictions
- Move-out procedures and cleaning requirements
- Habitability warranties and tenant remedies
- Property insurance requirements
- Dispute resolution procedures`;
            break;

          case 'Employment':
            specificClauses = `
ANALYZE FOR MISSING EMPLOYMENT CLAUSES:
- Termination procedures and severance provisions
- Non-compete and non-solicitation limitations
- Intellectual property ownership and assignment
- Confidentiality and trade secret protections
- Performance evaluation criteria and procedures
- Benefits eligibility and vesting schedules
- Overtime compensation and work hour policies
- Vacation and sick leave policies
- Professional development and training provisions
- Dispute resolution and arbitration clauses
- Stock option or equity compensation terms
- Remote work and flexible schedule policies
- Whistleblower protection provisions`;
            break;

          case 'LoanAgreement':
            specificClauses = `
ANALYZE FOR MISSING LOAN CLAUSES:
- Default definition and cure periods
- Prepayment rights and penalties
- Interest rate change notifications
- Collateral description and valuation procedures
- Personal guarantee limitations
- Cross-default protections
- Acceleration and demand provisions
- Insurance requirements on collateral
- Financial reporting obligations
- Use of proceeds restrictions
- Right to substitute collateral
- Bankruptcy and insolvency protections`;
            break;

          case 'ServiceAgreement':
            specificClauses = `
ANALYZE FOR MISSING SERVICE AGREEMENT CLAUSES:
- Scope of work and deliverable specifications
- Change order procedures and pricing
- Payment terms and late fee provisions
- Intellectual property ownership and licensing
- Liability limitations and indemnification
- Termination for convenience procedures
- Performance standards and service level agreements
- Confidentiality and data protection provisions
- Force majeure and excuse provisions
- Dispute resolution and arbitration clauses
- Warranty and remedy provisions
- Subcontractor and assignment restrictions`;
            break;

          case 'NDA':
            specificClauses = `
ANALYZE FOR MISSING NDA CLAUSES:
- Definition scope of confidential information
- Permitted disclosure exceptions (legal requirements)
- Return or destruction of materials procedures
- Duration of confidentiality obligations
- Remedy provisions for breach (injunctive relief)
- Mutual vs unilateral confidentiality obligations
- Third-party confidential information handling
- Residual information and general knowledge exceptions
- Geographic limitations if applicable
- Survival clauses for obligations`;
            break;

          case 'Purchase':
            specificClauses = `
ANALYZE FOR MISSING PURCHASE AGREEMENT CLAUSES:
- Title warranties and representations
- Inspection rights and objection procedures
- Financing contingencies and deadlines
- Closing conditions and document requirements
- Risk of loss allocation before closing
- Seller disclosure obligations
- Buyer remedy provisions for defects
- Tax and fee allocation responsibilities
- Property insurance transfer procedures
- Dispute resolution mechanisms
- Time is of the essence provisions
- Default remedies and procedures`;
            break;

          default:
            specificClauses = `
ANALYZE FOR MISSING GENERAL LEGAL CLAUSES:
- Clear termination procedures and conditions
- Dispute resolution mechanisms (mediation, arbitration)
- Force majeure and unforeseen circumstance provisions
- Liability limitations and damage caps
- Indemnification and hold harmless provisions
- Governing law and jurisdiction clauses
- Assignment and transfer restrictions
- Notice requirements and delivery methods
- Severability provisions for invalid clauses
- Integration and entire agreement clauses
- Amendment and modification procedures
- Survival clauses for key obligations`;
        }

        return `${basePrompt}

${specificClauses}

ANALYSIS INSTRUCTIONS:
1. Carefully read through the entire document
2. Identify which standard protective clauses are missing
3. Focus on clauses that would protect the "${userRole}" role specifically
4. Categorize missing clauses by importance:
   - Critical: Essential protections that could lead to significant problems
   - Important: Standard clauses that provide valuable protection
   - Recommended: Additional protections that would be beneficial

5. For each missing clause, provide:
   - Clear title and description of what it would protect
   - Risk assessment of not having this clause
   - Suggested language or approach (if helpful)

6. Calculate an overall completeness score (0-100) based on:
   - How many critical standard clauses are missing
   - How well the document protects the ${userRole}
   - Industry standards for this type of agreement

Document to analyze:
${documentText}

User Role: ${userRole}
Document Type: ${docType || 'General Legal Document'}

Return the analysis in this JSON format:
{
  "missingClauses": [
    {
      "clauseTitle": "Clear title of missing clause",
      "importance": "Critical|Important|Recommended",
      "description": "What this clause would protect or address",
      "riskWithoutClause": "Specific risk of not having this clause",
      "suggestedLanguage": "Optional example language (only if helpful)"
    }
  ],
  "overallCompleteness": [number 0-100],
  "summary": "Brief summary of most important missing protections"
}`;
      };

      const response = await ai.generate({
        prompt: getTypeSpecificMissingClauses(documentType),
        output: {
          format: 'json',
          schema: DetectMissingClausesOutputSchema,
        },
      });

      // Parse and validate the response
      const result = response.output;

      if (!result || !Array.isArray(result.missingClauses)) {
        console.warn('AI returned invalid missing clauses response');
        return {
          missingClauses: [],
          overallCompleteness: 75,
          summary: 'Unable to properly analyze missing clauses. The document appears to have standard provisions, but manual review is recommended.'
        };
      }

      // Ensure completeness score is within bounds
      const boundedCompleteness = Math.max(0, Math.min(100, result.overallCompleteness || 75));

      console.log('Missing clauses analysis completed:', {
        missingClausesCount: result.missingClauses.length,
        completeness: boundedCompleteness,
        criticalMissing: result.missingClauses.filter(c => c.importance === 'Critical').length
      });

      return {
        missingClauses: result.missingClauses,
        overallCompleteness: boundedCompleteness,
        summary: result.summary || 'Analysis completed. Review the specific missing clauses for details.'
      };

    } catch (error) {
      console.error('Error in detectMissingClauses flow:', error);
      return {
        missingClauses: [],
        overallCompleteness: 50,
        summary: 'An error occurred during missing clause analysis. Manual legal review is recommended to ensure all necessary protections are in place.'
      };
    }
  }
);