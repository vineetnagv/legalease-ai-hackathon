/**
 * @fileOverview Centralized Genkit initialization.
 *
 * This file configures and exports a single `genkit` instance for use
 * throughout the application. It uses the Google AI plugin and configures
 * it with the API key from environment variables.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { GENKIT_ENV } from 'genkit/environment';

// Initialize Genkit with the Google AI plugin.
// The plugin automatically looks for the GOOGLE_GENAI_API_KEY or
// GEMINI_API_KEY environment variable.
export const ai = genkit({
  plugins: [
    googleAI({
      // Specify the API key if it's set in a different environment variable.
      // By default, it checks GOOGLE_GENAI_API_KEY and then GEMINI_API_KEY.
      // apiKey: process.env.YOUR_CUSTOM_API_KEY_ENV_VAR
    }),
  ],
  // Log to the console in development, but not in production.
  logLevel: GENKIT_ENV === 'production' ? 'warn' : 'debug',
  // Keep user data out of the logs.
  enableTraceStore: false,
});
