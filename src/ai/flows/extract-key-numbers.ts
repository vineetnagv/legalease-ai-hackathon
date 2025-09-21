'use server';
/**
 * @fileOverview A Genkit flow for extracting key numbers and dates from legal documents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DocumentType } from '@/types/document-types';

// Define the schema for a single key number entry
const KeyNumberSchema = z.object({
  label: z.string().describe('A descriptive label for the number (e.g., "Monthly Rent", "Security Deposit")'),
  value: z.string().describe('The extracted value (e.g., "$1,200", "January 15, 2024")'),
});

// Define the output schema
const ExtractKeyNumbersOutputSchema = z.object({
  keyNumbers: z.array(KeyNumberSchema).describe('Array of extracted key numbers and dates'),
});

export type KeyNumber = z.infer<typeof KeyNumberSchema>;
export type ExtractKeyNumbersOutput = z.infer<typeof ExtractKeyNumbersOutputSchema>;

// Input schema with optional document type
const ExtractKeyNumbersInputSchema = z.object({
  documentText: z.string(),
  documentType: DocumentType.optional(),
});

export type ExtractKeyNumbersInput = z.infer<typeof ExtractKeyNumbersInputSchema>;

export const extractKeyNumbers = ai.defineFlow(
  {
    name: 'extractKeyNumbers',
    inputSchema: ExtractKeyNumbersInputSchema,
    outputSchema: ExtractKeyNumbersOutputSchema,
  },
  async ({ documentText, documentType }) => {
    try {
      // Build document type-specific prompt
      const getTypeSpecificPrompt = (docType?: string) => {
        const baseInstructions = `You are an expert legal document analyzer. Your task is to extract key numbers, amounts, dates, and other important quantifiable data from the provided legal document.`;

        let specificInstructions = '';

        switch (docType) {
          case 'Lease':
            specificInstructions = `
FOCUS ON LEASE-SPECIFIC DATA:
- Monthly rent amount
- Security deposit
- Pet deposit/fees
- Late payment fees
- Lease start and end dates
- Notice period requirements
- Property address/unit number
- Square footage
- Parking fees
- Utility costs`;
            break;

          case 'Employment':
            specificInstructions = `
FOCUS ON EMPLOYMENT-SPECIFIC DATA:
- Salary/hourly wage
- Bonus amounts
- Start date
- Benefits amounts
- Vacation days
- Probation period
- Notice period
- Stock options/equity
- Commission rates
- Overtime rates`;
            break;

          case 'LoanAgreement':
            specificInstructions = `
FOCUS ON LOAN-SPECIFIC DATA:
- Principal amount
- Interest rate (APR)
- Monthly payment amount
- Loan term (duration)
- Origination fees
- Late payment penalties
- Due dates
- Credit score requirements
- Debt-to-income ratios`;
            break;

          case 'ServiceAgreement':
            specificInstructions = `
FOCUS ON SERVICE-SPECIFIC DATA:
- Project cost/fee
- Hourly rates
- Payment milestones
- Project timeline/deadlines
- Deliverable quantities
- Late fees/penalties
- Retainer amounts
- Expense reimbursement limits`;
            break;

          case 'NDA':
            specificInstructions = `
FOCUS ON NDA-SPECIFIC DATA:
- Duration of confidentiality
- Effective dates
- Penalty amounts
- Number of copies allowed
- Time limits for disclosure
- Territory restrictions`;
            break;

          case 'Purchase':
            specificInstructions = `
FOCUS ON PURCHASE-SPECIFIC DATA:
- Purchase price
- Down payment
- Closing costs
- Inspection period
- Warranty periods
- Delivery dates
- Quantity of items
- Tax amounts
- Shipping costs`;
            break;

          default:
            specificInstructions = `
LOOK FOR COMMON LEGAL DOCUMENT DATA:
- Monetary amounts (fees, deposits, penalties, etc.)
- Important dates (start dates, end dates, deadlines, notice periods)
- Time periods (contract duration, notice periods, etc.)
- Quantities and percentages
- Contact information or reference numbers`;
        }

        return `${baseInstructions}

${specificInstructions}

IMPORTANT:
- Only extract data that is explicitly mentioned in the document
- Format monetary amounts with currency symbols if mentioned (e.g., "$1,200")
- Format dates in a clear, readable format (e.g., "January 15, 2024")
- Use clear, descriptive labels
- If no key numbers are found, return an empty array

Return the data in this JSON format:
{
  "keyNumbers": [
    {
      "label": "Descriptive label",
      "value": "Extracted value"
    }
  ]
}

Document:
${documentText}
`;
      };

      const response = await ai.generate({
        prompt: getTypeSpecificPrompt(documentType),
        output: {
          format: 'json',
          schema: ExtractKeyNumbersOutputSchema,
        },
      });

      // Parse the JSON response
      const result = response.output;

      if (!result || !result.keyNumbers) {
        console.warn('AI returned empty or invalid key numbers response');
        return { keyNumbers: [] };
      }

      console.log('Successfully extracted key numbers:', result.keyNumbers.length);
      return result;

    } catch (error) {
      console.error('Error in extractKeyNumbers flow:', error);
      return { keyNumbers: [] };
    }
  }
);