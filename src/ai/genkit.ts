/**
 * @fileOverview Centralized Genkit initialization.
 *
 * This file configures and exports a single `genkit` instance for use
 * throughout the application. It uses the Google AI plugin and configures
 * it with the API key from environment variables.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin and a default model.
// The plugin automatically looks for the GOOGLE_GENAI_API_KEY or
// GEMINI_API_KEY environment variable.
export const ai = genkit({
  plugins: [googleAI()],
});
