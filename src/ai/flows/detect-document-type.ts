/**
 * @fileOverview A Genkit flow for detecting the type of legal document.
 */

import { ai } from '@/ai/genkit';
import {
  DocumentType,
  CommonDocumentTypes,
  DetectDocumentTypeInputSchema,
  DetectDocumentTypeOutputSchema,
  type DetectDocumentTypeInput,
  type DetectDocumentTypeOutput
} from '@/types/document-types';

export const detectDocumentType = ai.defineFlow(
  {
    name: 'detectDocumentType',
    inputSchema: DetectDocumentTypeInputSchema,
    outputSchema: DetectDocumentTypeOutputSchema,
  },
  async ({ documentText }) => {
    try {
      // Validate API key before attempting generation
      if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in environment variables');
        return {
          documentType: 'Unclassified Document' as DocumentType,
          confidence: 0,
          reasoning: 'API key not configured. Please set GEMINI_API_KEY in environment variables.'
        };
      }

      // Retry wrapper for AI generation with exponential backoff
      const generateWithRetry = async (maxRetries = 3) => {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await ai.generate({
              prompt: `You are an expert legal document classifier. Your task is to analyze the provided legal document text and determine its specific type.

CLASSIFICATION APPROACH:
You should create a specific, descriptive document type based on the content analysis. Be as specific as possible while remaining accurate.

COMMON CATEGORIES (use as reference, but feel free to be more specific):
- Lease (can be specific like "Residential Lease Agreement", "Commercial Property Lease", "Equipment Lease")
- Employment (can be specific like "Remote Work Employment Contract", "Executive Employment Agreement", "Freelance Services Agreement")
- Service Agreement (can be specific like "Software Development Agreement", "Consulting Services Contract", "Marketing Services Agreement")
- Loan Agreement (can be specific like "Personal Loan Agreement", "Business Loan Contract", "Mortgage Agreement")
- NDA (can be specific like "Mutual Non-Disclosure Agreement", "Employee Confidentiality Agreement")
- Purchase Agreement (can be specific like "Real Estate Purchase Agreement", "Asset Purchase Agreement", "Software License Purchase")
- Contract (can be specific like "Partnership Agreement", "Joint Venture Contract", "Distribution Agreement")
- Other (use only if truly doesn't fit any category, but still be descriptive like "Insurance Policy", "Will and Testament")

ANALYSIS INSTRUCTIONS:
1. Analyze the document's purpose, parties, subject matter, and key clauses
2. Create a specific, descriptive document type (e.g., "Commercial Lease Agreement" instead of just "Lease")
3. If it's a unique or complex document, create an appropriate descriptive type
4. Provide a confidence score (0-100) based on how certain you are
5. Give a brief reasoning for your classification

EXAMPLES:
- "This lease agreement is entered between landlord and tenant for commercial property..." → "Commercial Lease Agreement" (95% confidence)
- "Employment offer for the position of Software Engineer with remote work provisions..." → "Remote Work Employment Contract" (90% confidence)
- "The parties agree that Confidential Information disclosed during merger discussions..." → "Merger & Acquisition NDA" (85% confidence)
- "The borrower agrees to repay the principal amount for business expansion..." → "Business Loan Agreement" (92% confidence)

Document to analyze:
${documentText.substring(0, 3000)}${documentText.length > 3000 ? '...' : ''}

Respond with a JSON object containing:
- documentType: a specific, descriptive document type (e.g., "Commercial Lease Agreement", "Software Development Contract")
- confidence: number from 0-100
- reasoning: brief explanation (1-2 sentences) of why this specific type was chosen`,

              output: {
                format: 'json',
                schema: DetectDocumentTypeOutputSchema,
              },
              config: {
                temperature: 0.3, // Lower temperature for more consistent classification
              },
            });
            return response;
          } catch (error) {
            lastError = error;
            console.error(`Document type detection attempt ${attempt}/${maxRetries} failed:`, error);

            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s exponential backoff
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        throw lastError; // All retries failed
      };

      const response = await generateWithRetry();

      // Get the AI response output (schema handles parsing automatically)
      let result: DetectDocumentTypeOutput;

      try {
        // Use response.output which is automatically parsed by the schema
        if (!response.output) {
          throw new Error('No output received from AI model');
        }

        result = response.output;

        if (!result.documentType) {
          throw new Error('Invalid response structure from AI model');
        }
      } catch (parseError) {
        console.error('Failed to get document type detection response:', parseError);

        // Fallback: try to extract document type from response text
        const responseText = response.text || '';
        let documentType: DocumentType = 'Unclassified Document';
        let confidence = 50;

        // Enhanced keyword matching as fallback with more specific types
        const text = responseText.toLowerCase();
        if (text.includes('lease') || text.includes('rental') || text.includes('tenant')) {
          if (text.includes('commercial') || text.includes('business')) {
            documentType = 'Commercial Lease Agreement';
          } else if (text.includes('residential') || text.includes('apartment') || text.includes('house')) {
            documentType = 'Residential Lease Agreement';
          } else {
            documentType = 'Lease Agreement';
          }
          confidence = 70;
        } else if (text.includes('employment') || text.includes('job') || text.includes('employee')) {
          if (text.includes('remote') || text.includes('work from home')) {
            documentType = 'Remote Work Employment Contract';
          } else if (text.includes('executive') || text.includes('officer')) {
            documentType = 'Executive Employment Agreement';
          } else {
            documentType = 'Employment Contract';
          }
          confidence = 70;
        } else if (text.includes('service') || text.includes('consulting')) {
          if (text.includes('software') || text.includes('development')) {
            documentType = 'Software Development Agreement';
          } else if (text.includes('consulting')) {
            documentType = 'Consulting Services Agreement';
          } else {
            documentType = 'Service Agreement';
          }
          confidence = 70;
        } else if (text.includes('loan') || text.includes('lending') || text.includes('mortgage')) {
          if (text.includes('business') || text.includes('commercial')) {
            documentType = 'Business Loan Agreement';
          } else if (text.includes('mortgage') || text.includes('home')) {
            documentType = 'Mortgage Agreement';
          } else {
            documentType = 'Loan Agreement';
          }
          confidence = 70;
        } else if (text.includes('nda') || text.includes('confidential') || text.includes('non-disclosure')) {
          if (text.includes('mutual')) {
            documentType = 'Mutual Non-Disclosure Agreement';
          } else if (text.includes('employee')) {
            documentType = 'Employee Confidentiality Agreement';
          } else {
            documentType = 'Non-Disclosure Agreement';
          }
          confidence = 70;
        } else if (text.includes('purchase') || text.includes('sale') || text.includes('buy')) {
          if (text.includes('real estate') || text.includes('property')) {
            documentType = 'Real Estate Purchase Agreement';
          } else if (text.includes('asset')) {
            documentType = 'Asset Purchase Agreement';
          } else {
            documentType = 'Purchase Agreement';
          }
          confidence = 70;
        } else if (text.includes('contract') || text.includes('agreement')) {
          documentType = 'General Contract';
          confidence = 60;
        }

        result = {
          documentType,
          confidence,
          reasoning: 'Classification based on keyword analysis due to parsing error'
        };
      }

      // Validate the result
      const validatedResult = DetectDocumentTypeOutputSchema.parse(result);

      return validatedResult;

    } catch (error) {
      console.error('Document type detection error:', error);

      let reasoningMessage = 'Unable to classify document due to processing error';

      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });

        // Provide specific error messages based on error type
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('api key') || errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          console.error('⚠️ API AUTHENTICATION FAILED: Check that GEMINI_API_KEY is properly set');
          reasoningMessage = 'API authentication failed. Please check GEMINI_API_KEY configuration.';
        } else if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          console.error('⚠️ API QUOTA EXCEEDED: Rate limit or quota reached');
          reasoningMessage = 'API quota exceeded. Please try again later or upgrade your plan.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('etimedout') || errorMessage.includes('econnaborted')) {
          console.error('⚠️ REQUEST TIMEOUT: Network or API timeout');
          reasoningMessage = 'Request timed out. Please check network connection and try again.';
        } else if (errorMessage.includes('enotfound') || errorMessage.includes('econnrefused')) {
          console.error('⚠️ NETWORK ERROR: Cannot reach API endpoint');
          reasoningMessage = 'Network error. Please check internet connection.';
        } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          console.error('⚠️ MODEL ERROR: Requested model may not be available');
          reasoningMessage = 'AI model error. The requested model may not be available.';
        } else {
          reasoningMessage = `API Error: ${error.message}`;
        }
      }

      // Return a safe fallback with descriptive error message
      return {
        documentType: 'Unclassified Document' as DocumentType,
        confidence: 0,
        reasoning: reasoningMessage
      };
    }
  }
);