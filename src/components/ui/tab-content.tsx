'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, LoaderCircle, CalendarPlus } from 'lucide-react';
import type { AnalysisTabId } from './tab-bar';
import type { KeyNumber } from '@/ai/flows/extract-key-numbers';
import type { ClauseExplanation } from '@/ai/flows/explain-clauses';
import type { FAQItem } from '@/ai/flows/generate-faq';
import type { DetectMissingClausesOutput } from '@/ai/flows/detect-missing-clauses';
import type { DocumentContext } from '@/types/chat-types';
import { ChatInterface } from '@/components/chat-interface';
import { buildGoogleCalendarURL } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface TabContentProps {
  activeTab: AnalysisTabId;
  // Key Numbers data
  keyNumbers: KeyNumber[];
  keyNumbersStatus: string;
  // Risk data
  riskScore: number | null;
  riskSummary: string;
  riskStatus: string;
  // Clauses data
  clauses: ClauseExplanation[];
  expandedClauses: Set<number>;
  onToggleClause: (index: number) => void;
  clausesStatus: string;
  // FAQs data
  faqs: FAQItem[];
  expandedFaqs: Set<number>;
  onToggleFaq: (index: number) => void;
  faqsStatus: string;
  // Missing clauses data
  missingClauses: DetectMissingClausesOutput | null;
  expandedMissingClauses: Set<number>;
  onToggleMissingClause: (index: number) => void;
  missingStatus: string;
  // Chat data
  documentContext: DocumentContext | null;
  onSendMessage: (message: string) => Promise<{ response: string; suggestedFollowUps?: string[] }>;
  className?: string;
}

// Helper function to check if date
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

