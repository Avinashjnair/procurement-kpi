'use client';
import React from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { DocumentCategory } from '@/types';
import { formatFileSize } from '@/utils/formatFileSize';

export interface AttachmentDraft {
  id: string;
  category: DocumentCategory;
  file: File | null;
}

let attachmentSeq = 0;
export function newAttachmentId() {
  attachmentSeq += 1;
  return `att-${Date.now()}-${attachmentSeq}`;
}

// Reusable "attach commercial & shipping documents" editor — used when recording a GRN or an Invoice.
// No file storage backend exists in this app, so this captures the real selected file's name/size
// (not fabricated) but only the metadata is persisted, same as every other upload in the app.
export default function DocumentAttachmentsEditor({
  attachments, categories, onChange, label = 'Attach Documents',
}: {
  attachments: AttachmentDraft[];
  categories: DocumentCategory[];
  onChange: (next: AttachmentDraft[]) => void;
  label?: string;
}) {
  const addRow = () => onChange([...attachments, { id: newAttachmentId(), category: categories[0], file: null }]);
  const removeRow = (id: string) => onChange(attachments.filter(a => a.id !== id));
  const updateRow = (id: string, patch: Partial<AttachmentDraft>) =>
    onChange(attachments.map(a => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}><Plus size={13} /> Add Document</button>
      </div>

      {attachments.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>
          No documents attached yet — e.g. commercial invoice, packing list, BL/AWB.
        </div>
      )}

      {attachments.map(a => (
        <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <select className="form-select" value={a.category} onChange={e => updateRow(a.id, { category: e.target.value as DocumentCategory })}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'rgba(99,102,241,0.04)', border: '1px dashed var(--border-color)',
              borderRadius: 8, cursor: 'pointer', fontSize: 12,
            }}>
              <Upload size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ color: a.file ? 'var(--text-primary, #f1f5f9)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.file ? `${a.file.name} (${formatFileSize(a.file.size)})` : 'Choose file…'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                onChange={e => updateRow(a.id, { file: e.target.files?.[0] || null })}
              />
            </label>
          </div>

          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(a.id)} title="Remove"><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}
