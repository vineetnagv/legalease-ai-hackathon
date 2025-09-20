
/**
 * @fileOverview This file defines the specialized AI agents for different tasks within the application.
 * Each agent can be configured with its own model, plugins, and API keys, allowing for
 * fine-grained control over cost, quotas, and capabilities.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

/**
 * A single, unified agent for all AI tasks in the application.
 */
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: 'gemini-pro',
});
