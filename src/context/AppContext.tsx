'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  items as initialItems, suppliers as initialSuppliers,
  purchaseOrders as initialPOs, documents as initialDocs,
  Item, Supplier, SupplierKPIs, PurchaseOrder, AppDocument,
  POStatus, PaymentStatus, PricePoint,
} from '@/data/mockData';
import {
  users as initialUsers, rfqs as initialRFQs, quotations as initialQuotations,
  stockItems as initialStock, stockMovements as initialMovements, grns as initialGRNs,
  assets as initialAssets, assetCategories as initialCategories,
} from '@/data/extendedMockData';
import {
  initialBudgets, initialContracts, initialInvoices, initialBlankets,
  initialComplianceDocs, initialDisputes
} from '@/data/roadmapMockData';
import type {
  User, RFQ, Quotation, QuotationEvaluation, StockItem, StockMovement, GRN, GRNLineItem,
  Asset, MaintenanceRecord, AssetStatus, PaymentRecord, PaymentRecordStatus,
  BudgetEnvelope, Contract, Invoice, AuditLogEntry, MatchStatus, ApprovalStep, BlanketPO,
  AppNotification, NotificationRule, NegotiationMessage, POAmendmentRequest,
  ComplianceDocument, GRNDispute, POMessage, ProductLibraryItem,
} from '@/types';
import { calcEvalScore } from '@/types';

