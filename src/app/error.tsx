'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go Home
          </Button>
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}