'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  private errorCount = 0;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.errorCount++;
    
    // Enhanced error logging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      count: this.errorCount,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      // Try to extract more meaningful info from minified code
      location: this.extractErrorLocation(error),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.group(`🚨 Error Boundary Caught Error #${this.errorCount}`);
    console.error('Error Details:', errorDetails);
    console.error('Original Error Object:', error);
    console.error('React Error Info:', errorInfo);
    console.groupEnd();

    // Set full error state
    this.setState({
      hasError: true,
      error,
      errorInfo,
      showDetails: false
    });

    // Store error in sessionStorage for persistence
    try {
      sessionStorage.setItem('lastError', JSON.stringify(errorDetails));
    } catch (e) {
      console.warn('Could not store error in sessionStorage:', e);
    }

    // Don't auto-recover to prevent losing error details
  }

  private extractErrorLocation(error: Error): string {
    if (!error.stack) return 'Unknown location';
    
    const stackLines = error.stack.split('\n');
    const relevantLine = stackLines.find(line => 
      line.includes('index-') || 
      line.includes('.js:') || 
      line.includes('.tsx:') ||
      line.includes('excellenceakademie.co.za')
    );
    
    if (relevantLine) {
      // Try to extract file and line number
      const match = relevantLine.match(/([^/\\]+\.js):(\d+):(\d+)/);
      if (match) {
        return `File: ${match[1]}, Line: ${match[2]}, Column: ${match[3]}`;
      }
      return relevantLine.trim();
    }
    
    return stackLines[1] || 'Unknown location';
  }

  private copyErrorToClipboard = async () => {
    const errorText = JSON.stringify({
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      name: this.state.error?.name,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      location: this.extractErrorLocation(this.state.error!),
      url: window.location.href
    }, null, 2);

    try {
      await navigator.clipboard.writeText(errorText);
      alert('Error details copied to clipboard!');
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard!');
    }
  };

  private tryRecovery = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  private parseComponentStack = (componentStack: string) => {
    return componentStack
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim())
      .slice(0, 10); // Limit to first 10 components
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      const location = this.extractErrorLocation(this.state.error);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Error Detected - No App Restart
              </CardTitle>
              <div className="text-sm text-gray-500">
                Error ID: {this.state.errorId} | Count: {this.errorCount} | Time: {new Date().toLocaleTimeString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">Error Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Type:</strong> {this.state.error.name}</p>
                    <p><strong>Message:</strong> {this.state.error.message}</p>
                    <p><strong>Location:</strong> {location}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    variant="outline"
                    size="sm"
                  >
                    {this.state.showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                  </Button>
                  <Button
                    onClick={this.copyErrorToClipboard}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Error Details
                  </Button>
                </div>

                {this.state.showDetails && (
                  <div className="space-y-4">
                    {this.state.error.stack && (
                      <div className="bg-gray-100 p-3 rounded">
                        <h4 className="font-medium mb-2">Stack Trace</h4>
                        <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <div className="bg-blue-50 p-3 rounded">
                        <h4 className="font-medium mb-2">React Component Stack</h4>
                        <div className="text-xs space-y-1">
                          {this.parseComponentStack(this.state.errorInfo.componentStack).map((line, index) => (
                            <div key={index} className="font-mono">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-50 p-3 rounded">
                      <h4 className="font-medium mb-2">Debugging Tips</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Check if any arrays/objects are null before using .map() or .length</li>
                        <li>• Verify API responses return expected data structures</li>
                        <li>• Look for undefined variables in the component stack above</li>
                        <li>• Check recent code changes around the error location</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={this.tryRecovery}
                    className="flex-1"
                  >
                    Try to Continue (Don't Restart)
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    Refresh Page (Last Resort)
                  </Button>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Console:</strong> Detailed error information has been logged to the browser console. 
                  Press F12 → Console tab to see full details.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;