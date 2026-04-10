'use client';
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Package, FileText, Upload } from 'lucide-react';

export default function FAB() {
  const { fabOpen, setFabOpen, setModalOpen } = useApp();

  return (
    <div className="fab-container">
      <div className={`fab-menu ${fabOpen ? 'visible' : ''}`}>
        <button
          className="fab-menu-item"
          onClick={() => setModalOpen('newPO')}
        >
          <FileText /> Create New PO
        </button>
        <button
          className="fab-menu-item"
          onClick={() => setModalOpen('newItem')}
        >
          <Package /> Add New Item
        </button>
        <button
          className="fab-menu-item"
          onClick={() => setModalOpen('uploadDoc')}
        >
          <Upload /> Upload Document
        </button>
      </div>
      <button
        className={`fab-button ${fabOpen ? 'open' : ''}`}
        onClick={() => setFabOpen(!fabOpen)}
        aria-label="Quick actions"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