interface AppState {
  items: Item[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  documents: AppDocument[];
  activePage: string;
  selectedItemId: string | null;
  selectedSupplierId: string | null;
  selectedPOId: string | null;
  fabOpen: boolean;
  modalOpen: string | null;
  darkMode: boolean;
  currentUser: User | null;
  users: User[];
  rfqs: RFQ[];
  quotations: Quotation[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  grns: GRN[];
  selectedRFQId: string | null;
  selectedGRNId: string | null;
  assets: Asset[];
  assetCategories: string[];
  selectedAssetId: string | null;
  // Next Sprint extensions
  budgets: BudgetEnvelope[];
  contracts: Contract[];
  invoices: Invoice[];
  auditLogs: AuditLogEntry[];
  fxRates: Record<string, number>;
  blanketPOs: BlanketPO[];
  selectedBlanketId: string | null;
  notifications: AppNotification[];
  notificationRules: NotificationRule[];
  isSupplierPortal: boolean;
  selectedQuotationId: string | null;
  negotiationMessages: NegotiationMessage[];
  complianceDocs: ComplianceDocument[];
  disputes: GRNDispute[];
  poMessages: POMessage[];
  currentSupplier: Supplier | null;
  products: ProductLibraryItem[];
}

interface AppContextType extends AppState {
  setActivePage: (page: string) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setSelectedPOId: (id: string | null) => void;
  setSelectedRFQId: (id: string | null) => void;
  setSelectedGRNId: (id: string | null) => void;
  setSelectedAssetId: (id: string | null) => void;
  setSelectedBlanketId: (id: string | null) => void;
  setFabOpen: (open: boolean) => void;
  setModalOpen: (modal: string | null) => void;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;
  addItemPriceHistory: (itemId: string, point: PricePoint) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  updateSupplierKPIs: (id: string, kpis: SupplierKPIs) => void;
  togglePreferredSupplier: (id: string) => void;
  addSupplierNote: (supplierId: string, note: string) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePOStatus: (poId: string, status: POStatus) => void;
  updatePOPayment: (poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) => void;
  approvePO: (poId: string) => void;
  rejectPO: (poId: string, reason: string) => void;
  cancelPO: (poId: string, reason: string) => void;
  duplicatePO: (poId: string) => void;
  // ── Finance actions ──────────────────────────────────────
  recordPayment: (record: Omit<PaymentRecord, 'id'>) => void;
  approvePaymentRecord: (poId: string, recordId: string, status: PaymentRecordStatus) => void;
  // ── Documents ──────────────────────────────────────────
  addDocument: (doc: AppDocument) => void;
  uploadNewDocVersion: (originalId: string, newDoc: AppDocument) => void;
  addRFQ: (rfq: RFQ) => void;
  updateRFQ: (id: string, updates: Partial<RFQ>) => void;
  sendRFQ: (id: string) => void;
  closeRFQ: (id: string) => void;
  publishRFQ: (id: string) => void;
  awardRFQ: (rfqId: string, quotationId: string) => void;
  addQuotation: (q: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  submitEvaluation: (quotationId: string, evaluation: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>) => void;
  addGRN: (grn: GRN) => void;
  submitGRN: (id: string) => void;
  approveGRN: (id: string) => void;
  rejectGRN: (id: string, reason: string) => void;
  adjustStock: (stockItemId: string, delta: number, reason: string) => void;
  addAsset: (asset: Asset) => void;
  updateAssetStatus: (id: string, status: AssetStatus) => void;
  addAssetCategory: (category: string) => void;
  logMaintenance: (assetId: string, record: Omit<MaintenanceRecord, 'id'>) => void;
  calculateCurrentAssetValue: (asset: Asset) => number;
  getSupplierById: (id: string) => Supplier | undefined;
  getItemById: (id: string) => Item | undefined;
  getPOById: (id: string) => PurchaseOrder | undefined;
  getRFQById: (id: string) => RFQ | undefined;
  getStockByItemId: (itemId: string) => StockItem | undefined;
  // ── Roadmap Extensions ───────────────────────────────────
  addBudget: (b: BudgetEnvelope) => void;
  updateBudget: (id: string, updates: Partial<BudgetEnvelope>) => void;
  addContract: (c: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  addInvoice: (i: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  logAudit: (log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => void;
  processApprovalStep: (poId: string, stepIndex: number, status: 'Approved' | 'Rejected', comments?: string) => void;
  performMatch: (poId: string) => MatchStatus;
  // ── Blanket POs ──────────────────────────────────────────
  addBlanket: (b: BlanketPO) => void;
  updateBlanket: (id: string, updates: Partial<BlanketPO>) => void;
  // ── Notifications ────────────────────────────────────────
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleNotificationRule: (id: string) => void;
  setSelectedQuotationId: (id: string | null) => void;
  setSupplierPortal: (val: boolean) => void;
  addNegotiationMessage: (msg: Omit<NegotiationMessage, 'id' | 'timestamp'>) => void;
  updateQuotationFeedback: (id: string, feedback: string) => void;
  acknowledgePO: (poId: string) => void;
  updateShipment: (poId: string, tracking: string, carrier: string) => void;
  requestAmendment: (poId: string, request: Omit<POAmendmentRequest, 'id' | 'timestamp' | 'status'>) => void;
  updateDeliveredQty: (poId: string, itemId: string, qty: number) => void;
  submitInvoice: (data: Omit<Invoice, 'id' | 'matchStatus' | 'status'>) => void;
  disputeGRN: (data: Omit<GRNDispute, 'id' | 'timestamp' | 'status'>) => void;
  uploadComplianceDoc: (data: Omit<ComplianceDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  poMessages: POMessage[];
  sendPOMessage: (msg: Omit<POMessage, 'id' | 'timestamp'>) => void;
  updateSupplierProfile: (id: string, updates: Partial<Supplier>) => void;
  requestEarlyPayment: (invoiceId: string, discountPct: number) => void;
  addSupplierContact: (supplierId: string, contact: { name: string; role: string; email: string }) => void;
  supplierLogin: (supplierId: string, passwordHash: string) => boolean;
  supplierLogout: () => void;
  addProduct: (product: Omit<ProductLibraryItem, 'id'>) => void;
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
    assets: initialAssets,
    assetCategories: initialCategories,
    selectedAssetId: null,
    // Next Sprint extensions
    budgets: initialBudgets,
    contracts: initialContracts,
    invoices: initialInvoices,
    auditLogs: [],
    fxRates: { 'USD': 3.67, 'EUR': 4.01, 'GBP': 4.65, 'AED': 1.0 },
    blanketPOs: initialBlankets,
    selectedBlanketId: null,
    notifications: [
      { id: 'NOTIF-1', type: 'warning', source: 'PO', title: 'Overdue Payment', message: 'PO-002 payment is overdue by 5 days', timestamp: new Date(Date.now() - 86400000).toISOString(), read: false, entityId: 'PO-002', entityType: 'PO' },
      { id: 'NOTIF-2', type: 'info', source: 'GRN', title: 'GRN Submitted', message: 'GRN-005 has been submitted by Warehouse', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, entityId: 'GRN-005', entityType: 'GRN' }
    ],
    notificationRules: [
      { id: 'RULE-1', eventType: 'approval_request', enabled: true, channels: ['in-app'] },
      { id: 'RULE-2', eventType: 'overdue_payment', enabled: true, channels: ['in-app', 'email'] },
      { id: 'RULE-3', eventType: 'low_stock', enabled: true, threshold: 10, channels: ['in-app'] }
    ],
    isSupplierPortal: false,
    selectedQuotationId: null,
    negotiationMessages: [],
    complianceDocs: initialComplianceDocs,
    disputes: initialDisputes,
    poMessages: [],
    currentSupplier: null,
    products: [
      { id: 'PRD-1', name: 'Seamless Carbon Pipe', sku: 'PIPE-SM-001', category: 'Piping', description: 'High-pressure seamless carbon steel pipe for industrial use.', unit: 'Meter', basePrice: 85.50, currency: 'USD', technicalDocs: ['CDOC-005'], certifications: ['ASME B16.5'] },
      { id: 'PRD-2', name: 'Industrial Gate Valve', sku: 'VALV-GT-04', category: 'Valves', description: 'API 600 compliant heavy-duty gate valve.', unit: 'Piece', basePrice: 320.00, currency: 'USD', technicalDocs: ['CDOC-006'], certifications: ['API 600', 'ISO 9001'] },
      { id: 'PRD-3', name: 'Stainless Steel Flange', sku: 'FLG-SS-08', category: 'Fittings', description: 'Corrosion resistant 316L stainless steel flange.', unit: 'Piece', basePrice: 195.00, currency: 'USD', technicalDocs: [], certifications: ['ASME B16.5'] }
    ],
  });

  // ── Session Persistence ───────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('procureiq_user');
    const savedSupplier = localStorage.getItem('procureiq_supplier');
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState(p => ({ ...p, currentUser: user, activePage: user.role === 'finance' ? 'finance' : 'dashboard' }));
      } catch (e) { console.error('Failed to parse saved user'); }
    }
    
    if (savedSupplier) {
      try {
        const supplier = JSON.parse(savedSupplier);
        setState(p => ({ ...p, currentSupplier: supplier, isSupplierPortal: true, activePage: 'dashboard' }));
      } catch (e) { console.error('Failed to parse saved supplier'); }
    }
  }, []);

  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('procureiq_user', JSON.stringify(state.currentUser));
      localStorage.removeItem('procureiq_supplier');
    } else {
      localStorage.removeItem('procureiq_user');
    }
  }, [state.currentUser]);

  useEffect(() => {
    if (state.currentSupplier) {
      localStorage.setItem('procureiq_supplier', JSON.stringify(state.currentSupplier));
      localStorage.removeItem('procureiq_user');
    } else {
      localStorage.removeItem('procureiq_supplier');
    }
  }, [state.currentSupplier]);

  // ── Roadmap Extensions ───────────────────────────────────

  const logAudit = useCallback((log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => {
    setState(p => {
      const newEntry: AuditLogEntry = {
        ...log,
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: p.currentUser?.id || 'SYS',
        actorName: p.currentUser?.name || 'System',
      };
      return { ...p, auditLogs: [newEntry, ...p.auditLogs] };
    });
  }, []);

  const addBudget = useCallback((b: BudgetEnvelope) => {
    setState(p => ({ ...p, budgets: [...p.budgets, b] }));
    logAudit({ entityType: 'Budget', entityId: b.id, action: 'Create', description: `Created budget: ${b.name}` });
  }, [logAudit]);

  const updateBudget = useCallback((id: string, updates: Partial<BudgetEnvelope>) => {
    setState(p => ({ ...p, budgets: p.budgets.map(b => b.id === id ? { ...b, ...updates } : b) }));
  }, []);

  const addContract = useCallback((c: Contract) => {
    setState(p => ({ ...p, contracts: [...p.contracts, c] }));
    logAudit({ entityType: 'Contract', entityId: c.id, action: 'Create', description: `Registered contract: ${c.title}` });
  }, [logAudit]);

  const updateContract = useCallback((id: string, updates: Partial<Contract>) => {
    setState(p => ({ ...p, contracts: p.contracts.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const addInvoice = useCallback((i: Invoice) => {
    setState(p => ({ ...p, invoices: [...p.invoices, i] }));
    logAudit({ entityType: 'Invoice', entityId: i.id, action: 'Create', description: `Recorded invoice: ${i.invoiceNumber}` });
  }, [logAudit]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setState(p => ({ ...p, invoices: p.invoices.map(i => i.id === id ? { ...i, ...updates } : i) }));
  }, []);

  const addBlanket = useCallback((b: BlanketPO) => {
    setState(p => ({ ...p, blanketPOs: [...p.blanketPOs, b] }));
    logAudit({ entityType: 'PO', entityId: b.id, action: 'Create', description: `Created Blanket PO: ${b.id} with ceiling ${b.totalCeiling}` });
  }, [logAudit]);

  const updateBlanket = useCallback((id: string, updates: Partial<BlanketPO>) => {
    setState(p => ({ ...p, blanketPOs: p.blanketPOs.map(b => b.id === id ? { ...b, ...updates } : b) }));
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    setState(p => {
      const newNotif: AppNotification = {
        ...n,
        id: `NOTIF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      return { ...p, notifications: [newNotif, ...p.notifications] };
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(p => ({ ...p, notifications: p.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(p => ({ ...p, notifications: p.notifications.map(n => ({ ...n, read: true })) }));
  }, []);

  const toggleNotificationRule = useCallback((id: string) => {
    setState(p => ({ ...p, notificationRules: p.notificationRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) }));
    logAudit({ entityType: 'Supplier', entityId: id, action: 'Update', description: `Toggled notification rule: ${id}` });
  }, [logAudit]);

  const setSupplierPortal = useCallback((val: boolean) => setState(p => ({ ...p, isSupplierPortal: val })), []);

  const performMatch = useCallback((poId: string): MatchStatus => {
    const po = state.purchaseOrders.find(p => p.id === poId);
    if (!po) return 'Missing PO';
    const grn = state.grns.find(g => g.poId === poId && g.status === 'Approved');
    const invoice = state.invoices.find(i => i.poId === poId);

    if (!grn) return 'Missing GRN';
    if (!invoice) return 'Pending';

    // Simplified 3-way match logic
    const poQty = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const grnQty = grn.lineItems.reduce((sum, item) => sum + item.acceptedQty, 0);
    const invQty = invoice.lineItems.reduce((sum, item) => sum + item.billedQty, 0);

    if (poQty === grnQty && grnQty === invQty && po.totalAmount === invoice.totalAmount) {
      return 'Full Match';
    }
    return 'Variance';
  }, [state.purchaseOrders, state.grns, state.invoices]);

  const processApprovalStep = useCallback((poId: string, stepIndex: number, status: 'Approved' | 'Rejected', comments?: string) => {
    setState(p => {
      const po = p.purchaseOrders.find(o => o.id === poId);
      if (!po) return p;

      const newSteps = [...po.approvalSteps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        status,
        userId: p.currentUser?.id,
        userName: p.currentUser?.name,
        timestamp: new Date().toISOString(),
        comments
      };

      let newStatus = po.deliveryStatus;
      let nextStep = po.currentApprovalStep;

      if (status === 'Approved') {
        if (stepIndex === po.approvalSteps.length - 1) {
          newStatus = 'Approved' as POStatus;
        } else {
          nextStep = stepIndex + 1;
        }
      } else {
        newStatus = 'Cancelled' as POStatus; // Rejected ends the flow
      }

      const updatedPO = {
        ...po,
        approvalSteps: newSteps,
        currentApprovalStep: nextStep,
        deliveryStatus: newStatus,
        approvedBy: status === 'Approved' && stepIndex === po.approvalSteps.length - 1 ? p.currentUser?.name : po.approvedBy,
        approvedAt: status === 'Approved' && stepIndex === po.approvalSteps.length - 1 ? new Date().toISOString() : po.approvedAt
      };

      return {
        ...p,
        purchaseOrders: p.purchaseOrders.map(o => o.id === poId ? updatedPO : o)
      };
    });

    logAudit({
      entityType: 'PO',
      entityId: poId,
      action: status === 'Approved' ? 'Approve' : 'Reject',
      description: `${status} step ${stepIndex + 1} of approval chain. ${comments || ''}`
    });
  }, [logAudit]);

  const setActivePage         = useCallback((page: string) => setState(p => ({ ...p, activePage: page, selectedItemId: null, selectedSupplierId: null, selectedPOId: null, selectedRFQId: null, selectedGRNId: null })), []);
  const setSelectedItemId     = useCallback((id: string | null) => setState(p => ({ ...p, selectedItemId: id })), []);
  const setSelectedSupplierId = useCallback((id: string | null) => setState(p => ({ ...p, selectedSupplierId: id })), []);
  const setSelectedPOId       = useCallback((id: string | null) => setState(p => ({ ...p, selectedPOId: id })), []);
  const setSelectedRFQId      = useCallback((id: string | null) => setState(p => ({ ...p, selectedRFQId: id })), []);
  const setSelectedGRNId      = useCallback((id: string | null) => setState(p => ({ ...p, selectedGRNId: id })), []);
  const setSelectedAssetId    = useCallback((id: string | null) => setState(p => ({ ...p, setSelectedAssetId: id })), []);
  const setSelectedBlanketId  = useCallback((id: string | null) => setState(p => ({ ...p, selectedBlanketId: id })), []);
  const setSelectedQuotationId = useCallback((id: string | null) => setState(p => ({ ...p, selectedQuotationId: id })), []);
  const setFabOpen            = useCallback((open: boolean) => setState(p => ({ ...p, fabOpen: open })), []);
  const setModalOpen          = useCallback((modal: string | null) => setState(p => ({ ...p, modalOpen: modal, fabOpen: false })), []);
  const toggleDarkMode        = useCallback(() => setState(p => ({ ...p, darkMode: !p.darkMode })), []);

  const login = useCallback((email: string, password: string): boolean => {
    const user = state.users.find(u => u.email === email && u.passwordHash === password && u.active);
    if (user) {
      // Finance users land on the Finance page by default
      const defaultPage = user.role === 'finance' ? 'finance' : 'dashboard';
      setState(p => ({ ...p, currentUser: user, activePage: defaultPage }));
      return true;
    }
    return false;
  }, [state.users]);

  const logout = useCallback(() => setState(p => ({ ...p, currentUser: null, activePage: 'dashboard' })), []);

  const supplierLogin = useCallback((supplierId: string, passwordHash: string): boolean => {
    const supplier = state.suppliers.find(s => s.id === supplierId && s.passwordHash === passwordHash && s.active);
    if (supplier) {
      setState(p => ({ ...p, currentSupplier: supplier }));
      return true;
    }
    return false;
  }, [state.suppliers]);

  const supplierLogout = useCallback(() => setState(p => ({ ...p, currentSupplier: null })), []);

  // Items
  const addItem             = useCallback((item: Item) => setState(p => ({ ...p, items: [...p.items, item] })), []);
  const updateItem          = useCallback((id: string, updates: Partial<Item>) => setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, ...updates } : i) })), []);
  const archiveItem         = useCallback((id: string) => setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, archived: true } : i) })), []);
  const unarchiveItem       = useCallback((id: string) => setState(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, archived: false } : i) })), []);
  const addItemPriceHistory = useCallback((itemId: string, point: PricePoint) =>
    setState(p => ({ ...p, items: p.items.map(i => i.id === itemId ? { ...i, priceHistory: [...i.priceHistory, point], currentPrice: point.price } : i) })), []);

  // Suppliers
  const addSupplier            = useCallback((supplier: Supplier) => setState(p => ({ ...p, suppliers: [...p.suppliers, supplier] })), []);
  const updateSupplier         = useCallback((id: string, updates: Partial<Supplier>) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, ...updates } : s) })), []);
  const updateSupplierKPIs     = useCallback((id: string, kpis: SupplierKPIs) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, kpis } : s) })), []);
  const togglePreferredSupplier= useCallback((id: string) => setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? { ...s, preferred: !s.preferred } : s) })), []);
  const addSupplierNote        = useCallback((supplierId: string, note: string) => {
    const newNote = { id: `NOTE-${Date.now()}`, text: note, date: new Date().toISOString().split('T')[0], author: state.currentUser?.name || 'Procurement Team' };
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === supplierId ? { ...s, notes: [...(s.notes || []), newNote] } : s) }));
  }, [state.currentUser]);

  // Purchase Orders
  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setState(p => {
      let updatedBlankets = p.blanketPOs;
      if (po.blanketPoId) {
        updatedBlankets = p.blanketPOs.map(b => {
          if (b.id === po.blanketPoId) {
            return {
              ...b,
              consumedAmount: b.consumedAmount + po.totalAmount,
              releaseOrderIds: [...b.releaseOrderIds, po.id]
            };
          }
          return b;
        });
      }
      return { ...p, purchaseOrders: [po, ...p.purchaseOrders], blanketPOs: updatedBlankets };
    });
    logAudit({ entityType: 'PO', entityId: po.id, action: 'Create', description: `Created${po.blanketPoId ? ' Release' : ''} PO: ${po.id}` });
    
    // Notify Manager
    addNotification({
      type: 'info',
      source: 'PO',
      title: 'New PO Approval Req',
      message: `A new PO ${po.id} requires your approval.`,
      entityId: po.id,
      entityType: 'PO'
    });
  }, [logAudit, addNotification]);
  const updatePOStatus   = useCallback((poId: string, status: POStatus) => setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: status } : po) })), []);
  const updatePOPayment  = useCallback((poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, paymentStatus, amountPaid, dateOfPayment: dateOfPayment || po.dateOfPayment } : po) })), []);
  const approvePO = useCallback((poId: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: 'Approved' as POStatus } : po) })), []);
  const rejectPO  = useCallback((poId: string, reason: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: 'Cancelled' as POStatus, cancellationReason: `REJECTED: ${reason}` } : po) })), []);
  const cancelPO  = useCallback((poId: string, reason: string) =>
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, deliveryStatus: 'Cancelled' as POStatus, cancellationReason: reason } : po) })), []);

  const duplicatePO = useCallback((poId: string) => {
    setState(p => {
      const original = p.purchaseOrders.find(po => po.id === poId);
      if (!original) return p;
      const newId = `PO-${String(p.purchaseOrders.length + 1).padStart(3, '0')}`;
      return { ...p, purchaseOrders: [{ ...original, id: newId, dateOfIssue: new Date().toISOString().split('T')[0], deliveryStatus: 'Draft' as POStatus, paymentStatus: 'Unpaid' as PaymentStatus, amountPaid: 0, dateOfPayment: null, paymentRecords: [] }, ...p.purchaseOrders] };
    });
  }, []);

  const acknowledgePO    = useCallback((poId: string) => {
    setState(p => ({
      ...p,
      purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { ...po, acknowledgedAt: new Date().toISOString() } : po)
    }));
  }, []);

  const updateShipment   = useCallback((poId: string, tracking: string, carrier: string) => {
    setState(p => ({
      ...p,
      purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { 
        ...po, 
        deliveryStatus: 'Shipped', 
        trackingNumber: tracking, 
        carrier, 
        shippedAt: new Date().toISOString() 
      } : po)
    }));
  }, []);

  const requestAmendment = useCallback((poId: string, request: Omit<POAmendmentRequest, 'id' | 'timestamp' | 'status'>) => {
    setState(p => ({
      ...p,
      purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? { 
        ...po, 
        amendmentRequest: { 
          ...request, 
          id: `AMD-${Date.now()}`, 
          timestamp: new Date().toISOString(), 
          status: 'Pending' 
        } 
      } : po)
    }));
  }, []);

  const updateDeliveredQty = useCallback((poId: string, itemId: string, qty: number) => {
    setState(p => ({
      ...p,
      purchaseOrders: p.purchaseOrders.map(po => {
        if (po.id !== poId) return po;
        const newItems = po.items.map(item => item.itemId === itemId ? { ...item, deliveredQty: (item.deliveredQty || 0) + Number(qty) } : item);
        
        // Determine status
        const allDelivered = newItems.every(i => (i.deliveredQty || 0) >= i.quantity);
        const someDelivered = newItems.some(i => (i.deliveredQty || 0) > 0);
        const newStatus: POStatus = allDelivered ? 'Delivered' : (someDelivered ? 'Partially Delivered' : po.deliveryStatus);
        
        return { ...po, items: newItems, deliveryStatus: newStatus };
      })
    }));
  }, []);

  const submitInvoice = useCallback((data: Omit<Invoice, 'id' | 'matchStatus' | 'status'>) => {
    const newInvoice: Invoice = {
      ...data,
      id: `INV-${Date.now()}`,
      status: 'Pending',
      matchStatus: 'Pending',
    };
    setState(p => ({ ...p, invoices: [newInvoice, ...p.invoices] }));
  }, []);

  const disputeGRN = useCallback((data: Omit<GRNDispute, 'id' | 'timestamp' | 'status'>) => {
    const newDispute: GRNDispute = {
      ...data,
      id: `DSP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'Open'
    };
    setState(p => ({ ...p, disputes: [newDispute, ...p.disputes] }));
  }, []);

  const uploadComplianceDoc = useCallback((data: Omit<ComplianceDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const expires = new Date(data.expiryDate);
    const now = new Date();
    const diff = (expires.getTime() - now.getTime()) / (1000 * 3600 * 24);
    
    const status: ComplianceDocument['status'] = expires < now ? 'Expired' : (diff < 30 ? 'Expiring Soon' : 'Active');
    
    const newDoc: ComplianceDocument = {
      ...data,
      id: `CDOC-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      status
    };
    setState(p => ({ ...p, complianceDocs: [newDoc, ...p.complianceDocs] }));
  }, []);

  // ── Finance actions ────────────────────────────────────────

  const recordPayment = useCallback((record: Omit<PaymentRecord, 'id'>) => {
    setState(p => {
      const newRecord: PaymentRecord = { ...record, id: `PAY-${Date.now()}` };
      const updatedPOs = p.purchaseOrders.map(po => {
        if (po.id !== record.poId) return po;
        const existing = po.paymentRecords || [];
        const newRecords = [...existing, newRecord];

        // Only update balances if the record is auto-approved (manager recorded it directly)
        if (record.status === 'Approved') {
          const totalPaid = newRecords.filter((r: PaymentRecord) => r.status === 'Approved').reduce((s: number, r: PaymentRecord) => s + r.amount, 0);
          const paymentStatus: PaymentStatus = totalPaid >= po.totalAmount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
          return { ...po, paymentRecords: newRecords, amountPaid: totalPaid, paymentStatus, dateOfPayment: totalPaid >= po.totalAmount ? record.paymentDate : po.dateOfPayment };
        }
        return { ...po, paymentRecords: newRecords };
      });
      return { ...p, purchaseOrders: updatedPOs };
    });
  }, []);

  const approvePaymentRecord = useCallback((poId: string, recordId: string, status: PaymentRecordStatus) => {
    setState(p => {
      const updatedPOs = p.purchaseOrders.map(po => {
        if (po.id !== poId) return po;
        const updatedRecords = (po.paymentRecords || []).map((r: PaymentRecord) =>
          r.id === recordId ? { ...r, status, approvedBy: p.currentUser?.id, approvedAt: new Date().toISOString().split('T')[0] } : r
        );
        // Recalculate totals from approved records only
        const totalPaid = updatedRecords.filter((r: PaymentRecord) => r.status === 'Approved').reduce((s: number, r: PaymentRecord) => s + r.amount, 0);
        const paymentStatus: PaymentStatus = totalPaid >= po.totalAmount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
        const lastApproved = updatedRecords.filter((r: PaymentRecord) => r.status === 'Approved').sort((a: PaymentRecord, b: PaymentRecord) => b.paymentDate.localeCompare(a.paymentDate))[0];
        return {
          ...po,
          paymentRecords: updatedRecords,
          amountPaid: totalPaid,
          paymentStatus,
          dateOfPayment: lastApproved?.paymentDate || po.dateOfPayment,
        };
      });
      return { ...p, purchaseOrders: updatedPOs };
    });
  }, []);

  // Documents
  const addDocument          = useCallback((doc: AppDocument) => setState(p => ({ ...p, documents: [...p.documents, doc] })), []);
  const uploadNewDocVersion  = useCallback((originalId: string, newDoc: AppDocument) =>
    setState(p => ({ ...p, documents: [...p.documents.map(d => d.id === originalId ? { ...d, supersededBy: newDoc.id } : d), newDoc] })), []);

  // RFQ
  const addRFQ    = useCallback((rfq: RFQ) => setState(p => ({ ...p, rfqs: [rfq, ...p.rfqs] })), []);
  const updateRFQ = useCallback((id: string, updates: Partial<RFQ>) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, ...updates } : r) })), []);
  const sendRFQ   = useCallback((id: string) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, status: 'Sent', dateSent: new Date().toISOString().split('T')[0] } : r) })), []);
  const closeRFQ  = useCallback((id: string) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, status: 'Closed' } : r) })), []);
  const publishRFQ = useCallback((id: string) => setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? { ...r, status: 'Published' } : r) })), []);
  const awardRFQ  = useCallback((rfqId: string, quotationId: string) => {
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

  // Quotations
  const addQuotation    = useCallback((q: Quotation) => {
    setState(p => ({ ...p, quotations: [q, ...p.quotations] }));
    addNotification({
      type: 'info',
      source: 'Document',
      title: 'New Bid Received',
      message: `${q.supplierName} submitted a bid for RFQ ${q.rfqId}`,
      entityId: q.id,
      entityType: 'Quotation'
    });
  }, [addNotification]);
  const updateQuotation = useCallback((id: string, updates: Partial<Quotation>) => setState(p => ({ ...p, quotations: p.quotations.map(q => q.id === id ? { ...q, ...updates } : q) })), []);
  const updateQuotationFeedback = useCallback((id: string, feedback: string) => setState(p => ({ ...p, quotations: p.quotations.map(q => q.id === id ? { ...q, feedback } : q) })), []);
  const addNegotiationMessage = useCallback((msg: Omit<NegotiationMessage, 'id' | 'timestamp'>) => {
    setState(p => {
      const newMsg: NegotiationMessage = {
        ...msg,
        id: `MSG-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      return { ...p, negotiationMessages: [...p.negotiationMessages, newMsg] };
    });
  }, []);
  const submitEvaluation = useCallback((quotationId: string, evalData: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>) => {
    setState(p => {
      const quotation = p.quotations.find(q => q.id === quotationId);
      const rfq = p.rfqs.find(r => r.id === quotation?.rfqId);
      const totalScore = calcEvalScore(evalData, rfq?.evaluationWeights);
      const fullEval: QuotationEvaluation = { ...evalData, totalScore, evaluatedBy: p.currentUser?.id || 'USR-001', evaluatedAt: new Date().toISOString().split('T')[0] };
      return { ...p, quotations: p.quotations.map(q => q.id === quotationId ? { ...q, evaluation: fullEval, status: 'Evaluated' } : q) };
    });
  }, []);

  // GRN
  const addGRN    = useCallback((grn: GRN) => setState(p => ({ ...p, grns: [grn, ...p.grns] })), []);
  const submitGRN = useCallback((id: string) => setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? { ...g, status: 'Submitted' } : g) })), []);

  const approveGRN = useCallback((id: string) => {
    setState(p => {
      const grn = p.grns.find(g => g.id === id);
      if (!grn || grn.stockUpdated) return p;
      let updatedStock = [...p.stockItems];
      const newMovements: StockMovement[] = [];
      const today = new Date().toISOString().split('T')[0];
      grn.lineItems.forEach(line => {
        const stockIdx = updatedStock.findIndex(s => s.itemId === line.itemId);
        if (stockIdx >= 0) {
          const newBalance = updatedStock[stockIdx].currentStock + line.acceptedQty;
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], currentStock: newBalance, lastUpdated: today, lastGRNId: id };
          newMovements.push({ id: `MOV-${Date.now()}-${line.itemId}`, stockItemId: updatedStock[stockIdx].id, itemId: line.itemId, itemName: line.itemName, movementType: 'GRN', quantity: line.acceptedQty, referenceId: id, date: today, performedBy: p.currentUser?.id || 'USR-001', balanceAfter: newBalance, notes: `GRN ${id} approved` });
        }
      });
      const updatedPOs = p.purchaseOrders.map(po => po.id === grn.poId ? { ...po, deliveryStatus: 'Delivered' as POStatus } : po);
      return { ...p, grns: p.grns.map(g => g.id === id ? { ...g, status: 'Approved', dateApproved: today, approvedBy: p.currentUser?.id || 'USR-001', stockUpdated: true } : g), stockItems: updatedStock, stockMovements: [...p.stockMovements, ...newMovements], purchaseOrders: updatedPOs };
    });
  }, []);

  const rejectGRN  = useCallback((id: string, reason: string) =>
    setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? { ...g, status: 'Rejected', notes: (g.notes ? g.notes + ' | ' : '') + `Rejection: ${reason}` } : g) })), []);

  const adjustStock = useCallback((stockItemId: string, delta: number, reason: string) => {
    setState(p => {
      const today = new Date().toISOString().split('T')[0];
      const idx = p.stockItems.findIndex(s => s.id === stockItemId);
      if (idx < 0) return p;
      const newBalance = Math.max(0, p.stockItems[idx].currentStock + delta);
      const updatedStock = [...p.stockItems];
      updatedStock[idx] = { ...updatedStock[idx], currentStock: newBalance, lastUpdated: today };
      const movement: StockMovement = { id: `MOV-${Date.now()}`, stockItemId, itemId: updatedStock[idx].itemId, itemName: updatedStock[idx].itemName, movementType: 'Adjustment', quantity: delta, referenceId: `ADJ-${Date.now()}`, date: today, performedBy: p.currentUser?.id || 'USR-001', balanceAfter: newBalance, notes: reason };
      return { ...p, stockItems: updatedStock, stockMovements: [...p.stockMovements, movement] };
    });
  }, []);

  // Assets
  const addAsset          = useCallback((asset: Asset) => setState(p => ({ ...p, assets: [asset, ...p.assets] })), []);
  const updateAssetStatus = useCallback((id: string, status: AssetStatus) => setState(p => ({ ...p, assets: p.assets.map(a => a.id === id ? { ...a, status } : a) })), []);
  const addAssetCategory  = useCallback((cat: string) => setState(p => ({ ...p, assetCategories: Array.from(new Set([...p.assetCategories, cat])) })), []);
  const logMaintenance    = useCallback((assetId: string, record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord = { ...record, id: `MNT-${Date.now()}` };
    setState(p => ({ ...p, assets: p.assets.map(a => a.id === assetId ? { ...a, maintenanceHistory: [newRecord, ...(a.maintenanceHistory || [])] } : a) }));
  }, []);
  const calculateCurrentAssetValue = useCallback((asset: Asset) => {
    const yearsElapsed = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsElapsed <= 0) return asset.purchaseValue;
    return Math.max(asset.purchaseValue * Math.pow(1 - asset.depreciationRate, yearsElapsed), asset.salvageValue);
  }, []);

  // Lookups
  const getSupplierById  = useCallback((id: string) => state.suppliers.find(s => s.id === id), [state.suppliers]);
  const getItemById      = useCallback((id: string) => state.items.find(i => i.id === id), [state.items]);
  const getPOById        = useCallback((id: string) => state.purchaseOrders.find(po => po.id === id), [state.purchaseOrders]);
  const getRFQById       = useCallback((id: string) => state.rfqs.find(r => r.id === id), [state.rfqs]);
  const getStockByItemId = useCallback((itemId: string) => state.stockItems.find(s => s.itemId === itemId), [state.stockItems]);
  const sendPOMessage = useCallback((msg: Omit<POMessage, 'id' | 'timestamp'>) => {
    setState(p => ({
      ...p,
      poMessages: [...p.poMessages, { ...msg, id: `MSG-${Date.now()}`, timestamp: new Date().toISOString() }]
    }));
  }, []);

  const updateSupplierProfile = useCallback((id: string, updates: Partial<Supplier>) => {
    setState(p => ({
      ...p,
      suppliers: p.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, []);

  const requestEarlyPayment = useCallback((invoiceId: string, discountPct: number) => {
    setState(p => ({
      ...p,
      invoices: p.invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'Processing' as any, matchStatus: `Early Pay (${discountPct}%)` as any } : inv)
    }));
    logAudit({ entityType: 'Invoice', entityId: invoiceId, action: 'Payment', description: `Early payment requested with ${discountPct}% discount.` });
  }, [logAudit]);

  const addSupplierContact = useCallback((supplierId: string, contact: { name: string; role: string; email: string }) => {
    setState(p => ({
      ...p,
      suppliers: p.suppliers.map(s => s.id === supplierId ? { 
        ...s, 
        contactList: [...(s.contactList || []), { ...contact, id: `CON-${Date.now()}` }] 
      } : s)
    }));
  }, []);

  const addProduct = useCallback((product: Omit<ProductLibraryItem, 'id'>) => {
    setState(p => ({
      ...p,
      products: [...p.products, { ...product, id: `PRD-${Date.now()}` }]
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      setActivePage, setSelectedItemId, setSelectedSupplierId, setSelectedPOId,
      setSelectedRFQId, setSelectedGRNId, setFabOpen, setModalOpen, toggleDarkMode,
      login, logout,
      addItem, updateItem, archiveItem, unarchiveItem, addItemPriceHistory,
      addSupplier, updateSupplier, updateSupplierKPIs, togglePreferredSupplier, addSupplierNote,
      addPurchaseOrder, updatePOStatus, updatePOPayment, approvePO, rejectPO, cancelPO, duplicatePO,
      recordPayment, approvePaymentRecord,
      addDocument, uploadNewDocVersion,
      addRFQ, updateRFQ, sendRFQ, closeRFQ, awardRFQ, publishRFQ,
      addQuotation, updateQuotation, submitEvaluation,
      addGRN, submitGRN, approveGRN, rejectGRN,
      adjustStock,
      addAsset, updateAssetStatus, addAssetCategory, logMaintenance, calculateCurrentAssetValue,
      getSupplierById, getItemById, getPOById, getRFQById, getStockByItemId,
      setSelectedAssetId, setSelectedQuotationId,
      // Roadmap Extensions
      addBudget, updateBudget, addContract, updateContract, addInvoice, updateInvoice,
      logAudit, processApprovalStep, performMatch,
      addBlanket, updateBlanket, setSelectedBlanketId,
      addNotification, markNotificationRead, markAllNotificationsRead, toggleNotificationRule,
      setSupplierPortal, addNegotiationMessage, updateQuotationFeedback,
      acknowledgePO, updateShipment, requestAmendment, updateDeliveredQty,
      submitInvoice, disputeGRN, uploadComplianceDoc,
      sendPOMessage, updateSupplierProfile, requestEarlyPayment, addSupplierContact,
      supplierLogin, supplierLogout, addProduct
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
