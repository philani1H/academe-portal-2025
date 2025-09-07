import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { AlertCircle, Mail, ExternalLink } from 'lucide-react';

const AgreementBlockModal = () => {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-md bg-gradient-to-b from-blue-50 to-white" onClose={() => {}}>
        <AlertDialogHeader className="space-y-6">
          {/* Icon Container */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>

          <AlertDialogTitle className="text-2xl font-bold text-blue-900 text-center">
            Access Restricted
          </AlertDialogTitle>

          <AlertDialogDescription className="space-y-6">
            {/* Main Message */}
            <div className="text-center space-y-3">
              <p className="font-medium text-gray-900">
                Sorry, you cannot access this website at the moment.
              </p>
              <p className="text-gray-600">
                The agreement between the programmer and the owner hasn't been met.
              </p>
            </div>

            {/* Contact Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-900 mb-2">Need assistance?</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <Mail className="h-4 w-4" />
                  <a 
                    href="mailto:ExcellenceAcademia2025@gmail.com"
                    className="text-sm hover:text-blue-500 transition-colors"
                  >
                    ExcellenceAcademia2025@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="pt-4 border-t border-blue-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600 font-medium">
                  Status: Pending Agreement
                </span>
                <div className="flex items-center gap-1 text-blue-500">
                  <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Reference #2025
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AgreementBlockModal;