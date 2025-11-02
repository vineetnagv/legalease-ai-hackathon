/**
 * @fileOverview A Genkit flow for conversational AI chat about legal documents with full context awareness.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ChatWithDocumentInputSchema,
  ChatWithDocumentOutputSchema,
  type ChatWithDocumentInput,
  type ChatWithDocumentOutput
} from '@/types/chat-types';

export type { ChatWithDocumentInput, ChatWithDocumentOutput };

export const chatWithDocument = ai.defineFlow(
  {
    name: 'chatWithDocument',
    inputSchema: ChatWithDocumentInputSchema,
    outputSchema: ChatWithDocumentOutputSchema,
  },
  async ({ message, conversationHistory, documentContext }) => {
    try {
      const buildContextualPrompt = () => {
        const {
          documentType,
          userRole,
          documentText,
          keyNumbers,
          riskScore,
          riskSummary,
          clauses,
          faqs
        } = documentContext;

        const conversationHistoryText = conversationHistory
          .slice(-6) // Keep last 6 messages for context
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');

        const keyNumbersText = keyNumbers.length > 0
          ? keyNumbers.map(kn => `${kn.label}: ${kn.value}`).join(', ')
          : 'None extracted';

        const clausesText = clauses.length > 0
          ? clauses.map(c => `• ${c.clauseTitle}: ${c.plainEnglish}`).join('\n')
          : 'None analyzed yet';

        const faqsText = faqs.length > 0
          ? faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
          : 'None generated yet';

        const riskText = riskScore !== null
          ? `Risk Score: ${riskScore}/100 - ${riskSummary}`
          : 'Risk assessment not completed';

        return `You are an expert legal assistant AI helping a ${userRole} understand their ${documentType} document. You have access to comprehensive analysis of this document and should provide helpful, accurate responses.

DOCUMENT CONTEXT:
- Document Type: ${documentType}
- User Role: ${userRole}
- Risk Assessment: ${riskText}

KEY NUMBERS & DATES:
${keyNumbersText}

EXPLAINED CLAUSES:
${clausesText}

FREQUENTLY ASKED QUESTIONS:
${faqsText}

CONVERSATION HISTORY:
${conversationHistoryText}

CURRENT USER MESSAGE: ${message}

IMPORTANT GUIDELINES:
1. Answer as a knowledgeable legal assistant (but clarify you're not a lawyer)
2. Reference specific parts of the document when relevant
3. Use the analysis results (risk score, clauses, key numbers) to inform your response
4. Keep responses conversational but informative
5. When discussing legal terms, explain them in plain English
6. If asked about something not in the analysis, refer to the original document text
7. Suggest practical next steps when appropriate
8. For complex legal questions, recommend consulting a qualified attorney

RESPONSE FORMAT:
- Provide a helpful, conversational response
- Reference specific document sections or analysis when relevant
- Suggest 1-3 follow-up questions the user might want to ask
- Keep response length appropriate (2-4 paragraphs for most questions)

Original document text for reference:
${documentText.substring(0, 3000)}${documentText.length > 3000 ? '...' : ''}

Please respond to the user's message in a helpful, conversational way while leveraging all the document analysis context available.`;
      };

      const response = await ai.generate({
        prompt: buildContextualPrompt(),
        output: {
          format: 'json',
          schema: ChatWithDocumentOutputSchema,
        },
      });

      const result = response.output;

      if (!result || !result.response) {
        console.warn('AI returned invalid chat response');
        return {
          response: "I apologize, but I'm having trouble processing your question right now. Could you please try rephrasing it or ask about a specific aspect of your document?",
          suggestedFollowUps: [
            "What are the main risks in this document?",
            "Can you explain the key terms and conditions?",
            "What should I pay attention to before signing?"
          ]
        };
      }

      console.log('Chat response generated successfully:', {
        messageLength: result.response.length,
        hasFollowUps: Boolean(result.suggestedFollowUps?.length),
        hasReferences: Boolean(result.referencedSections?.length)
      });

      return {
        response: result.response,
        suggestedFollowUps: result.suggestedFollowUps || [],
        referencedSections: result.referencedSections || []
      };

    } catch (error) {
      console.error('Error in chatWithDocument flow:', error);
      return {
        response: "I apologize, but I encountered an error while processing your question. Please try again, or feel free to ask about specific aspects of your document like key terms, risks, or important dates.",
        suggestedFollowUps: [
          "What are the most important clauses I should know about?",
          "What risks should I be aware of in this document?",
          "Can you summarize the key dates and numbers?"
        ]
      };
    }
  }
);