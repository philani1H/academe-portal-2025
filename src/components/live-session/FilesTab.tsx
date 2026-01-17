import React, { RefObject } from 'react'
import { SharedFile } from './types'
import { Upload, FileText, Download, File, Image, Film, Music, Archive } from 'lucide-react'

interface FilesTabProps {
  sharedFiles: SharedFile[]
  fileInputRef?: RefObject<HTMLInputElement>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  userRole?: 'tutor' | 'student'
}

// Get file icon based on extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <Image className="h-5 w-5 text-pink-400" />;
  }
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
    return <Film className="h-5 w-5 text-purple-400" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return <Music className="h-5 w-5 text-green-400" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <Archive className="h-5 w-5 text-yellow-400" />;
  }
  return <File className="h-5 w-5 text-indigo-400" />;
};

export function FilesTab({
  sharedFiles,
  fileInputRef,
  onFileUpload,
  userRole
}: FilesTabProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 p-3 sm:p-4">
      {/* Upload Button */}
      <button
        onClick={() => fileInputRef?.current?.click()}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-dashed border-indigo-500/40 hover:border-indigo-400/60 text-indigo-300 hover:text-indigo-200 transition-all duration-200 flex items-center justify-center gap-2 group"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <Upload className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium text-sm">Upload File</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileUpload}
        className="hidden"
      />

      {/* Files List */}
      <div className="flex-1 overflow-auto mt-4 space-y-2">
        {sharedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-indigo-400/50" />
            </div>
            <p className="text-indigo-300/60 text-sm">No files shared yet</p>
            <p className="text-indigo-300/40 text-xs mt-1">Upload files to share with everyone</p>
          </div>
        ) : (
          sharedFiles.map((file, index) => (
            <div
              key={file.id}
              className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-800 hover:to-slate-900 rounded-xl p-3 border border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                {/* File Icon */}
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-indigo-300/50 text-xs mt-0.5">
                    {file.size} • <span className="text-indigo-400/70">{file.uploadedBy}</span>
                  </p>
                </div>

                {/* Download Button */}
                <button className="h-9 w-9 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
