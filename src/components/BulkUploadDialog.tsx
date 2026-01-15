import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onUpload: (file: File) => Promise<{ updated: number; created: number; total: number; message: string; warnings?: string[] }>;
  templateCsvUrl?: string;
  templateJsonUrl?: string;
  csvExample: string;
  jsonExample: string;
  guidelines: string[];
  onExport?: () => Promise<void>;
}

export const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onUpload,
  templateCsvUrl,
  templateJsonUrl,
  csvExample,
  jsonExample,
  guidelines,
  onExport
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ updated: number; created: number; total: number; message: string; warnings?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setProgress(0);
    setError(null);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const uploadResult = await onUpload(file);
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');
      setResult(uploadResult);
      
      // Reset file input
      e.target.value = '';
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        if (status === 'success') {
          onOpenChange(false);
          resetState();
        }
      }, 3000);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;
    setExporting(true);
    try {
      await onExport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const resetState = () => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      setTimeout(resetState, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-4 py-4">
            {/* Upload Section */}
            <div className="space-y-2">
              <Label>Upload File (CSV, JSON, or Excel)</Label>
              <Input
                type="file"
                accept=".csv,.json,.xlsx"
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              {/* Progress Bar */}
              {status === 'uploading' && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading... {progress}%
                  </p>
                </div>
              )}

              {/* Success Message */}
              {status === 'success' && result && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">{result.message}</p>
                      <p className="text-sm text-green-700 mt-1">
                        Updated: {result.updated} | Created: {result.created} | Total: {result.total}
                      </p>
                    </div>
                  </div>
                  {Array.isArray(result.warnings) && result.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="font-medium text-yellow-900">Warnings</p>
                      <ul className="mt-1 space-y-1 text-sm text-yellow-800 list-disc list-inside">
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {status === 'error' && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Upload Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Supported formats: CSV, JSON, Excel'}
              </p>

              {/* Template Downloads & Export */}
              <div className="flex flex-wrap gap-2 mt-2">
                {templateCsvUrl && (
                  <a 
                    href={templateCsvUrl} 
                    download 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download Excel/CSV Template
                  </a>
                )}
                {templateJsonUrl && (
                  <>
                    <span className="text-gray-300">|</span>
                    <a 
                      href={templateJsonUrl} 
                      download 
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download JSON Template
                    </a>
                  </>
                )}
                {onExport && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="text-sm text-green-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Export Current Data
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Format Guidelines */}
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <h4 className="font-semibold text-sm">File Format Guidelines:</h4>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">CSV Format:</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {csvExample}
                </pre>
                <ul className="text-xs text-gray-600 space-y-1">
                  {guidelines.map((guideline, index) => (
                    <li key={index}>• {guideline}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">JSON Format:</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {jsonExample}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={uploading}
          >
            {status === 'success' ? 'Done' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
