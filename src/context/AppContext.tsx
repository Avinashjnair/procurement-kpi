'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
// Existing data
import {
  items as initialItems, suppliers as initialSuppliers,
  purchaseOrders as initialPOs, documents as initialDocs,
  Item, Supplier, SupplierKPIs, PurchaseOrder, Document,
  POStatus, PaymentStatus, PricePoint,
} from '@/data/mockData';
// New data
import {
  users as initialUsers, rfqs as initialRFQs, quotations as initialQuotations,
  stockItems as initialStock, stockMovements as initialMovements, grns as initialGRNs,
} from '@/data/extendedMockData';
// New types
import type {
  User, RFQ, Quotation, QuotationEvaluation, StockItem, StockMovement, GRN, GRNLineItem,
} from '@/types';
import { calcEvalScore } from '@/types';

interface AppState {
  // existing
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
  // new
  currentUser: User | null;
  users: User[];
  rfqs: RFQ[];
  quotations: Quotation[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  grns: GRN[];
  selectedRFQId: string | null;
  selectedGRNId: string | null;
}

interface AppContextType extends AppState {
  // navigation
  setActivePage: (page: string) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setSelectedPOId: (id: string | null) => void;
  setSelectedRFQId: (id: string | null) => void;
  setSelectedGRNId: (id: string | null) => void;
  setFabOpen: (open: boolean) => void;
  setModalOpen: (modal: string | null) => void;
  toggleDarkMode: () => void;
  // auth
  login: (email: string, password: string) => boolean;
  logout: () => void;
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
  approvePO: (poId: string) => void;
  rejectPO: (poId: string, reason: string) => void;
  cancelPO: (poId: string, reason: string) => void;
  duplicatePO: (poId: string) => void;
  // documents
  addDocument: (doc: Document) => void;
  uploadNewDocVersion: (originalId: string, newDoc: Document) => void;
  // RFQ
  addRFQ: (rfq: RFQ) => void;
  updateRFQ: (id: string, updates: Partial<RFQ>) => void;
  sendRFQ: (id: string) => void;
  closeRFQ: (id: string) => void;
  awardRFQ: (rfqId: string, quotationId: string) => void;
  // Quotations
  addQuotation: (q: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  submitEvaluation: (quotationId: string, evaluation: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>) => void;
  // GRN
  addGRN: (grn: GRN) => void;
  submitGRN: (id: string) => void;
  approveGRN: (id: string) => void;
  rejectGRN: (id: string, reason: string) => void;
  // Inventory
  adjustStock: (stockItemId: string, delta: number, reason: string) => void;
  // lookups
  getSupplierById: (id: string) => Supplier | undefined;
  getItemById: (id: string) => Item | undefined;
  getPOById: (id: string) => PurchaseOrder | undefined;
  getRFQById: (id: string) => RFQ | undefined;
  getStockByItemId: (itemId: string) => StockItem | undefined;
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
    currentUser: null,
    users: initialUsers,
    rfqs: initialRFQs,
    quotations: initialQuotations,
    stockItems: initialStock,
    stockMovements: initialMovements,
    grns: initialGRNs,
    selectedRFQId: null,
    selectedGRNId: null,
  });

  // ── Navigation ──
  const setActivePage        = useCallback((page: string) => setState(p => ({ ...p, activePage: page, selectedItemId: null, selectedSupplierId: null, selectedPOId: null, selectedRFQId: null, selectedGRNId: null })), []);
  const setSelectedItemId    = useCallback((id: string | null) => setState(p => ({ ...p, selectedItemId: id })), []);
  const setSelectedSupplierId= useCallback((id: string | null) => setState(p => ({ ...p, selectedSupplierId: id })), []);
  const setSelectedPOId      = useCallback((id: string | null) => setState(p => ({ ...p, selectedPOId: id })), []);
  const setSelectedRFQId     = useCallback((id: string | null) => setState(p => ({ ...p, selectedRFQId: id })), []);
  const setSelectedGRNId     = useCallback((id: string | null) => setState(p => ({ ...p, selectedGRNId: id })), []);
  const setFabOpen           = useCallback((open: boolean) => setState(p => ({ ...p, fabOpen: open })), []);
  const setModalOpen         = useCallback((modal: string | null) => setState(p => ({ ...p, modalOpen: modal, fabOpen: false })), []);
  const toggleDarkMode       = useCallback(() => setState(p => ({ ...p, darkMode: !p.darkMode })), []);

