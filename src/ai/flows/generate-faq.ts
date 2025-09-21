'use server';
/**
 * @fileOverview A Genkit flow for generating relevant FAQs about legal documents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for a single FAQ item
const FAQItemSchema = z.object({
  question: z.string().describe('A relevant question a user in this role might have'),
  answer: z.string().describe('A clear, practical answer based on the document content'),
});

// Define the input schema
const GenerateFaqInputSchema = z.object({
  documentText: z.string().describe('The full text of the legal document'),
  userRole: z.string().describe('The user\'s role in the agreement (e.g., Tenant, Landlord)'),
});

// Define the output schema
const GenerateFaqOutputSchema = z.object({
  faqs: z.array(FAQItemSchema).describe('Array of frequently asked questions and answers'),
});

export type FAQItem = z.infer<typeof FAQItemSchema>;
export type GenerateFaqInput = z.infer<typeof GenerateFaqInputSchema>;
export type GenerateFaqOutput = z.infer<typeof GenerateFaqOutputSchema>;

export const generateFaq = ai.defineFlow(
  {
    name: 'generateFaq',
    inputSchema: GenerateFaqInputSchema,
    outputSchema: GenerateFaqOutputSchema,
  },
  async ({ documentText, userRole }) => {
    try {
      const response = await ai.generate({
        prompt: `You are a legal advisor who helps people understand their agreements. Your task is to generate the most important and practical questions that someone in the role of "${userRole}" would likely have about this legal document, along with clear answers based on the document's content.

Instructions:
1. Generate 6-8 of the most relevant and important questions a ${userRole} would ask
2. Focus on practical, actionable questions they need answers to
3. Answer each question clearly and directly based on the document content
4. Use plain English and avoid legal jargon
5. Address common concerns and "what if" scenarios
6. Include questions about rights, obligations, and consequences

Question Categories to Consider:
- **Rights & Protections:** What am I entitled to? What protections do I have?
- **Obligations:** What am I required to do? What are my responsibilities?
- **Consequences:** What happens if I violate terms? What are the penalties?
- **Termination:** How can this agreement end? What notice is required?
- **Money Matters:** What costs am I responsible for? When are payments due?
- **Practical Scenarios:** What if I need to make changes? What if there's a dispute?

Document to analyze:
${documentText}

User Role: ${userRole}

Return the FAQs in this JSON format:
{
  "faqs": [
    {
      "question": "What happens if I need to terminate this agreement early?",
      "answer": "According to the document, you need to provide 30 days written notice..."
    }
  ]
}
`,
        output: {
          format: 'json',
          schema: GenerateFaqOutputSchema,
        },
      });

      // Parse and validate the response
      const result = response.output;

      if (!result || !result.faqs || !Array.isArray(result.faqs)) {
        console.warn('AI returned invalid FAQ response');
        return { faqs: [] };
      }

      // Filter out any invalid FAQs and ensure they have required fields
      const validFaqs = result.faqs.filter(faq =>
        faq.question &&
        faq.answer &&
        faq.question.trim().length > 0 &&
        faq.answer.trim().length > 0
      );

      console.log('Successfully generated FAQs:', validFaqs.length);

      return { faqs: validFaqs };

    } catch (error) {
      console.error('Error in generateFaq flow:', error);
      return { faqs: [] };
    }
  }
);