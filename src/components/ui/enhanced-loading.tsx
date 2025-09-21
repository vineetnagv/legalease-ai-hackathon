'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number; // estimated duration in ms
}

interface EnhancedLoadingProps {
  title?: string;
  message?: string;
  steps?: LoadingStep[];
  currentStepId?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  showSteps?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
  className?: string;
  children?: React.ReactNode;
}

export function EnhancedLoading({
  title = "Processing...",
  message,
  steps = [],
  currentStepId,
  progress,
  showProgress = false,
  showSteps = false,
  variant = 'default',
  className,
  children
}: EnhancedLoadingProps) {
  // Calculate progress from steps if not provided
  const calculatedProgress = React.useMemo(() => {
    if (progress !== undefined) return progress;
    if (steps.length === 0) return 0;

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const currentStepIndex = currentStepId ? steps.findIndex(step => step.id === currentStepId) : -1;

    if (currentStepIndex >= 0) {
      return Math.round(((completedSteps + 0.5) / steps.length) * 100);
    }

    return Math.round((completedSteps / steps.length) * 100);
  }, [progress, steps, currentStepId]);

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
    );
  }

  // Default variant
  if (variant === 'default' && !showSteps) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <LoaderCircle className="h-12 w-12 text-primary" />
          </motion.div>

          <h3 className="text-lg font-medium mb-2">{title}</h3>

          {message && (
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
          )}

          {showProgress && (
            <div className="w-full max-w-xs space-y-2">
              <Progress value={calculatedProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {calculatedProgress}% complete
              </div>
            </div>
          )}

          {children}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant or when showing steps
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <LoaderCircle className="h-10 w-10 text-primary" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            {message && (
              <p className="text-muted-foreground">{message}</p>
            )}
          </div>

          {/* Overall Progress */}
          {(showProgress || steps.length > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{calculatedProgress}%</span>
              </div>
              <Progress value={calculatedProgress} className="h-3" />
            </div>
          )}

          {/* Steps */}
          {showSteps && steps.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Processing Steps</h4>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      {
                        "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800": step.status === 'processing',
                        "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800": step.status === 'completed',
                        "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800": step.status === 'error',
                        "bg-muted/30": step.status === 'pending'
                      }
                    )}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {step.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {step.status === 'processing' && (
                        <LoaderCircle className="h-5 w-5 text-primary animate-spin" />
                      )}
                      {step.status === 'error' && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      {step.status === 'pending' && (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "font-medium text-sm",
                          {
                            "text-blue-700 dark:text-blue-300": step.status === 'processing',
                            "text-green-700 dark:text-green-300": step.status === 'completed',
                            "text-red-700 dark:text-red-300": step.status === 'error',
                            "text-muted-foreground": step.status === 'pending'
                          }
                        )}>
                          {step.title}
                        </span>

                        {step.status === 'processing' && step.duration && (
                          <span className="text-xs text-muted-foreground">
                            ~{Math.round(step.duration / 1000)}s
                          </span>
                        )}
                      </div>

                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Processing Animation */}
                    {step.status === 'processing' && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loading component for content areas
export function SkeletonLoader({
  lines = 3,
  className,
  showAvatar = false
}: {
  lines?: number;
  className?: string;
  showAvatar?: boolean;
}) {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-muted h-10 w-10"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-1/6"></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-muted rounded",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// File upload loading component
export function FileUploadLoading({
  fileName,
  progress,
  status = 'uploading'
}: {
  fileName: string;
  progress?: number;
  status?: 'uploading' | 'processing' | 'completed' | 'error';
}) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {status === 'completed' ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : status === 'error' ? (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            ) : (
              <FileText className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <span className="text-xs text-muted-foreground">
                {status === 'uploading' ? 'Uploading...' :
                 status === 'processing' ? 'Processing...' :
                 status === 'completed' ? 'Complete' : 'Error'}
              </span>
            </div>

            {progress !== undefined && status !== 'error' && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {progress}% {status === 'uploading' ? 'uploaded' : 'processed'}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { LoadingStep, EnhancedLoadingProps };