  // ── Auth ──
  const login = useCallback((email: string, password: string): boolean => {
    const user = state.users.find(u => u.email === email && u.passwordHash === password && u.active);
    if (user) { setState(p => ({ ...p, currentUser: user })); return true; }
    return false;
  }, [state.users]);

  const logout = useCallback(() => setState(p => ({ ...p, currentUser: null, activePage: 'dashboard' })), []);

  // ── Items ──
  const addItem            = useCallback((item: Item) => setState(p => ({ ...p, items: [...p.items, item] })), []);
  const updateItem         = useCallback((id: string, updates: Partial<Item>) => setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, ...updates } : i) })), []);
  const archiveItem        = useCallback((id: string) => setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, archived: true } : i) })), []);
  const unarchiveItem      = useCallback((id: string) => setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, archived: false } : i) })), []);
  const addItemPriceHistory= useCallback((itemId: string, point: PricePoint) =>
    setState(p => ({ ...p, items: p.items.map(i => i.id === itemId ? { ...i, priceHistory: [...i.priceHistory, point], currentPrice: point.price } : i) })), []);

  // ── Suppliers ──
  const addSupplier           = useCallback((supplier: Supplier) => setState(p => ({ ...p, suppliers: [...p.suppliers, supplier] })), []);
  const updateSupplier        = useCallback((id: string, updates: Partial<Supplier>) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, ...updates } : s) })), []);
  const updateSupplierKPIs    = useCallback((id: string, kpis: SupplierKPIs) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, kpis } : s) })), []);
  const togglePreferredSupplier = useCallback((id: string) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, preferred: !s.preferred } : s) })), []);
  const addSupplierNote = useCallback((supplierId: string, note: string) => {
    const newNote = { id: `NOTE-${Date.now()}`, text: note, date: new Date().toISOString().split('T')[0], author: state.currentUser?.name || 'Procurement Team' };
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === supplierId ? { ...s, notes: [...(s.notes || []), newNote] } : s) }));
  }, [state.currentUser]);

  // ── Purchase Orders ──
  const addPurchaseOrder  = useCallback((po: PurchaseOrder) => setState(p => ({ ...p, purchaseOrders: [po, ...p.purchaseOrders] })), []);
  const updatePOStatus    = useCallback((poId: string, status: POStatus) => setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: status } : po) })), []);
  const updatePOPayment   = useCallback((poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, paymentStatus, amountPaid, dateOfPayment: dateOfPayment || po.dateOfPayment } : po) })), []);

  const approvePO = useCallback((poId: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: 'Approved' as POStatus, approvedBy: p.currentUser?.name, approvedAt: new Date().toISOString().split('T')[0] } : po) })), []);

  const rejectPO = useCallback((poId: string, reason: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: 'Cancelled' as POStatus, cancellationReason: `REJECTED: ${reason}` } : po) })), []);

  const cancelPO = useCallback((poId: string, reason: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: 'Cancelled' as POStatus, cancellationReason: reason } : po) })), []);

  const duplicatePO = useCallback((poId: string) => {
    setState(p => {
      const original = p.purchaseOrders.find(po => po.id === poId);
      if (!original) return p;
      const newId = `PO-${String(p.purchaseOrders.length + 1).padStart(3, '0')}`;
      return { ...p, purchaseOrders: [{ ...original, id: newId, dateOfIssue: new Date().toISOString().split('T')[0], deliveryStatus: 'Draft' as POStatus, paymentStatus: 'Unpaid' as PaymentStatus, amountPaid: 0, dateOfPayment: null }, ...p.purchaseOrders] };
    });
  }, []);

  // ── Documents ──
  const addDocument = useCallback((doc: Document) => setState(p => ({ ...p, documents: [...p.documents, doc] })), []);
  const uploadNewDocVersion = useCallback((originalId: string, newDoc: Document) =>
    setState(p => ({ ...p, documents: [...p.documents.map(d => d.id === originalId ? { ...d, supersededBy: newDoc.id } : d), newDoc] })), []);

  // ── RFQ ──
  const addRFQ = useCallback((rfq: RFQ) => setState(p => ({ ...p, rfqs: [rfq, ...p.rfqs] })), []);
  const updateRFQ = useCallback((id: string, updates: Partial<RFQ>) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, ...updates } : r) })), []);
  const sendRFQ = useCallback((id: string) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, status: 'Sent', dateSent: new Date().toISOString().split('T')[0] } : r) })), []);
  const closeRFQ = useCallback((id: string) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, status: 'Closed' } : r) })), []);
  const awardRFQ = useCallback((rfqId: string, quotationId: string) => {
    setState(p => {
      const quotation = p.quotations.find(q => q.id === quotationId);
      if (!quotation) return p;
      return {
        ...p,
        rfqs: p.rfqs.map(r => r.id === rfqId ? { ...r, status: 'Awarded', awardedQuotationId: quotationId, awardedSupplierId: quotation.supplierId, awardedSupplierName: quotation.supplierName } : r),
        quotations: p.quotations.map(q => {
          if (q.rfqId !== rfqId) return q;
          return q.id === quotationId ? { ...q, status: 'Awarded' } : { ...q, status: 'Rejected' };
        }),
      };
    });
  }, []);

  // ── Quotations ──
  const addQuotation    = useCallback((q: Quotation) => setState(p => ({ ...p, quotations: [...p.quotations, q] })), []);
  const updateQuotation = useCallback((id: string, updates: Partial<Quotation>) => setState(p => ({ ...p, quotations: p.quotations.map(q => q.id === id ? { ...q, ...updates } : q) })), []);

  const submitEvaluation = useCallback((quotationId: string, evalData: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>) => {
    setState(p => {
      const totalScore = calcEvalScore(evalData);
      const fullEval: QuotationEvaluation = {
        ...evalData, totalScore,
        evaluatedBy: p.currentUser?.id || 'USR-001',
        evaluatedAt: new Date().toISOString().split('T')[0],
      };
      return {
        ...p,
        quotations: p.quotations.map(q => q.id === quotationId ? { ...q, evaluation: fullEval, status: 'Evaluated' } : q),
      };
    });
  }, []);

  // ── GRN ──
  const addGRN     = useCallback((grn: GRN) => setState(p => ({ ...p, grns: [grn, ...p.grns] })), []);
  const submitGRN  = useCallback((id: string) => setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? { ...g, status: 'Submitted' } : g) })), []);

  const approveGRN = useCallback((id: string) => {
    setState(p => {
      const grn = p.grns.find(g => g.id === id);
      if (!grn || grn.stockUpdated) return p;

      // Update stock for each accepted line item
      let updatedStock = [...p.stockItems];
      const newMovements: StockMovement[] = [];
      const today = new Date().toISOString().split('T')[0];

      grn.lineItems.forEach(line => {
        const stockIdx = updatedStock.findIndex(s => s.itemId === line.itemId);
        if (stockIdx >= 0) {
          const newBalance = updatedStock[stockIdx].currentStock + line.acceptedQty;
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], currentStock: newBalance, lastUpdated: today, lastGRNId: id };
          newMovements.push({
            id: `MOV-${Date.now()}-${line.itemId}`,
            stockItemId: updatedStock[stockIdx].id,
            itemId: line.itemId,
            itemName: line.itemName,
            movementType: 'GRN',
            quantity: line.acceptedQty,
            referenceId: id,
            date: today,
            performedBy: p.currentUser?.id || 'USR-001',
            balanceAfter: newBalance,
            notes: `GRN ${id} approved`,
          });
        } else if (line.acceptedQty > 0) {
          // Create new stock entry if item not yet in inventory
          const item = p.items.find(i => i.id === line.itemId);
          const newStockId = `STK-${String(p.stockItems.length + 1).padStart(3, '0')}`;
          updatedStock.push({
            id: newStockId,
            itemId: line.itemId,
            itemName: line.itemName,
            category: item?.category || 'General',
            unit: item?.unit || 'piece',
            currentStock: line.acceptedQty,
            reservedStock: 0,
            reorderPoint: 0,
            maxStock: line.acceptedQty * 3,
            location: 'WH-A',
            lastUpdated: today,
            lastGRNId: id,
          });
          newMovements.push({
            id: `MOV-${Date.now()}-${line.itemId}`,
            stockItemId: newStockId,
            itemId: line.itemId,
            itemName: line.itemName,
            movementType: 'GRN',
            quantity: line.acceptedQty,
            referenceId: id,
            date: today,
            performedBy: p.currentUser?.id || 'USR-001',
            balanceAfter: line.acceptedQty,
            notes: `Initial stock from GRN ${id}`,
          });
        }
      });

      // Also update PO to Delivered if all lines fully received
      const po = p.purchaseOrders.find(po => po.id === grn.poId);
      const updatedPOs = po
        ? p.purchaseOrders.map(po =>
            po.id === grn.poId ? { ...po, deliveryStatus: 'Delivered' as POStatus } : po
          )
        : p.purchaseOrders;

      return {
        ...p,
        grns: p.grns.map(g => g.id === id ? { ...g, status: 'Approved', dateApproved: today, approvedBy: p.currentUser?.id || 'USR-001', stockUpdated: true } : g),
        stockItems: updatedStock,
        stockMovements: [...p.stockMovements, ...newMovements],
        purchaseOrders: updatedPOs,
      };
    });
  }, []);

  const rejectGRN = useCallback((id: string, reason: string) =>
    setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? { ...g, status: 'Rejected', notes: (g.notes ? g.notes + ' | ' : '') + `Rejection: ${reason}` } : g) })), []);

  // ── Inventory ──
  const adjustStock = useCallback((stockItemId: string, delta: number, reason: string) => {
    setState(p => {
      const today = new Date().toISOString().split('T')[0];
      const idx = p.stockItems.findIndex(s => s.id === stockItemId);
      if (idx < 0) return p;
      const newBalance = Math.max(0, p.stockItems[idx].currentStock + delta);
      const updatedStock = [...p.stockItems];
      updatedStock[idx] = { ...updatedStock[idx], currentStock: newBalance, lastUpdated: today };
      const movement: StockMovement = {
        id: `MOV-${Date.now()}`,
        stockItemId,
        itemId: updatedStock[idx].itemId,
        itemName: updatedStock[idx].itemName,
        movementType: 'Adjustment',
        quantity: delta,
        referenceId: `ADJ-${Date.now()}`,
        date: today,
        performedBy: p.currentUser?.id || 'USR-001',
        balanceAfter: newBalance,
        notes: reason,
      };
      return { ...p, stockItems: updatedStock, stockMovements: [...p.stockMovements, movement] };
    });
  }, []);

  // ── Lookups ──
  const getSupplierById  = useCallback((id: string) => state.suppliers.find(s => s.id === id), [state.suppliers]);
  const getItemById      = useCallback((id: string) => state.items.find(i => i.id === id), [state.items]);
  const getPOById        = useCallback((id: string) => state.purchaseOrders.find(po => po.id === id), [state.purchaseOrders]);
  const getRFQById       = useCallback((id: string) => state.rfqs.find(r => r.id === id), [state.rfqs]);
  const getStockByItemId = useCallback((itemId: string) => state.stockItems.find(s => s.itemId === itemId), [state.stockItems]);

  return (
    <AppContext.Provider value={{
      ...state,
      setActivePage, setSelectedItemId, setSelectedSupplierId, setSelectedPOId,
      setSelectedRFQId, setSelectedGRNId, setFabOpen, setModalOpen, toggleDarkMode,
      login, logout,
      addItem, updateItem, archiveItem, unarchiveItem, addItemPriceHistory,
      addSupplier, updateSupplier, updateSupplierKPIs, togglePreferredSupplier, addSupplierNote,
      addPurchaseOrder, updatePOStatus, updatePOPayment, approvePO, rejectPO, cancelPO, duplicatePO,
      addDocument, uploadNewDocVersion,
      addRFQ, updateRFQ, sendRFQ, closeRFQ, awardRFQ,
      addQuotation, updateQuotation, submitEvaluation,
      addGRN, submitGRN, approveGRN, rejectGRN,
      adjustStock,
      getSupplierById, getItemById, getPOById, getRFQById, getStockByItemId,
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
