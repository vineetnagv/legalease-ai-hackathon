'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetErrorBoundary, errorInfo }: ErrorFallbackProps) {
  const isChunkLoadError = error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError');
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-500">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle className="text-xl">
            {isChunkLoadError ? 'App Update Available' : 'Something went wrong'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {isChunkLoadError ? (
              <p>
                The app has been updated. Please refresh the page to get the latest version.
              </p>
            ) : isNetworkError ? (
              <p>
                There seems to be a network issue. Please check your connection and try again.
              </p>
            ) : (
              <p>
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground mb-2">
                Error Details (Development)
              </summary>
              <div className="bg-muted p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack}
                  </>
                )}
                {errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {errorInfo.componentStack}
                  </>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isChunkLoadError ? 'Refresh Page' : 'Try Again'}
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for imperative error handling
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: string) => {
    // Log error
    console.error('Error caught by error handler:', error);

    // In a real app, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service like Sentry, LogRocket, etc.
    }
  }, []);
}

// Wrapper component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorFallbackProps };