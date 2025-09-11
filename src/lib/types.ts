import type { AssessDocumentRiskOutput } from '@/ai/flows/assess-document-risk';
import type { ExplainClausesOutput } from '@/ai/flows/explain-clauses';
import type { ExtractKeyNumbersOutput } from '@/ai/flows/extract-key-numbers';
import type { GenerateFaqOutput } from '@/ai/flows/generate-faq';

export type AnalysisResult = {
  riskAssessment: AssessDocumentRiskOutput;
  keyNumbers: ExtractKeyNumbersOutput['keyNumbers'];
  clauseBreakdown: ExplainClausesOutput;
  faq: GenerateFaqOutput;
};

export const supportedLanguages = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  kn: 'ಕನ್ನಡ (Kannada)',
  bn: 'বাংলা (Bengali)',
  mr: 'मराठी (Marathi)',
  gu: 'ગુજરાતી (Gujarati)',
  ml: 'മലയാളം (Malayalam)',
  te: 'తెలుగు (Telugu)',
  ur: 'اردو (Urdu)',
} as const;

export type LanguageCode = keyof typeof supportedLanguages;
