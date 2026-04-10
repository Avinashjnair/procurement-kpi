'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  items as initialItems,
  suppliers as initialSuppliers,
  purchaseOrders as initialPOs,
  documents as initialDocs,
  Item,
  Supplier,
  PurchaseOrder,
  Document,
  POStatus,
  PaymentStatus,
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
  modalOpen: string | null; // 'newPO' | 'newItem' | 'newSupplier' | 'uploadDoc' | null
}

interface AppContextType extends AppState {
  setActivePage: (page: string) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setSelectedPOId: (id: string | null) => void;
  setFabOpen: (open: boolean) => void;
  setModalOpen: (modal: string | null) => void;
  addItem: (item: Item) => void;
  addSupplier: (supplier: Supplier) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  addDocument: (doc: Document) => void;
  updatePOStatus: (poId: string, status: POStatus) => void;
  updatePOPayment: (poId: string, paymentStatus: PaymentStatus, amountPaid: number) => void;
  getSupplierById: (id: string) => Supplier | undefined;
  getItemById: (id: string) => Item | undefined;
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
  });

  const setActivePage = useCallback((page: string) => {
    setState(prev => ({ ...prev, activePage: page, selectedItemId: null, selectedSupplierId: null, selectedPOId: null }));
  }, []);

  const setSelectedItemId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedItemId: id }));
  }, []);

  const setSelectedSupplierId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedSupplierId: id }));
  }, []);

  const setSelectedPOId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedPOId: id }));
  }, []);

  const setFabOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, fabOpen: open }));
  }, []);

  const setModalOpen = useCallback((modal: string | null) => {
    setState(prev => ({ ...prev, modalOpen: modal, fabOpen: false }));
  }, []);

  const addItem = useCallback((item: Item) => {
    setState(prev => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const addSupplier = useCallback((supplier: Supplier) => {
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, supplier] }));
  }, []);

  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setState(prev => ({ ...prev, purchaseOrders: [po, ...prev.purchaseOrders] }));
  }, []);

  const addDocument = useCallback((doc: Document) => {
    setState(prev => ({ ...prev, documents: [...prev.documents, doc] }));
  }, []);

  const updatePOStatus = useCallback((poId: string, status: POStatus) => {
    setState(prev => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map(po =>
        po.id === poId ? { ...po, deliveryStatus: status } : po
      ),
    }));
  }, []);

  const updatePOPayment = useCallback((poId: string, paymentStatus: PaymentStatus, amountPaid: number) => {
    setState(prev => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map(po =>
        po.id === poId ? { ...po, paymentStatus, amountPaid } : po
      ),
    }));
  }, []);

  const getSupplierById = useCallback((id: string) => {
    return state.suppliers.find(s => s.id === id);
  }, [state.suppliers]);

  const getItemById = useCallback((id: string) => {
    return state.items.find(i => i.id === id);
  }, [state.items]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setActivePage,
        setSelectedItemId,
        setSelectedSupplierId,
        setSelectedPOId,
        setFabOpen,
        setModalOpen,
        addItem,
        addSupplier,
        addPurchaseOrder,
        addDocument,
        updatePOStatus,
        updatePOPayment,
        getSupplierById,
        getItemById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
