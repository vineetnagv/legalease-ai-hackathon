import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the general chatbot
export const GeneralChatbotInputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  language: z.string().min(1, 'Language is required'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

// Output schema for the general chatbot
export const GeneralChatbotOutputSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()).optional(),
});

export type GeneralChatbotInput = z.infer<typeof GeneralChatbotInputSchema>;
export type GeneralChatbotOutput = z.infer<typeof GeneralChatbotOutputSchema>;

// Build contextual prompt for general website chatbot
function buildContextualPrompt(input: GeneralChatbotInput): string {
  const { message, language, conversationHistory } = input;
  
  // Language-specific cultural contexts and communication styles
  const languageContexts: Record<string, { name: string; style: string; context: string }> = {
    'en': { name: 'English', style: 'Professional and clear', context: 'Western business context' },
    'hi': { name: 'Hindi', style: 'Respectful and warm', context: 'Indian business context with formal address' },
    'ta': { name: 'Tamil', style: 'Polite and traditional', context: 'South Indian business context' },
    'kn': { name: 'Kannada', style: 'Courteous and helpful', context: 'Karnataka business context' },
    'bn': { name: 'Bengali', style: 'Friendly and detailed', context: 'Bengali business context' },
    'mr': { name: 'Marathi', style: 'Respectful and clear', context: 'Maharashtra business context' },
    'gu': { name: 'Gujarati', style: 'Business-oriented and helpful', context: 'Gujarat business context' },
    'ml': { name: 'Malayalam', style: 'Polite and informative', context: 'Kerala business context' },
    'te': { name: 'Telugu', style: 'Professional and warm', context: 'Telangana/Andhra business context' },
    'ur': { name: 'Urdu', style: 'Respectful and eloquent', context: 'Urdu-speaking business context' },
  };

  const langInfo = languageContexts[language] || languageContexts['en'];
  
  // Build conversation history context
  const historyContext = conversationHistory.length > 0 
    ? `\n\nPrevious conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
    : '';

  return `You are the LegalEase AI Assistant, a helpful chatbot for the LegalEase platform that helps users understand legal documents.

USER'S LANGUAGE: ${langInfo.name}
COMMUNICATION STYLE: ${langInfo.style}
CULTURAL CONTEXT: ${langInfo.context}

Respond in ${langInfo.name} language.

ABOUT LEGALEASE AI:
LegalEase AI is a platform that helps users understand legal documents through AI-powered analysis. Key features include:
- Document upload and analysis (supports .txt, .pdf, .docx files)
- Risk assessment of legal documents
- Missing clause detection
- Key number extraction from contracts
- Clause explanation in simple terms
- FAQ generation for documents
- Document type detection
- Interactive chat with document-specific context

YOUR ROLE:
Help users with:
1. How to upload and analyze legal documents
2. Understanding the platform's features and capabilities
3. Explaining what each analysis tool does
4. Troubleshooting upload or analysis issues
5. General guidance on using LegalEase AI effectively
6. Explaining legal concepts in simple terms

RESPONSE GUIDELINES:
- Be helpful, accurate, and conversational
- Provide specific, actionable advice
- If asked about document analysis, explain the process step-by-step
- If asked about features, describe what each tool does
- Keep responses concise but informative (2-3 paragraphs max)
- Always suggest relevant follow-up questions

Current user message: ${message}${historyContext}

Please provide a helpful, accurate response in ${langInfo.name} that directly addresses the user's question about LegalEase AI.`;
}

// Define the general chatbot flow
export const generalChatbot = ai.defineFlow(
  {
    name: 'generalChatbot',
    inputSchema: GeneralChatbotInputSchema,
    outputSchema: GeneralChatbotOutputSchema,
  },
  async (input) => {
    try {
      // Build the contextual prompt
      const prompt = buildContextualPrompt(input);
      
      // Call the AI model to generate a response
      const response = await ai.generate({
        prompt: prompt,
        output: {
          format: 'json',
          schema: GeneralChatbotOutputSchema,
        },
      });

      return response.output;
    } catch (error) {
      console.error('General chatbot error:', error);
      throw new Error('Failed to process general chat message');
    }
  }
);