export function TabContent({
  activeTab,
  keyNumbers,
  keyNumbersStatus,
  riskScore,
  riskSummary,
  riskStatus,
  clauses,
  expandedClauses,
  onToggleClause,
  clausesStatus,
  faqs,
  expandedFaqs,
  onToggleFaq,
  faqsStatus,
  missingClauses,
  expandedMissingClauses,
  onToggleMissingClause,
  missingStatus,
  documentContext,
  onSendMessage,
  className,
}: TabContentProps) {
  const tabVariants = {
    enter: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 }
    },
    center: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={cn("p-6", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Key Numbers Tab */}
          {activeTab === 'keyNumbers' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold">Key Numbers & Dates</h2>
                  {keyNumbersStatus === 'extracting_numbers' && (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>

                {keyNumbersStatus === 'extracting_numbers' && (
                  <p className="text-muted-foreground">Extracting key numbers and dates...</p>
                )}

                {keyNumbers.length > 0 && (
                  <div className="grid gap-3">
                    {keyNumbers.map((item, index) => {
                      const calendarURL = looksLikeDate(item.value)
                        ? buildGoogleCalendarURL({
                            label: item.label,
                            dateString: item.value,
                            description: 'This was extracted as an important date/deadline from your uploaded document.'
                          })
                        : null;

                      return (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-accent/50 rounded-lg gap-2">
                          <span className="font-medium text-sm">{item.label}</span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <span className="text-sm text-muted-foreground">{item.value}</span>
                            {calendarURL && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={calendarURL} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="icon" className="h-8 w-8">
                                        <CalendarPlus className="h-4 w-4" />
                                      </Button>
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add to Google Calendar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {keyNumbers.length === 0 && keyNumbersStatus !== 'extracting_numbers' && (
                  <p className="text-muted-foreground">No key numbers or dates found in this document.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Risk Tab */}
          {activeTab === 'risk' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold">Risk Assessment</h2>
                  {riskStatus === 'assessing_risk' && (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>

                {riskStatus === 'assessing_risk' && (
                  <p className="text-muted-foreground">Analyzing document risks...</p>
                )}

                {riskScore !== null && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {/* Risk Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={cn("h-3 rounded-full transition-all duration-500", {
                            "bg-green-500": riskScore <= 30,
                            "bg-yellow-500": riskScore > 30 && riskScore <= 70,
                            "bg-red-500": riskScore > 70,
                          })}
                          style={{ width: `${riskScore}%` }}
                        />
                      </div>

                      {/* Risk Level Label */}
                      <p className={cn("text-base font-semibold text-center", {
                        "text-green-600": riskScore <= 30,
                        "text-yellow-600": riskScore > 30 && riskScore <= 70,
                        "text-red-600": riskScore > 70,
                      })}>
                        {riskScore <= 30 ? 'Low Risk' :
                         riskScore <= 70 ? 'Medium Risk' :
                         'High Risk'}
                      </p>
                    </div>

                    {riskSummary && (
                      <div className="p-4 bg-accent/50 rounded-lg">
                        <h3 className="font-medium mb-2">Summary</h3>
                        <p className="text-sm text-muted-foreground">{riskSummary}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clauses Tab */}
          {activeTab === 'clauses' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold">Clause Explanations</h2>
                  {clausesStatus === 'explaining_clauses' && (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>

                {clausesStatus === 'explaining_clauses' && (
                  <p className="text-muted-foreground">Explaining legal clauses...</p>
                )}

                {clauses.length > 0 && (
                  <div className="space-y-3">
                    {clauses.map((clause, index) => (
                      <Collapsible
                        key={index}
                        open={expandedClauses.has(index)}
                        onOpenChange={() => onToggleClause(index)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/50 hover:bg-accent/70 rounded-lg transition-colors">
                          <span className="font-medium text-sm text-left">{clause.clauseTitle}</span>
                          {expandedClauses.has(index) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3 px-3 space-y-3">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Original Text</h4>
                            <p className="text-sm text-muted-foreground italic">{clause.originalText}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Plain English</h4>
                            <p className="text-sm">{clause.plainEnglish}</p>
                          </div>
                          {clause.jargon && clause.jargon.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Legal Terms</h4>
                              <div className="space-y-2">
                                {clause.jargon.map((term, jIndex) => (
                                  <div key={jIndex} className="text-sm">
                                    <span className="font-medium">{term.term}:</span>{' '}
                                    <span className="text-muted-foreground">{term.definition}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}

                {clauses.length === 0 && clausesStatus !== 'explaining_clauses' && (
                  <p className="text-muted-foreground">No clauses to explain.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
                  {faqsStatus === 'generating_faqs' && (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>

                {faqsStatus === 'generating_faqs' && (
                  <p className="text-muted-foreground">Generating FAQs...</p>
                )}

                {faqs.length > 0 && (
                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <Collapsible
                        key={index}
                        open={expandedFaqs.has(index)}
                        onOpenChange={() => onToggleFaq(index)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/50 hover:bg-accent/70 rounded-lg transition-colors">
                          <span className="font-medium text-sm text-left">{faq.question}</span>
                          {expandedFaqs.has(index) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3 px-3">
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}

                {faqs.length === 0 && faqsStatus !== 'generating_faqs' && (
                  <p className="text-muted-foreground">No FAQs available.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Missing Clauses Tab */}
          {activeTab === 'missing' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold">Missing Clause Analysis</h2>
                  {missingStatus === 'detecting_missing' && (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>

                {missingStatus === 'detecting_missing' && (
                  <p className="text-muted-foreground">Detecting missing clauses...</p>
                )}

                {missingClauses && (
                  <div className="space-y-4">
                    {missingClauses.summary && (
                      <div className="p-4 bg-accent/50 rounded-lg">
                        <h3 className="font-medium mb-2">Summary</h3>
                        <p className="text-sm text-muted-foreground">{missingClauses.summary}</p>
                      </div>
                    )}

                    {missingClauses.missingClauses && missingClauses.missingClauses.length > 0 && (
                      <div className="space-y-3">
                        {missingClauses.missingClauses.map((clause, index) => (
                          <Collapsible
                            key={index}
                            open={expandedMissingClauses.has(index)}
                            onOpenChange={() => onToggleMissingClause(index)}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/50 hover:bg-accent/70 rounded-lg transition-colors">
                              <span className="font-medium text-sm text-left">{clause.clauseTitle}</span>
                              {expandedMissingClauses.has(index) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-3 px-3 space-y-3">
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Why It's Important</h4>
                                <p className="text-sm text-muted-foreground">{clause.description}</p>
                              </div>
                              {clause.suggestedLanguage && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Suggested Language</h4>
                                  <p className="text-sm italic">{clause.suggestedLanguage}</p>
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}

                    {(!missingClauses.missingClauses || missingClauses.missingClauses.length === 0) && (
                      <p className="text-muted-foreground">No missing clauses detected. This document appears comprehensive.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <>
              {documentContext ? (
                <ChatInterface
                  documentContext={documentContext}
                  onSendMessage={onSendMessage}
                  className="w-full"
                />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">Chat will be available once analysis is complete.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
