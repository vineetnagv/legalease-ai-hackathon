'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, LoaderCircle, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AnalysisStep = {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // in seconds
  icon?: React.ReactNode;
};

type StepStatus = 'pending' | 'processing' | 'completed';

interface ProgressIndicatorProps {
  currentStep: string;
  steps?: AnalysisStep[];
  className?: string;
  showDetailedView?: boolean;
}

const DEFAULT_ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 'extracting_numbers',
    title: 'Extract Key Numbers',
    description: 'Finding important dates, amounts, and deadlines',
    estimatedTime: 15,
  },
  {
    id: 'assessing_risk',
    title: 'Assess Document Risk',
    description: 'Analyzing potential risks and concerns',
    estimatedTime: 20,
  },
  {
    id: 'explaining_clauses',
    title: 'Explain Legal Clauses',
    description: 'Breaking down complex legal language',
    estimatedTime: 25,
  },
  {
    id: 'generating_faqs',
    title: 'Generate FAQs',
    description: 'Creating relevant questions and answers',
    estimatedTime: 18,
  },
  {
    id: 'detecting_missing',
    title: 'Detect Missing Clauses',
    description: 'Identifying important missing protections',
    estimatedTime: 22,
  },
  {
    id: 'chat_ready',
    title: 'Initialize Chat',
    description: 'Preparing interactive analysis chat',
    estimatedTime: 5,
  },
];

export function ProgressIndicator({
  currentStep,
  steps = DEFAULT_ANALYSIS_STEPS,
  className,
  showDetailedView = true
}: ProgressIndicatorProps) {
  // Calculate progress
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex : 0;
  const totalSteps = steps.length;
  const progressPercentage = currentStep === 'chat_ready' ? 100 : Math.round((completedSteps / totalSteps) * 100);

  // Calculate estimated time remaining
  const remainingSteps = currentStepIndex >= 0 ? steps.slice(currentStepIndex + 1) : steps;
  const currentStepRemainingTime = currentStepIndex >= 0 ? steps[currentStepIndex]?.estimatedTime || 0 : 0;
  const totalRemainingTime = remainingSteps.reduce((acc, step) => acc + step.estimatedTime, 0) + currentStepRemainingTime;

  // Helper function to get step status
  const getStepStatus = (stepIndex: number): StepStatus => {
    if (stepIndex < currentStepIndex || currentStep === 'chat_ready') return 'completed';
    if (stepIndex === currentStepIndex && currentStep !== 'chat_ready') return 'processing';
    return 'pending';
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Helper function to get status icon
  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <LoaderCircle className="h-5 w-5 text-primary animate-spin" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (!showDetailedView) {
    // Compact view for smaller screens or when minimal UI is preferred
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Analysis Progress</h3>
              <Badge variant="outline">
                Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progressPercentage}% Complete</span>
                {totalRemainingTime > 0 && (
                  <span className="text-muted-foreground">
                    ~{formatTime(totalRemainingTime)} remaining
                  </span>
                )}
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {currentStepIndex >= 0 && currentStepIndex < steps.length && (
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon('processing')}
                <span className="font-medium">
                  {steps[currentStepIndex].title}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Document Analysis Progress</span>
          <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
            {progressPercentage}% Complete
          </Badge>
        </CardTitle>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}</span>
            {totalRemainingTime > 0 && currentStep !== 'chat_ready' && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>~{formatTime(totalRemainingTime)} remaining</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isActive = status === 'processing';

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0.7 }}
                animate={{
                  opacity: status === 'pending' ? 0.7 : 1,
                  scale: isActive ? 1.02 : 1
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
                  {
                    "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800": status === 'completed',
                    "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 shadow-sm": status === 'processing',
                    "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700": status === 'pending'
                  }
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(status)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={cn(
                      "font-medium",
                      {
                        "text-green-700 dark:text-green-300": status === 'completed',
                        "text-blue-700 dark:text-blue-300": status === 'processing',
                        "text-muted-foreground": status === 'pending'
                      }
                    )}>
                      {step.title}
                    </h4>

                    {/* Step timing info */}
                    {status === 'processing' && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        ~{formatTime(step.estimatedTime)}
                      </div>
                    )}
                  </div>

                  <p className={cn(
                    "text-sm",
                    {
                      "text-green-600 dark:text-green-400": status === 'completed',
                      "text-blue-600 dark:text-blue-400": status === 'processing',
                      "text-muted-foreground": status === 'pending'
                    }
                  )}>
                    {step.description}
                  </p>
                </div>

                {/* Processing Animation */}
                <AnimatePresence>
                  {status === 'processing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-shrink-0"
                    >
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Message */}
        {currentStep === 'chat_ready' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Analysis Complete!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Your document has been fully analyzed. You can now chat with the AI about your document or export the results.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Export types for use in other components
export type { AnalysisStep, StepStatus, ProgressIndicatorProps };
export { DEFAULT_ANALYSIS_STEPS };