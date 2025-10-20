'use client';

import React, { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { ProductList } from '@/types/lists';
import { generatePDFHTML } from '@/services/pdf-generator';

interface PDFPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  list: ProductList | null;
  onPrint: () => void;
}

export function PDFPreview({ isOpen, onClose, list, onPrint }: PDFPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && list && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(generatePDFHTML(list));
        doc.close();
      }
    }
  }, [isOpen, list]);

  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">PDF Preview</h2>
            <p className="text-sm text-zinc-600 mt-1">{list.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-zinc-100 p-8">
          <div className="max-w-6xl mx-auto bg-white shadow-lg">
            <iframe
              ref={iframeRef}
              className="w-full h-[calc(90vh-200px)] border-0"
              title="PDF Preview"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50">
          <p className="text-xs text-zinc-600 text-center">
            Click Print to save as PDF or send to printer
          </p>
        </div>
      </div>
    </div>
  );
}
