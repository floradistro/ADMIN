'use client';

import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { ProductList } from '../../types/lists';
import { Button } from '../ui/Button';

interface EmailListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  list: ProductList | null;
  onSend: (recipients: string[], subject: string, message: string) => Promise<void>;
}

export function EmailListDialog({
  isOpen,
  onClose,
  list,
  onSend
}: EmailListDialogProps) {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState(list ? `Product List: ${list.name}` : '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!recipients.trim()) {
      setError('Please enter at least one recipient email');
      return;
    }

    const emailList = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emailList.length === 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onSend(emailList, subject, message);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setRecipients('');
    setSubject(list ? `Product List: ${list.name}` : '');
    setMessage('');
    setError(null);
    onClose();
  };

  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-lg shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/[0.08] rounded">
              <Mail className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <h2 className="text-base font-medium text-white">Email List</h2>
              <p className="text-xs text-neutral-500 mt-0.5">{list.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500 hover:text-neutral-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              Recipients *
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            />
            <p className="text-[10px] text-neutral-600 mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              className="w-full px-3 py-2 bg-transparent border border-white/[0.08] rounded text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white/20 resize-none transition-colors"
            />
          </div>

          <div className="p-3 border border-white/[0.08] rounded">
            <p className="text-xs text-neutral-500">
              Will include a formatted table with all {list.products.length} products from your list.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-white/[0.08]">
          <button
            onClick={handleClose}
            disabled={sending}
            className="px-4 py-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !recipients.trim()}
            className="px-4 py-1.5 text-sm bg-white/90 hover:bg-white disabled:bg-white/30 disabled:cursor-not-allowed text-black rounded transition-colors font-medium"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

