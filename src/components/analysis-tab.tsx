
'use client';

import React, { useState } from 'react';
import { Document } from '@/types/document-types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { buildGoogleCalendarURL } from '@/lib/calendar-utils';
import { getConfidenceBin, getRiskCategory, getRiskBarColor } from '@/lib/score-bins';

interface AnalysisTabProps {
  document: Document;
}

export function AnalysisTab({ document }: AnalysisTabProps) {
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());
  const [expandedMissingClauses, setExpandedMissingClauses] = useState<Set<number>>(new Set());

  const analysis = document.analysis;

  if (!analysis) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          No analysis data available. Please analyze the document from the dashboard first.
        </p>
      </div>
    );
  }

  const toggleFaq = (index: number) => {
    const newSet = new Set(expandedFaqs);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedFaqs(newSet);
  };

  const toggleMissingClause = (index: number) => {
    const newSet = new Set(expandedMissingClauses);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedMissingClauses(newSet);
  };

  function looksLikeDate(str: string) {
    if (!str) return false;
    const normalized = str.trim().toLowerCase();
    const hasMonthName = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(normalized);
    const hasDateSeparator = /[\/\-]/.test(normalized);
    const hasYear = /\b(19|20)\d{2}\b/.test(normalized);
    if (normalized.length < 6) return false;
    if (/^\d+$/.test(normalized)) return false;
    if (hasMonthName || hasDateSeparator || hasYear) {
      const d = new Date(str);
      return !isNaN(d.getTime());
    }
    return false;
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Document Type */}
      {analysis.documentType && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Document Type</h3>
          <div className="bg-accent/50 p-3 rounded-lg">
            <p className="font-medium">{analysis.documentType}</p>
            {analysis.documentTypeConfidence && (
              <p className={`text-xs font-medium mt-1 ${getConfidenceBin(analysis.documentTypeConfidence).color}`}>
                {getConfidenceBin(analysis.documentTypeConfidence).label}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {(analysis.riskScore !== undefined || analysis.riskSummary) && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Risk Assessment</h3>
          <div className="bg-accent/50 p-3 rounded-lg space-y-2">
            {analysis.riskScore !== undefined && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Risk Level</span>
                  <span className={`text-lg font-bold ${getRiskCategory(analysis.riskScore).color}`}>
                    {getRiskCategory(analysis.riskScore).label}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRiskBarColor(analysis.riskScore)}`}
                    style={{ width: `${analysis.riskScore}%` }}
                  />
                </div>
              </div>
            )}
            {analysis.riskSummary && (
              <p className="text-sm text-muted-foreground">{analysis.riskSummary}</p>
            )}
          </div>
        </div>
      )}

      {/* Key Numbers & Dates */}
      {analysis.keyNumbers && analysis.keyNumbers.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Key Numbers & Dates</h3>
          <div className="space-y-2">
            {analysis.keyNumbers.map((item, index) => {
              const calendarURL = looksLikeDate(item.value)
                ? buildGoogleCalendarURL({
                    label: item.label,
                    dateString: item.value,
                    description: 'This was extracted as an important date/deadline from your uploaded document.'
                  })
                : null;

              return (
                <div key={index} className="flex flex-col gap-2 p-3 bg-accent/50 rounded-lg">
                  <span className="font-medium text-sm">{item.label}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                    {calendarURL && (
                      <a href={calendarURL} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">
                          Add to Calendar
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missing Clauses */}
      {analysis.missingClauses && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Missing Clauses</h3>
          {analysis.missingClauses.missingClauses && analysis.missingClauses.missingClauses.length > 0 ? (
            <div className="space-y-2">
              {analysis.missingClauses.overallCompleteness !== undefined && (
                <div className="bg-accent/50 p-3 rounded-lg mb-3">
                  <p className="text-xs font-medium mb-1">Document Completeness</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${analysis.missingClauses.overallCompleteness}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {analysis.missingClauses.overallCompleteness}%
                    </span>
                  </div>
                </div>
              )}
              {analysis.missingClauses.missingClauses.map((clause: any, index: number) => (
                <Collapsible
                  key={index}
                  open={expandedMissingClauses.has(index)}
                  onOpenChange={() => toggleMissingClause(index)}
                >
                  <div className="bg-accent/50 rounded-lg">
                    <button
                      onClick={() => toggleMissingClause(index)}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-accent/70 transition-colors rounded-lg"
                    >
                      {expandedMissingClauses.has(index) ? (
                        <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{clause.clauseTitle}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Importance: {clause.importance}
                        </p>
                      </div>
                    </button>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pl-10 space-y-2">
                        <div>
                          <p className="text-xs font-medium mb-1">What This Clause Would Protect:</p>
                          <p className="text-xs text-muted-foreground">{clause.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Risk Without This Clause:</p>
                          <p className="text-xs text-muted-foreground">{clause.riskWithoutClause}</p>
                        </div>
                        {clause.suggestedLanguage && (
                          <div>
                            <p className="text-xs font-medium mb-1">Suggested Language:</p>
                            <p className="text-xs text-muted-foreground italic">
                              {clause.suggestedLanguage}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No missing clauses detected.</p>
          )}
        </div>
      )}

      {/* FAQs */}
      {analysis.faqs && analysis.faqs.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {analysis.faqs.map((faq, index) => (
              <Collapsible
                key={index}
                open={expandedFaqs.has(index)}
                onOpenChange={() => toggleFaq(index)}
              >
                <div className="bg-accent/50 rounded-lg">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-accent/70 transition-colors rounded-lg"
                  >
                    {expandedFaqs.has(index) ? (
                      <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="font-medium text-sm flex-1">{faq.question}</p>
                  </button>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pl-10">
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
