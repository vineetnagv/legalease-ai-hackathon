
'use server';

/**
 * @fileOverview An AI agent that answers questions about a legal document in a conversational manner.
 *
 * - chatAboutDocument - A function that takes a document, history, and a new question to get an answer.
 * - ChatAboutDocumentInput - The input type for the chatAboutDocument function.
 * - ChatAboutDocumentOutput - The return type for the chatAboutDocument function.
 */

import { ai } from '@/ai/agents';
import {
  ChatAboutDocumentInputSchema,
  ChatAboutDocumentOutputSchema,
  type ChatAboutDocumentInput,
  type ChatAboutDocumentOutput,
} from '@/lib/ai-types';


export async function chatAboutDocument(input: ChatAboutDocumentInput): Promise<ChatAboutDocumentOutput> {
  return chatAboutDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAboutDocumentPrompt',
  input: {schema: ChatAboutDocumentInputSchema},
  output: {schema: ChatAboutDocumentOutputSchema},
  prompt: `You are a helpful AI assistant for the Legalease AI app. Your goal is to answer a user's questions about a legal document they have provided.

You must answer ONLY based on the content of the document provided. Do not use any external knowledge or make assumptions. If the answer is not in the document, you must state that the information is not available in the document.

You are not a lawyer and you must not provide legal advice. Your responses should be informative and neutral, aimed at helping the user understand their document.

IMPORTANT: Your entire response must be in the following language: {{{language}}}

Conversation History:
{{#each history}}
- {{this.role}}: {{{this.content}}}
{{/each}}

User's Role: {{{userRole}}}

Document Text:
"""
{{{documentText}}}
"""

User's Question: {{{question}}}

Based on the document text and conversation history, provide a clear and concise answer to the user's question.
`,
});

const chatAboutDocumentFlow = ai.defineFlow(
  {
    name: 'chatAboutDocumentFlow',
    inputSchema: ChatAboutDocumentInputSchema,
    outputSchema: ChatAboutDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
