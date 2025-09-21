'use server';
/**
 * @fileOverview A Genkit flow for explaining legal clauses in plain English with jargon definitions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for jargon terms
const JargonTermSchema = z.object({
  term: z.string().describe('The legal jargon term'),
  definition: z.string().describe('Plain English definition of the term'),
});

// Define the schema for a single clause explanation
const ClauseExplanationSchema = z.object({
  clauseTitle: z.string().describe('A descriptive title for the clause (e.g., "Payment Terms", "Termination Clause")'),
  originalText: z.string().describe('The original legal text of the clause'),
  plainEnglish: z.string().describe('A plain English explanation of what the clause means for the user'),
  jargon: z.array(JargonTermSchema).describe('Legal jargon terms found in this clause with definitions'),
});

// Define the input schema
const ExplainClausesInputSchema = z.object({
  documentText: z.string().describe('The full text of the legal document'),
  userRole: z.string().describe('The user\'s role in the agreement (e.g., Tenant, Landlord)'),
});

// Define the output schema
const ExplainClausesOutputSchema = z.object({
  clauses: z.array(ClauseExplanationSchema).describe('Array of clause explanations'),
});

export type JargonTerm = z.infer<typeof JargonTermSchema>;
export type ClauseExplanation = z.infer<typeof ClauseExplanationSchema>;
export type ExplainClausesInput = z.infer<typeof ExplainClausesInputSchema>;
export type ExplainClausesOutput = z.infer<typeof ExplainClausesOutputSchema>;

export const explainClauses = ai.defineFlow(
  {
    name: 'explainClauses',
    inputSchema: ExplainClausesInputSchema,
    outputSchema: ExplainClausesOutputSchema,
  },
  async ({ documentText, userRole }) => {
    try {
      const response = await ai.generate({
        prompt: `You are an expert legal translator who specializes in making complex legal documents understandable for everyday people. Your task is to break down this legal document into its major clauses and explain each one in plain English from the perspective of someone in the role of "${userRole}".

Instructions:
1. Identify the 5-8 most important clauses/sections in the document
2. For each clause, provide:
   - A clear, descriptive title
   - The original legal text (keep it concise, focusing on the key parts)
   - A plain English explanation written specifically for the ${userRole}
   - Identify any legal jargon terms and provide simple definitions

Guidelines:
- Focus on clauses that most directly affect the ${userRole}
- Explain what each clause means in practice for their daily life
- Use simple, conversational language
- Highlight potential benefits or risks for the ${userRole}
- For jargon terms, provide definitions a high school student could understand
- Keep explanations concise but thorough (2-4 sentences per clause)

Document to analyze:
${documentText}

User Role: ${userRole}

Return the analysis in this JSON format:
{
  "clauses": [
    {
      "clauseTitle": "Descriptive title",
      "originalText": "Relevant excerpt from the original document",
      "plainEnglish": "What this means for you as a ${userRole}...",
      "jargon": [
        {
          "term": "legal term",
          "definition": "simple explanation"
        }
      ]
    }
  ]
}
`,
        output: {
          format: 'json',
          schema: ExplainClausesOutputSchema,
        },
      });

      // Parse and validate the response
      const result = response.output;

      if (!result || !result.clauses || !Array.isArray(result.clauses)) {
        console.warn('AI returned invalid clause explanations response');
        return { clauses: [] };
      }

      // Filter out any invalid clauses and ensure they have required fields
      const validClauses = result.clauses.filter(clause =>
        clause.clauseTitle &&
        clause.originalText &&
        clause.plainEnglish &&
        Array.isArray(clause.jargon)
      );

      console.log('Successfully explained clauses:', validClauses.length);

      return { clauses: validClauses };

    } catch (error) {
      console.error('Error in explainClauses flow:', error);
      return { clauses: [] };
    }
  }
);