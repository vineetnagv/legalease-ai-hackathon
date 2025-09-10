import type { AssessDocumentRiskOutput } from '@/ai/flows/assess-document-risk';
import type { ExplainClausesOutput } from '@/ai/flows/explain-clauses';

export type AnalysisResult = {
  riskAssessment: AssessDocumentRiskOutput;
  keyNumbers: Record<string, string>;
  clauseBreakdown: ExplainClausesOutput;
};
