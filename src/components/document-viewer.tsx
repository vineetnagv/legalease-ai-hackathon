
'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Document } from '@/types/document-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getConfidenceBin, getRiskCategory } from '@/lib/score-bins';

interface DocumentViewerProps {
  document: Document;
  onTextSelect?: (text: string) => void;
  highlightedSectionId?: string;
}

export function DocumentViewer({ document, onTextSelect, highlightedSectionId }: DocumentViewerProps) {
  const [selectedText, setSelectedText] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString();
      setSelectedText(text);
      if (onTextSelect) {
        onTextSelect(text);
      }
    }
  }, [onTextSelect]);

  // Auto-scroll to highlighted section
  useEffect(() => {
    if (highlightedSectionId && contentRef.current) {
      const element = window.document.getElementById(highlightedSectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [highlightedSectionId]);

  // Format document content into paragraphs
  const formatContent = (content: string) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Document Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              {document.documentType && (
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {document.documentType}
                </Badge>
              )}
              {document.userRole && (
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  {document.userRole}
                </Badge>
              )}
              {document.createdAt && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(document.createdAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {document.analysis && (
            <Card className="p-4 bg-muted/30">
              <div className="space-y-2 text-sm">
                {document.documentTypeConfidence !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className={cn('font-medium', getConfidenceBin(document.documentTypeConfidence).color)}>
                      {getConfidenceBin(document.documentTypeConfidence).label}
                    </span>
                  </div>
                )}
                {document.analysis.riskScore !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className={cn('font-medium', getRiskCategory(document.analysis.riskScore).color)}>
                      {getRiskCategory(document.analysis.riskScore).label}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Selection Indicator */}
        {selectedText && (
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {selectedText.length} characters selected
              </span>
              <Badge variant="secondary" className="ml-auto">
                Ask in chat for explanation
              </Badge>
            </div>
          </Card>
        )}
      </div>

      {/* Document Content */}
      <div
        ref={contentRef}
        className="p-8 max-w-4xl mx-auto"
        onMouseUp={handleMouseUp}
      >
        <div id="doc-content" className={cn(
          'prose prose-slate dark:prose-invert max-w-none',
          'prose-headings:font-bold prose-headings:tracking-tight',
          'prose-p:text-base prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'selection:bg-primary/20'
        )}>
          {formatContent(document.content)}
        </div>

        {/* Analysis Sections */}
        {document.analysis && (
          <div className="mt-12 space-y-8">
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI Analysis Highlights
              </h2>

              {/* Key Numbers Preview */}
              {document.analysis.keyNumbers && document.analysis.keyNumbers.length > 0 && (
                <div id="key-numbers" className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Key Numbers & Dates</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {document.analysis.keyNumbers.slice(0, 4).map((item, index) => (
                      <Card key={index} className="p-3 bg-accent/50">
                        <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                        <div className="font-medium">{item.value}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Summary Preview */}
              {document.analysis.riskSummary && (
                <div id="risk-assessment" className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Risk Summary</h3>
                  <Card className="p-4 bg-accent/50">
                    <p className="text-sm text-muted-foreground">{document.analysis.riskSummary}</p>
                  </Card>
                </div>
              )}

              {/* Explained Clauses Preview */}
              {document.analysis.clauses && document.analysis.clauses.length > 0 && (
                <div id="clauses" className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Explained Clauses</h3>
                  <div className="space-y-3">
                    {document.analysis.clauses.slice(0, 3).map((clause: any, index: number) => (
                      <Card key={index} className="p-4 bg-accent/50">
                        <h4 className="font-semibold text-sm mb-2">{clause.clauseTitle}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{clause.plainEnglish}</p>
                      </Card>
                    ))}
                    {document.analysis.clauses.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{document.analysis.clauses.length - 3} more clauses
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* FAQs Preview */}
              {document.analysis.faqs && document.analysis.faqs.length > 0 && (
                <div id="faqs" className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Frequently Asked Questions</h3>
                  <div className="space-y-3">
                    {document.analysis.faqs.slice(0, 3).map((faq: any, index: number) => (
                      <Card key={index} className="p-4 bg-accent/50">
                        <h4 className="font-semibold text-sm mb-2">{faq.question}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                      </Card>
                    ))}
                    {document.analysis.faqs.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{document.analysis.faqs.length - 3} more questions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Missing Clauses Preview */}
              {document.analysis.missingClauses && document.analysis.missingClauses.missingClauses && document.analysis.missingClauses.missingClauses.length > 0 && (
                <div id="missing-clauses" className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Missing Clauses</h3>
                  <div className="space-y-3">
                    {document.analysis.missingClauses.missingClauses.slice(0, 3).map((clause: any, index: number) => (
                      <Card key={index} className="p-4 bg-accent/50 border-l-4 border-l-orange-500">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm">{clause.clauseTitle}</h4>
                          <Badge variant="outline" className="text-xs">{clause.importance}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{clause.description}</p>
                      </Card>
                    ))}
                    {document.analysis.missingClauses.missingClauses.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{document.analysis.missingClauses.missingClauses.length - 3} more missing clauses
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
