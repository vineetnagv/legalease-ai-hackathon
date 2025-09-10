import { config } from 'dotenv';
config();

import '@/ai/flows/extract-key-numbers.ts';
import '@/ai/flows/explain-clauses.ts';
import '@/ai/flows/assess-document-risk.ts';
import '@/ai/flows/suggest-user-role.ts';
