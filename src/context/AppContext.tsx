'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  items as initialItems,
  suppliers as initialSuppliers,
  purchaseOrders as initialPOs,
  documents as initialDocs,
  Item, Supplier, SupplierKPIs, PurchaseOrder, Document,
  POStatus, PaymentStatus, PricePoint,
} from '@/data/mockData';

interface AppState {
  items: Item[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  documents: Document[];
  activePage: string;
  selectedItemId: string | null;
  selectedSupplierId: string | null;
  selectedPOId: string | null;
  fabOpen: boolean;
  modalOpen: string | null;
  darkMode: boolean;
}

interface AppContextType extends AppState {
  // navigation
  setActivePage: (page: string) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setSelectedPOId: (id: string | null) => void;
  setFabOpen: (open: boolean) => void;
  setModalOpen: (modal: string | null) => void;
  toggleDarkMode: () => void;
  // items
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;
  addItemPriceHistory: (itemId: string, point: PricePoint) => void;
  // suppliers
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  updateSupplierKPIs: (id: string, kpis: SupplierKPIs) => void;
  togglePreferredSupplier: (id: string) => void;
  addSupplierNote: (supplierId: string, note: string) => void;
  // purchase orders
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePOStatus: (poId: string, status: POStatus) => void;
  updatePOPayment: (poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) => void;
  cancelPO: (poId: string, reason: string) => void;
  duplicatePO: (poId: string) => void;
  // documents
  addDocument: (doc: Document) => void;
  uploadNewDocVersion: (originalId: string, newDoc: Document) => void;
  // lookups
  getSupplierById: (id: string) => Supplier | undefined;
  getItemById: (id: string) => Item | undefined;
  getPOById: (id: string) => PurchaseOrder | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    items: initialItems,
    suppliers: initialSuppliers,
    purchaseOrders: initialPOs,
    documents: initialDocs,
    activePage: 'dashboard',
    selectedItemId: null,
    selectedSupplierId: null,
    selectedPOId: null,
    fabOpen: false,
    modalOpen: null,
    darkMode: true,
  });

  // ── Navigation ──
  const setActivePage       = useCallback((page: string) => setState(p => ({ ...p, activePage: page, selectedItemId: null, selectedSupplierId: null, selectedPOId: null })), []);
  const setSelectedItemId   = useCallback((id: string | null) => setState(p => ({ ...p, selectedItemId: id })), []);
  const setSelectedSupplierId = useCallback((id: string | null) => setState(p => ({ ...p, selectedSupplierId: id })), []);
  const setSelectedPOId     = useCallback((id: string | null) => setState(p => ({ ...p, selectedPOId: id })), []);
  const setFabOpen          = useCallback((open: boolean) => setState(p => ({ ...p, fabOpen: open })), []);
  const setModalOpen        = useCallback((modal: string | null) => setState(p => ({ ...p, modalOpen: modal, fabOpen: false })), []);
  const toggleDarkMode      = useCallback(() => setState(p => ({ ...p, darkMode: !p.darkMode })), []);

  // ── Items ──
  const addItem = useCallback((item: Item) =>
    setState(p => ({ ...p, items: [...p.items, item] })), []);

  const updateItem = useCallback((id: string, updates: Partial<Item>) =>
    setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, ...updates } : i) })), []);

  const archiveItem = useCallback((id: string) =>
    setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, archived: true } : i) })), []);

  const unarchiveItem = useCallback((id: string) =>
    setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, archived: false } : i) })), []);

  const addItemPriceHistory = useCallback((itemId: string, point: PricePoint) =>
    setState(p => ({
      ...p,
      items: p.items.map(i =>
        i.id === itemId ? { ...i, priceHistory: [...i.priceHistory, point], currentPrice: point.price } : i
      ),
    })), []);

  // ── Suppliers ──
  const addSupplier         = useCallback((supplier: Supplier) => setState(p => ({ ...p, suppliers: [...p.suppliers, supplier] })), []);
  const updateSupplier      = useCallback((id: string, updates: Partial<Supplier>) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, ...updates } : s) })), []);
  const updateSupplierKPIs  = useCallback((id: string, kpis: SupplierKPIs) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, kpis } : s) })), []);
  const togglePreferredSupplier = useCallback((id: string) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, preferred: !s.preferred } : s) })), []);
  const addSupplierNote = useCallback((supplierId: string, note: string) => {
    const newNote = { id: `NOTE-${Date.now()}`, text: note, date: new Date().toISOString().split('T')[0], author: 'Procurement Team' };
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === supplierId ? { ...s, notes: [...(s.notes || []), newNote] } : s) }));
  }, []);

  // ── Purchase Orders ──
  const addPurchaseOrder = useCallback((po: PurchaseOrder) =>
    setState(p => ({ ...p, purchaseOrders: [po, ...p.purchaseOrders] })), []);

  const updatePOStatus = useCallback((poId: string, status: POStatus) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: status } : po) })), []);

  const updatePOPayment = useCallback((poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) =>
    setState(p => ({
      ...p,
      purchaseOrders: p.purchaseOrders.map(po =>
        po.id === poId ? { ...po, paymentStatus, amountPaid, dateOfPayment: dateOfPayment || po.dateOfPayment } : po
      ),
    })), []);

  const cancelPO = useCallback((poId: string, reason: string) =>
    setState(p => ({
      ...p,
      purchaseOrders: p.purchaseOrders.map(po =>
        po.id === poId ? { ...po, deliveryStatus: 'Cancelled', cancellationReason: reason } : po
      ),
    })), []);

  const duplicatePO = useCallback((poId: string) => {
    setState(p => {
      const original = p.purchaseOrders.find(po => po.id === poId);
      if (!original) return p;
      const newId = `PO-${String(p.purchaseOrders.length + 1).padStart(3, '0')}`;
      const duplicate: PurchaseOrder = {
        ...original,
        id: newId,
        dateOfIssue: new Date().toISOString().split('T')[0],
        deliveryStatus: 'Draft',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        dateOfPayment: null,
      };
      return { ...p, purchaseOrders: [duplicate, ...p.purchaseOrders] };
    });
  }, []);

  // ── Documents ──
  const addDocument = useCallback((doc: Document) =>
    setState(p => ({ ...p, documents: [...p.documents, doc] })), []);

  const uploadNewDocVersion = useCallback((originalId: string, newDoc: Document) => {
    setState(p => ({
      ...p,
      documents: [
        ...p.documents.map(d => d.id === originalId ? { ...d, supersededBy: newDoc.id } : d),
        newDoc,
      ],
    }));
  }, []);

  // ── Lookups ──
  const getSupplierById = useCallback((id: string) => state.suppliers.find(s => s.id === id), [state.suppliers]);
  const getItemById     = useCallback((id: string) => state.items.find(i => i.id === id),     [state.items]);
  const getPOById       = useCallback((id: string) => state.purchaseOrders.find(po => po.id === id), [state.purchaseOrders]);

  return (
    <AppContext.Provider value={{
      ...state,
      setActivePage, setSelectedItemId, setSelectedSupplierId, setSelectedPOId,
      setFabOpen, setModalOpen, toggleDarkMode,
      addItem, updateItem, archiveItem, unarchiveItem, addItemPriceHistory,
      addSupplier, updateSupplier, updateSupplierKPIs, togglePreferredSupplier, addSupplierNote,
      addPurchaseOrder, updatePOStatus, updatePOPayment, cancelPO, duplicatePO,
      addDocument, uploadNewDocVersion,
      getSupplierById, getItemById, getPOById,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
