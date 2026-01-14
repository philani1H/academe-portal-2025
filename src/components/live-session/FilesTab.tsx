import React, { RefObject } from 'react'
import { SharedFile } from './types'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Download } from 'lucide-react'

interface FilesTabProps {
  sharedFiles: SharedFile[]
  fileInputRef: RefObject<HTMLInputElement>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function FilesTab({
  sharedFiles,
  fileInputRef,
  onFileUpload
}: FilesTabProps) {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
        variant="outline"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload File
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileUpload}
        className="hidden"
      />
      
      {sharedFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files shared yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sharedFiles.map((file) => (
            <div key={file.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {file.size} • {file.uploadedBy}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="text-white ml-2">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
