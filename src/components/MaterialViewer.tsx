'use client'

import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import ReactPlayer from 'react-player'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface MaterialViewerProps {
  material: {
    id: string
    title: string
    type: 'pdf' | 'video' | 'document'
    url: string
  }
  onClose?: () => void
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset
      return Math.max(1, Math.min(newPageNumber, numPages))
    })
  }

  const previousPage = () => changePage(-1)
  const nextPage = () => changePage(1)
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5))

  const handleDownload = () => {
    // For PDF files, we'll try to use a landscape-aware print approach if it's a generated PDF,
    // but since these are static URLs from a server, we just download the file.
    // The user's request for "horizontal" PDFs mostly applies to platform-generated documents.
    const link = document.createElement('a')
    link.href = material.url
    link.download = material.title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    if (material.type !== 'pdf') return;
    
    const printWindow = window.open(material.url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        const style = printWindow.document.createElement('style');
        style.textContent = `
          @page { size: landscape; margin: 0; }
          body { margin: 0; }
          img, canvas, svg { max-width: 100%; height: auto; }
        `;
        printWindow.document.head.appendChild(style);
        printWindow.print();
      };
    }
  };

  if (material.type === 'video' || ReactPlayer.canPlay(material.url)) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{material.title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <ReactPlayer
              url={material.url}
              controls
              width="100%"
              height="100%"
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                  },
                },
              }}
            />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={handleDownload} variant="outline" className="text-white border-white hover:bg-white/20">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (material.type === 'pdf') {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{material.title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <Card className="bg-white p-4">
            <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={zoomOut} variant="outline" size="sm" disabled={scale <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{Math.round(scale * 100)}%</span>
                <Button onClick={zoomIn} variant="outline" size="sm" disabled={scale >= 3.0}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex justify-center overflow-auto max-h-[70vh] bg-gray-100 rounded">
              <Document
                file={material.url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                }
                error={
                  <div className="p-8 text-center text-red-600">
                    Failed to load PDF. Please try downloading it instead.
                  </div>
                }
              >
                <Page pageNumber={pageNumber} scale={scale} />
              </Document>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Fallback for other document types
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{material.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">This material type is not directly viewable in the browser.</p>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download {material.title}
          </Button>
        </div>
      </Card>
    </div>
  )
}
