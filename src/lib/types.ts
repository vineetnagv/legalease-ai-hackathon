import type { AssessDocumentRiskOutput } from '@/ai/flows/assess-document-risk';
import type { ExplainClausesOutput } from '@/ai/flows/explain-clauses';
import type { ExtractKeyNumbersOutput } from '@/ai/flows/extract-key-numbers';

export type AnalysisResult = {
  riskAssessment: AssessDocumentRiskOutput;
  keyNumbers: ExtractKeyNumbersOutput['keyNumbers'];
  clauseBreakdown: ExplainClausesOutput;
};
