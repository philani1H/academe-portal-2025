import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loading message={message} className={className} />
    </div>
  );
}