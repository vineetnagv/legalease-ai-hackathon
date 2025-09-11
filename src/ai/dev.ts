import { config } from 'dotenv';
config();

import '@/ai/flows/extract-key-numbers.ts';
import '@/ai/flows/explain-clauses.ts';
import '@/ai-flows/detect-missing-clauses.ts';
import '@/ai/flows/assess-document-risk.ts';
import '@/ai/flows/suggest-user-role.ts';
import '@/ai/flows/generate-faq.ts';
import '@/ai/flows/conversational-chat.ts';
import '@/ai/flows/verify-explanation.ts';
