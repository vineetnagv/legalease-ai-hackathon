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
