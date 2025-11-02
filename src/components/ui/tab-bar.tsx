'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  AlertTriangle,
  FileText,
  HelpCircle,
  Search,
  MessageSquare,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type AnalysisTabId = 'keyNumbers' | 'risk' | 'clauses' | 'faqs' | 'missing' | 'chat';

export interface AnalysisTab {
  id: AnalysisTabId;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isActive: boolean;
  badge?: string | number;
}

interface TabBarProps {
  tabs: AnalysisTab[];
  activeTab: AnalysisTabId;
  onTabClick: (tabId: AnalysisTabId) => void;
  className?: string;
}

const tabIcons: Record<AnalysisTabId, React.ReactNode> = {
  keyNumbers: <Hash className="h-4 w-4" />,
  risk: <AlertTriangle className="h-4 w-4" />,
  clauses: <FileText className="h-4 w-4" />,
  faqs: <HelpCircle className="h-4 w-4" />,
  missing: <Search className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
};

export function TabBar({ tabs, activeTab, onTabClick, className }: TabBarProps) {
  return (
    <div className={cn("relative bg-background border-b", className)}>
      {/* Tab Container with Horizontal Scroll */}
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isClickable = tab.isComplete;

          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              onClick={() => isClickable && onTabClick(tab.id)}
              disabled={!isClickable}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 min-w-fit whitespace-nowrap transition-all duration-200",
                "border-r border-border/50 last:border-r-0",
                {
                  "bg-background text-foreground font-medium": isActive,
                  "bg-muted/30 text-muted-foreground hover:bg-muted/50": !isActive && isClickable,
                  "bg-muted/10 text-muted-foreground/50 cursor-not-allowed": !isClickable,
                  "hover:text-foreground": isClickable && !isActive,
                }
              )}
            >
              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center",
                {
                  "text-primary": isActive,
                  "text-muted-foreground": !isActive && isClickable,
                  "text-muted-foreground/40": !isClickable,
                }
              )}>
                {!tab.isComplete ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : tab.isComplete && !isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  tabIcons[tab.id]
                )}
              </div>

              {/* Label */}
              <span className="text-sm">{tab.label}</span>

              {/* Badge */}
              {tab.badge !== undefined && (
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {tab.badge}
                </Badge>
              )}

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Border with Animated Progress */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border">
        <motion.div
          className="h-full bg-primary/20"
          initial={{ width: "0%" }}
          animate={{
            width: `${(tabs.filter(t => t.isComplete).length / tabs.length) * 100}%`
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// Helper function to create tabs from analysis state
export function createAnalysisTabs(
  keyNumbersCount: number,
  riskScore: number | null,
  clausesCount: number,
  faqsCount: number,
  missingClausesCount: number,
  status: string,
  completedSteps: Set<string>
): AnalysisTab[] {
  // Use Set-based completion tracking for persistent tab states
  const isKeyNumbersComplete =
    completedSteps.has('numbers_complete') ||
    status === 'extracting_numbers' ||
    status === 'numbers_complete';

  const isRiskComplete =
    completedSteps.has('risk_complete') ||
    status === 'assessing_risk' ||
    status === 'risk_complete';

  const isClausesComplete =
    completedSteps.has('clauses_complete') ||
    status === 'explaining_clauses' ||
    status === 'clauses_complete';

  const isFaqsComplete =
    completedSteps.has('faqs_complete') ||
    status === 'generating_faqs' ||
    status === 'faqs_complete';

  const isMissingComplete =
    completedSteps.has('missing_complete') ||
    status === 'detecting_missing' ||
    status === 'missing_complete';

  const isChatReady = status === 'chat_ready';

  return [
    {
      id: 'keyNumbers',
      label: 'Key Numbers',
      icon: <Hash className="h-4 w-4" />,
      isComplete: isKeyNumbersComplete,
      isActive: false,
      badge: keyNumbersCount > 0 ? keyNumbersCount : undefined,
    },
    {
      id: 'risk',
      label: 'Risk',
      icon: <AlertTriangle className="h-4 w-4" />,
      isComplete: isRiskComplete,
      isActive: false,
      badge: riskScore !== null ? riskScore : undefined,
    },
    {
      id: 'clauses',
      label: 'Clauses',
      icon: <FileText className="h-4 w-4" />,
      isComplete: isClausesComplete,
      isActive: false,
      badge: clausesCount > 0 ? clausesCount : undefined,
    },
    {
      id: 'faqs',
      label: 'FAQs',
      icon: <HelpCircle className="h-4 w-4" />,
      isComplete: isFaqsComplete,
      isActive: false,
      badge: faqsCount > 0 ? faqsCount : undefined,
    },
    {
      id: 'missing',
      label: 'Missing',
      icon: <Search className="h-4 w-4" />,
      isComplete: isMissingComplete,
      isActive: false,
      badge: missingClausesCount > 0 ? missingClausesCount : undefined,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="h-4 w-4" />,
      isComplete: isChatReady,
      isActive: false,
    },
  ];
}
