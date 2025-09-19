/**
 * @fileOverview This file defines the specialized AI agents for different tasks within the application.
 * Each agent can be configured with its own model, plugins, and API keys, allowing for
 * fine-grained control over cost, quotas, and capabilities.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

/**
 * The primary agent for core document analysis tasks like risk assessment,
 * key number extraction, clause explanation, and FAQ generation.
 */
export const analyzerAgent = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_ANALYZER})],
  model: 'gemini-1.5-flash',
});

/**
 * A separate, isolated agent used for verification and fact-checking. Its purpose
 * is to validate the output of the analyzerAgent to mitigate hallucinations.
 */
export const verifierAgent = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_VERIFIER})],
  model: 'gemini-1.5-flash',
});

/**
 * A dedicated agent for handling the conversational chat interface, optimized
 * for dialogue and question-answering.
 */
export const chatAgent = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_CHAT})],
    model: 'gemini-1.5-flash',
});

/**
 * An agent specialized in translation tasks. This can be used for translating
 * documents or UI elements in the future.
 */
export const translatorAgent = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_TRANSLATOR})],
    model: 'gemini-1.5-flash',
});
