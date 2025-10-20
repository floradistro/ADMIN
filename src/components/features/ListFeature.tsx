'use client';

import React, { useState } from 'react';
import { Product, ColumnConfig } from '../../types';
import { ProductList, ListColumn } from '../../types/lists';
import { CreateListModal } from './CreateListModal';
import { ListManager } from './ListManager';
import { ListViewer } from './ListViewer';
import { EmailListDialog } from './EmailListDialog';
import { ListExportService } from '../../services/list-export-service';
import { useListContext } from '../../contexts/ListContext';

interface ListFeatureProps {
  selectedProducts: Product[];
  availableColumns: ColumnConfig[];
  onClearSelection?: () => void;
}

export function ListFeature({
  selectedProducts,
  availableColumns,
  onClearSelection
}: ListFeatureProps) {
  const {
    lists,
    createList,
    updateList,
    deleteList,
    duplicateList,
    getList,
    recordExport,
    isCreatingList,
    setIsCreatingList
  } = useListContext();

  const [isManaging, setIsManaging] = useState(false);
  const [viewingListId, setViewingListId] = useState<string | null>(null);
  const [emailingListId, setEmailingListId] = useState<string | null>(null);

  const viewingList = viewingListId ? getList(viewingListId) : null;
  const emailingList = emailingListId ? getList(emailingListId) : null;

  const handleCreateList = (
    name: string,
    description: string,
    columns: ListColumn[],
    settings: ProductList['settings']
  ) => {
    const newList = createList(name, description, selectedProducts, columns, settings);
    onClearSelection?.();
  };

  const handleExport = async (listId: string, format: 'pdf' | 'csv') => {
    const list = getList(listId);
    if (!list) return;

    try {
      let blob: Blob;
      let filename: string;

      if (format === 'pdf') {
        blob = await ListExportService.exportToPDF(list);
        filename = `${list.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      } else {
        blob = await ListExportService.exportToCSV(list);
        filename = `${list.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      }

      ListExportService.downloadBlob(blob, filename);
      recordExport(listId);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  const handleEmail = (listId: string) => {
    setEmailingListId(listId);
  };

  const handleSendEmail = async (recipients: string[], subject: string, message: string) => {
    if (!emailingList) return;

    try {
      const response = await fetch('/api/lists/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          list: emailingList,
          recipients,
          subject,
          message,
          attachFormat: 'pdf'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Email API error:', data);
        throw new Error(data.error || data.message || 'Failed to send email');
      }

      console.log('Email sent successfully:', data);
      recordExport(emailingList.id);
    } catch (error) {
      console.error('Email failed:', error);
      throw error;
    }
  };

  const handleDelete = (listId: string) => {
    if (confirm('Are you sure you want to delete this list?')) {
      deleteList(listId);
    }
  };

  const handleDuplicate = (listId: string) => {
    duplicateList(listId);
  };

  const handleView = (listId: string) => {
    setViewingListId(listId);
    setIsManaging(false);
  };

  return (
    <>
      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreatingList}
        onClose={() => setIsCreatingList(false)}
        selectedProducts={selectedProducts}
        availableColumns={availableColumns}
        onCreateList={handleCreateList}
      />

      {/* List Manager */}
      <ListManager
        isOpen={isManaging}
        onClose={() => setIsManaging(false)}
        lists={lists}
        onExport={handleExport}
        onEmail={handleEmail}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onView={handleView}
      />

      {/* List Viewer */}
      <ListViewer
        isOpen={viewingListId !== null}
        onClose={() => setViewingListId(null)}
        list={viewingList || null}
        onExport={(format) => viewingListId && handleExport(viewingListId, format)}
        onEmail={() => viewingListId && handleEmail(viewingListId)}
      />

      {/* Email Dialog */}
      <EmailListDialog
        isOpen={emailingListId !== null}
        onClose={() => setEmailingListId(null)}
        list={emailingList || null}
        onSend={handleSendEmail}
      />

      {/* Desktop Control Buttons */}
      <div className="hidden md:flex fixed bottom-6 right-6 gap-2 z-40">
        {lists.length > 0 && (
          <button
            onClick={() => setIsManaging(true)}
            className="group px-4 py-2 bg-neutral-800/95 hover:bg-neutral-700/95 backdrop-blur-sm border border-white/[0.08] text-neutral-300 rounded shadow-xl flex items-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm">Lists</span>
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">{lists.length}</span>
          </button>
        )}
        
        {selectedProducts.length > 0 && (
          <button
            onClick={() => setIsCreatingList(true)}
            className="group px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-sm text-black rounded shadow-xl flex items-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Create List</span>
            <span className="px-1.5 py-0.5 bg-black/20 rounded text-xs">{selectedProducts.length}</span>
          </button>
        )}
      </div>

      {/* Mobile Control Buttons */}
      <div className="md:hidden fixed bottom-6 right-6 flex flex-col gap-2 z-40">
        {lists.length > 0 && (
          <button
            onClick={() => setIsManaging(true)}
            className="w-14 h-14 bg-neutral-800/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-95"
          >
            <div className="relative">
              <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white/[0.15] text-neutral-300 text-[10px] font-bold rounded-full flex items-center justify-center border border-white/[0.1]">
                {lists.length}
              </span>
            </div>
          </button>
        )}
        
        {selectedProducts.length > 0 && (
          <button
            onClick={() => setIsCreatingList(true)}
            className="w-14 h-14 bg-white/90 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-95"
          >
            <div className="relative">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-black/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {selectedProducts.length}
              </span>
            </div>
          </button>
        )}
      </div>
    </>
  );
}

