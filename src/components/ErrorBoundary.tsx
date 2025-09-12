'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error details
    console.error('Uncaught error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Set error details in state
    this.setState({
      hasError: true,
      error: error
    });

    // Reset error state after 5 seconds and try to recover
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null
      });
    }, 5000);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  We apologize for the inconvenience. An error occurred while loading this page.
                </p>
                {this.state.error && (
                  <div className="text-sm bg-red-50 p-3 rounded border border-red-100">
                    <p className="font-medium text-red-800">{this.state.error.name}</p>
                    <p className="text-red-600">{this.state.error.message}</p>
                  </div>
                )}
                <p className="text-gray-500 text-sm">
                  The page will automatically refresh in 5 seconds, or you can try refreshing manually.
                </p>
              </div>
              <Button
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;