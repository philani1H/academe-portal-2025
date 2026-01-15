"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Upload, File, X } from "lucide-react"

interface FileUploadProps {
  onUpload?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  className?: string
}

import { api } from "@/lib/api"

export default function FileUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  
  // Default values for page usage
  const maxSize = 10
  const accept = "*"
  const multiple = true

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than ${maxSize}MB`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (multiple) {
      setFiles((prev) => [...prev, ...validFiles])
    } else {
      setFiles(validFiles.slice(0, 1))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = files.length
      let completed = 0
      const uploadedFileNames: string[] = []

      // Upload files sequentially to track progress
      for (const file of files) {
        await api.uploadFile(file)
        uploadedFileNames.push(file.name)
        completed++
        setUploadProgress(Math.round((completed / totalFiles) * 100))
      }

      setFiles([])

      // Send email notification to students about new material
      try {
        const token = localStorage.getItem("auth_token")
        await fetch("/api/tutor/material/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            materialNames: uploadedFileNames,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError)
        // Don't fail the upload if email fails
      }

      toast({
        title: "Success",
        description: `${totalFiles} file(s) uploaded successfully`,
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="w-full">
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">Maximum file size: {maxSize}MB</p>
            </div>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="mt-4 bg-transparent" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Selected Files ({files.length})</h4>
                <Button onClick={uploadFiles} disabled={uploading} size="sm">
                  {uploading ? "Uploading..." : "Upload Files"}
                </Button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={uploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
