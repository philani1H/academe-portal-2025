import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Loader2, WrenchIcon, Mail } from 'lucide-react';

const MaintenanceModal = () => {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-md" onClose={() => {}}>
        <AlertDialogHeader className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <WrenchIcon className="h-8 w-8 text-yellow-600 animate-pulse" />
          </div>
          
          <AlertDialogTitle className="text-2xl font-bold text-center text-gray-900">
            Site Under Maintenance
          </AlertDialogTitle>
          
          <AlertDialogDescription className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-700 font-medium">
                We're currently performing some important updates to improve your experience.
              </p>
              <p className="text-gray-600">
                Our team is working hard to get everything back up and running as soon as possible.
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Estimated completion: 2 hours</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <a 
                  href="mailto:ExcellenceAcademia2025@gmail.com" 
                  className="hover:text-blue-600 transition-colors"
                >
                  ExcellenceAcademia2025@gmail.com
                </a>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MaintenanceModal;