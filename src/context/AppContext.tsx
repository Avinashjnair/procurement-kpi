'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import type {
  User, RFQ, Quotation, QuotationEvaluation, StockItem, StockMovement, GRN, GRNLineItem,
  Asset, MaintenanceRecord, AssetStatus, PaymentRecord, PaymentRecordStatus,
  BudgetEnvelope, Contract, Invoice, AuditLogEntry, MatchStatus, ApprovalStep, BlanketPO,
  AppNotification, NotificationRule, NegotiationMessage, POAmendmentRequest,
  ComplianceDocument, GRNDispute, POMessage, ProductLibraryItem, Supplier, SupplierKPIs, Item, PricePoint, POStatus, PaymentStatus, PurchaseOrder, AppDocument, CompanyProfile, AcknowledgePODetails, UpdateShipmentDetails
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
  globalSearchQuery: string;
  isMobileSidebarOpen: boolean;
  companyProfile: CompanyProfile | null;
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addItem: (item: Item) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
  unarchiveItem: (id: string) => Promise<void>;
  addItemPriceHistory: (itemId: string, point: PricePoint) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  updateSupplierKPIs: (id: string, kpis: SupplierKPIs) => Promise<void>;
  togglePreferredSupplier: (id: string) => Promise<void>;
  addSupplierNote: (supplierId: string, note: string) => Promise<void>;
  addPurchaseOrder: (po: PurchaseOrder) => Promise<void>;
  updatePOStatus: (poId: string, status: POStatus) => Promise<void>;
  updatePOPayment: (poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) => Promise<void>;
  approvePO: (poId: string) => Promise<void>;
  rejectPO: (poId: string, reason: string) => Promise<void>;
  cancelPO: (poId: string, reason: string) => Promise<void>;
  duplicatePO: (poId: string) => Promise<void>;
  recordPayment: (record: Omit<PaymentRecord, 'id'>) => Promise<void>;
  approvePaymentRecord: (poId: string, recordId: string, status: PaymentRecordStatus) => Promise<void>;
  addDocument: (doc: AppDocument) => Promise<void>;
  uploadNewDocVersion: (originalId: string, newDoc: AppDocument) => Promise<void>;
  addRFQ: (rfq: RFQ) => Promise<void>;
  updateRFQ: (id: string, updates: Partial<RFQ>) => Promise<void>;
  sendRFQ: (id: string) => Promise<void>;
  closeRFQ: (id: string) => Promise<void>;
  publishRFQ: (id: string) => Promise<void>;
  awardRFQ: (rfqId: string, quotationId: string) => Promise<void>;
  addQuotation: (q: Quotation) => Promise<void>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<void>;
  submitEvaluation: (quotationId: string, evaluation: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>) => Promise<void>;
  addGRN: (grn: GRN) => Promise<void>;
  submitGRN: (id: string) => Promise<void>;
  approveGRN: (id: string) => Promise<void>;
  rejectGRN: (id: string, reason: string) => Promise<void>;
  updateGRN: (id: string, updates: Partial<GRN>) => Promise<void>;
  deleteGRN: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updatePO: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePO: (id: string) => Promise<void>;
  adjustStock: (stockItemId: string, delta: number, reason: string) => Promise<void>;
  consumeStock: (stockItemId: string, qty: number, reason: string) => Promise<void>;
  addAsset: (asset: Asset) => Promise<void>;
  updateAssetStatus: (id: string, status: AssetStatus) => Promise<void>;
  addAssetCategory: (category: string) => Promise<void>;
  logMaintenance: (assetId: string, record: Omit<MaintenanceRecord, 'id'>) => Promise<void>;
  calculateCurrentAssetValue: (asset: Asset) => number;
  getSupplierById: (id: string) => Supplier | undefined;
  getItemById: (id: string) => Item | undefined;
  getPOById: (id: string) => PurchaseOrder | undefined;
  getRFQById: (id: string) => RFQ | undefined;
  getStockByItemId: (itemId: string) => StockItem | undefined;
  addBudget: (b: BudgetEnvelope) => Promise<void>;
  updateBudget: (id: string, updates: Partial<BudgetEnvelope>) => Promise<void>;
  addContract: (c: Contract) => Promise<void>;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  addInvoice: (i: Invoice) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  logAudit: (log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => Promise<void>;
  processApprovalStep: (poId: string, stepIndex: number, status: 'Approved' | 'Rejected', comments?: string) => Promise<void>;
  performMatch: (poId: string, invoiceId?: string) => MatchStatus;
  addBlanket: (b: BlanketPO) => Promise<void>;
  updateBlanket: (id: string, updates: Partial<BlanketPO>) => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toggleNotificationRule: (id: string) => Promise<void>;
  setSelectedQuotationId: (id: string | null) => void;
  setSupplierPortal: (val: boolean) => void;
  addNegotiationMessage: (msg: Omit<NegotiationMessage, 'id' | 'timestamp'>) => Promise<void>;
  updateQuotationFeedback: (id: string, feedback: string) => Promise<void>;
  acknowledgePO: (poId: string, details?: AcknowledgePODetails) => Promise<void>;
  updateShipment: (poId: string, details: UpdateShipmentDetails) => Promise<void>;
  requestAmendment: (poId: string, request: Omit<POAmendmentRequest, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateDeliveredQty: (poId: string, itemId: string, qty: number) => Promise<void>;
  submitInvoice: (data: Omit<Invoice, 'id' | 'matchStatus' | 'status'>) => Promise<void>;
  disputeGRN: (data: Omit<GRNDispute, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  uploadComplianceDoc: (data: Omit<ComplianceDocument, 'id' | 'uploadedAt' | 'status'>) => Promise<void>;
  poMessages: POMessage[];
  sendPOMessage: (msg: Omit<POMessage, 'id' | 'timestamp'>) => Promise<void>;
  updateSupplierProfile: (id: string, updates: Partial<Supplier>) => Promise<void>;
  approveSupplier: (id: string, password: string) => Promise<void>;
  rejectSupplier: (id: string, reason: string) => Promise<void>;
  requestEarlyPayment: (invoiceId: string, discountPct: number) => Promise<void>;
  addSupplierContact: (supplierId: string, contact: { name: string; role: string; email: string }) => Promise<void>;
  supplierLogin: (supplierId: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  supplierLogout: () => void;
  addProduct: (product: Omit<ProductLibraryItem, 'id'>) => Promise<void>;
  setGlobalSearchQuery: (q: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>('steelmax');
  const pendingMatches = useRef<Record<string, boolean>>({});
  
  const [state, setState] = useState<AppState>({
    items: [],
    suppliers: [],
    purchaseOrders: [],
    documents: [],
    activePage: 'dashboard',
    selectedItemId: null,
    selectedSupplierId: null,
    selectedPOId: null,
    fabOpen: false,
    modalOpen: null,
    darkMode: true,
    currentUser: null,
    users: [],
    rfqs: [],
    quotations: [],
    stockItems: [],
    stockMovements: [],
    grns: [],
    selectedRFQId: null,
    selectedGRNId: null,
    assets: [],
    assetCategories: [],
    selectedAssetId: null,
    budgets: [],
    contracts: [],
    invoices: [],
    auditLogs: [],
    fxRates: { 'USD': 3.67, 'EUR': 3.95, 'GBP': 4.65, 'AED': 1.0 },
    blanketPOs: [],
    selectedBlanketId: null,
    notifications: [],
    notificationRules: [],
    isSupplierPortal: false,
    selectedQuotationId: null,
    negotiationMessages: [],
    complianceDocs: [],
    disputes: [],
    poMessages: [],
    currentSupplier: null,
    products: [],
    globalSearchQuery: '',
    isMobileSidebarOpen: false,
    companyProfile: null,
  });

  // Get common API headers
  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    };
  }, [authToken, tenantId]);

  // Bulk data loading
  const initData = useCallback(async (token: string, tenant: string) => {
    try {
      const res = await fetch('/api/data/init', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setState(p => ({
          ...p,
          users: data.users || [],
          suppliers: data.suppliers || [],
          items: data.items || [],
          purchaseOrders: data.purchaseOrders || [],
          documents: data.documents || [],
          rfqs: data.rfqs || [],
          quotations: data.quotations || [],
          stockItems: data.stockItems || [],
          stockMovements: data.stockMovements || [],
          grns: data.grns || [],
          assets: data.assets || [],
          budgets: data.budgets || [],
          contracts: data.contracts || [],
          invoices: data.invoices || [],
          blanketPOs: data.blanketPOs || [],
          notifications: data.notifications || [],
          auditLogs: data.auditLogs || [],
          complianceDocs: data.complianceDocs || [],
          disputes: data.disputes || [],
          products: data.products || [],
          negotiationMessages: data.negotiationMessages || [],
          poMessages: data.poMessages || [],
          notificationRules: data.notificationRules || [],
          assetCategories: data.assetCategories || [],
          fxRates: data.fxRates || p.fxRates,
          companyProfile: data.companyProfile || null,
        }));
      } else {
        console.error('Failed to load initial tenant data:', await res.text());
      }
    } catch (e) {
      console.error('Failed to connect to init data API:', e);
    }
  }, []);

  // ── Session Initialization ───────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('procurebuddy_token');
    const savedTenant = localStorage.getItem('procurebuddy_tenant_id') || 'veltrix';

    if (savedToken) {
      setAuthToken(savedToken);
      setTenantId(savedTenant);

      // Verify session token
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'x-tenant-id': savedTenant,
        },
      })
      .then(async res => {
        if (res.ok) {
          const profile = await res.json();
          if (profile.type === 'user') {
            setState(p => ({
              ...p,
              currentUser: profile.user,
              activePage: profile.user.role === 'finance' ? 'finance' : 'dashboard',
            }));
          } else {
            setState(p => ({
              ...p,
              currentSupplier: profile.supplier,
              isSupplierPortal: true,
              activePage: 'dashboard',
            }));
          }
          // Seed the rest of the application
          initData(savedToken, savedTenant);
        } else {
          // Token expired or invalid
          localStorage.removeItem('procurebuddy_token');
          localStorage.removeItem('procurebuddy_tenant_id');
          setAuthToken(null);
        }
      })
      .catch(err => {
        console.error('Identity checks failed:', err);
      });
    }
  }, [initData]);

  // Auth logins
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      let resolvedTenant = 'veltrix';
      const emailLower = email.toLowerCase();
      if (emailLower.includes('essential')) {
        resolvedTenant = 'veltrix_essential';
      } else if (emailLower.includes('professional')) {
        resolvedTenant = 'veltrix_professional';
      } else if (emailLower.includes('enterprise')) {
        resolvedTenant = 'veltrix_enterprise';
      }
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': resolvedTenant,
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { token, user } = await res.json();
        
        localStorage.setItem('procurebuddy_token', token);
        localStorage.setItem('procurebuddy_tenant_id', resolvedTenant);
        
        setAuthToken(token);
        setTenantId(resolvedTenant);
        
        const defaultPage = user.role === 'finance' ? 'finance' : 'dashboard';
        setState(p => ({ ...p, currentUser: user, activePage: defaultPage }));
        
        await initData(token, resolvedTenant);
        return { success: true };
      }
      
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Invalid email or password' };
    } catch (e) {
      console.error('Login request failed:', e);
      return { success: false, error: 'Network error or server offline' };
    }
  }, [initData]);

  const supplierLogin = useCallback(async (supplierId: string, passwordHash: string): Promise<{ success: boolean; error?: string }> => {
    try {
      let resolvedTenant = 'veltrix';
      const supplierIdUpper = supplierId.toUpperCase();
      if (supplierIdUpper.includes('ESSENTIAL')) {
        resolvedTenant = 'veltrix_essential';
      } else if (supplierIdUpper.includes('PROFESSIONAL')) {
        resolvedTenant = 'veltrix_professional';
      } else if (supplierIdUpper.includes('ENTERPRISE')) {
        resolvedTenant = 'veltrix_enterprise';
      }

      const res = await fetch('/api/auth/supplier-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': resolvedTenant,
        },
        body: JSON.stringify({ supplierId, password: passwordHash }),
      });

      if (res.ok) {
        const { token, supplier } = await res.json();
        
        localStorage.setItem('procurebuddy_token', token);
        localStorage.setItem('procurebuddy_tenant_id', resolvedTenant);
        
        setAuthToken(token);
        setTenantId(resolvedTenant);

        setState(p => ({ ...p, currentSupplier: supplier, isSupplierPortal: true, activePage: 'dashboard' }));
        
        await initData(token, resolvedTenant);
        return { success: true };
      }
      
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Invalid supplier ID or password' };
    } catch (e) {
      console.error('Supplier login request failed:', e);
      return { success: false, error: 'Network error or server offline' };
    }
  }, [initData]);

  const logout = useCallback(() => {
    localStorage.removeItem('procurebuddy_token');
    localStorage.removeItem('procurebuddy_tenant_id');
    setAuthToken(null);
    setState(p => ({
      ...p,
      currentUser: null,
      currentSupplier: null,
      isSupplierPortal: false,
      activePage: 'dashboard',
      items: [],
      suppliers: [],
      purchaseOrders: [],
      rfqs: [],
      quotations: [],
      stockItems: [],
      stockMovements: [],
      grns: [],
      assets: [],
      budgets: [],
      contracts: [],
      invoices: [],
      blanketPOs: [],
      notifications: [],
      negotiationMessages: [],
      complianceDocs: [],
      disputes: [],
      poMessages: [],
    }));
  }, []);

  const supplierLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Centralized Dynamic mutation helper
  const runMutation = useCallback(async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/data/mutate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action, payload }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.newNotifications && data.newNotifications.length > 0) {
          setState(p => {
            const existingIds = new Set(p.notifications.map(n => n.id));
            const fresh = data.newNotifications.filter((n: any) => !existingIds.has(n.id));
            return {
              ...p,
              notifications: [...fresh, ...p.notifications]
            };
          });
        }
        return data.result;
      }
      throw new Error(await res.text());
    } catch (e) {
      console.error(`Mutation ${action} failed:`, e);
      throw e;
    }
  }, [getHeaders]);

  // ── Items ──────────────────────────────────────────────
  const addItem = useCallback(async (item: Item) => {
    const result = await runMutation('ADD_ITEM', item);
    setState(p => ({ ...p, items: [...p.items, result] }));
  }, [runMutation]);

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    const result = await runMutation('UPDATE_ITEM', { id, updates });
    setState(p => ({ ...p, items: p.items.map(i => i.id === id ? result : i) }));
  }, [runMutation]);

  const archiveItem = useCallback(async (id: string) => {
    const result = await runMutation('ARCHIVE_ITEM', { id });
    setState(p => ({ ...p, items: p.items.map(i => i.id === id ? result : i) }));
  }, [runMutation]);

  const unarchiveItem = useCallback(async (id: string) => {
    const result = await runMutation('UNARCHIVE_ITEM', { id });
    setState(p => ({ ...p, items: p.items.map(i => i.id === id ? result : i) }));
  }, [runMutation]);

  const deleteItem = useCallback(async (id: string) => {
    await runMutation('DELETE_ITEM', { id });
    setState(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
  }, [runMutation]);

  const addItemPriceHistory = useCallback(async (itemId: string, point: PricePoint) => {
    const result = await runMutation('ADD_ITEM_PRICE_HISTORY', { itemId, point });
    setState(p => ({ ...p, items: p.items.map(i => i.id === itemId ? result : i) }));
  }, [runMutation]);

  // ── Suppliers ──────────────────────────────────────────
  const addSupplier = useCallback(async (supplier: Supplier) => {
    const result = await runMutation('ADD_SUPPLIER', supplier);
    setState(p => ({ ...p, suppliers: [...p.suppliers, result] }));
  }, [runMutation]);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    const result = await runMutation('UPDATE_SUPPLIER', { id, updates });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? result : s) }));
  }, [runMutation]);

  const updateSupplierKPIs = useCallback(async (id: string, kpis: SupplierKPIs) => {
    const result = await runMutation('UPDATE_SUPPLIER_KPIS', { id, kpis });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? result : s) }));
  }, [runMutation]);

  const togglePreferredSupplier = useCallback(async (id: string) => {
    const result = await runMutation('TOGGLE_PREFERRED_SUPPLIER', { id });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? result : s) }));
  }, [runMutation]);

  const addSupplierNote = useCallback(async (supplierId: string, note: string) => {
    const result = await runMutation('ADD_SUPPLIER_NOTE', { supplierId, note });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === supplierId ? result : s) }));
  }, [runMutation]);

  const addSupplierContact = useCallback(async (supplierId: string, contact: { name: string; role: string; email: string }) => {
    const result = await runMutation('ADD_SUPPLIER_CONTACT', { supplierId, contact });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === supplierId ? result : s) }));
  }, [runMutation]);

  const updateSupplierProfile = useCallback(async (id: string, updates: Partial<Supplier>) => {
    const result = await runMutation('UPDATE_SUPPLIER_PROFILE', { id, updates });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? result : s) }));
  }, [runMutation]);

  // ── Vendor Registration Approval ──────────────────────────
  const approveSupplier = useCallback(async (id: string, password: string) => {
    const result = await runMutation('APPROVE_SUPPLIER', { id, password });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? result : s) }));
  }, [runMutation]);

  const rejectSupplier = useCallback(async (id: string, reason: string) => {
    const result = await runMutation('REJECT_SUPPLIER', { id, reason });
    setState(p => ({ ...p, suppliers: p.suppliers.map(s => s.id === id ? result : s) }));
  }, [runMutation]);

  // ── Purchase Orders ──────────────────────────────────────
  const addPurchaseOrder = useCallback(async (po: PurchaseOrder) => {
    const result = await runMutation('ADD_PURCHASE_ORDER', po);
    setState(p => {
      let updatedBlankets = p.blanketPOs;
      if (result.blanketPoId) {
        updatedBlankets = p.blanketPOs.map(b => {
          if (b.id === result.blanketPoId) {
            return {
              ...b,
              consumedAmount: b.consumedAmount + result.totalAmount,
              releaseOrderIds: Array.isArray(b.releaseOrderIds) ? [...b.releaseOrderIds, result.id] : [result.id],
            };
          }
          return b;
        });
      }
      return {
        ...p,
        purchaseOrders: [result, ...p.purchaseOrders],
        blanketPOs: updatedBlankets,
      };
    });
  }, [runMutation]);

  const updatePOStatus = useCallback(async (poId: string, status: POStatus) => {
    const result = await runMutation('UPDATE_PO_STATUS', { poId, status });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const updatePOPayment = useCallback(async (poId: string, paymentStatus: PaymentStatus, amountPaid: number, dateOfPayment?: string) => {
    const result = await runMutation('UPDATE_PO_PAYMENT', { poId, paymentStatus, amountPaid, dateOfPayment });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const approvePO = useCallback(async (poId: string) => {
    const result = await runMutation('APPROVE_PO', { poId });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const rejectPO = useCallback(async (poId: string, reason: string) => {
    const result = await runMutation('REJECT_PO', { poId, reason });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const cancelPO = useCallback(async (poId: string, reason: string) => {
    const result = await runMutation('CANCEL_PO', { poId, reason });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const duplicatePO = useCallback(async (poId: string) => {
    const result = await runMutation('DUPLICATE_PO', { poId });
    setState(p => ({ ...p, purchaseOrders: [result, ...p.purchaseOrders] }));
  }, [runMutation]);

  const updatePO = useCallback(async (id: string, updates: Partial<PurchaseOrder>) => {
    const result = await runMutation('UPDATE_PO', { id, updates });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === id ? result : po) }));
  }, [runMutation]);

  const deletePO = useCallback(async (id: string) => {
    await runMutation('DELETE_PO', { id });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.filter(po => po.id !== id) }));
  }, [runMutation]);

  const acknowledgePO = useCallback(async (poId: string, details?: AcknowledgePODetails) => {
    const result = await runMutation('ACKNOWLEDGE_PO', { poId, ...details });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const updateShipment = useCallback(async (poId: string, details: UpdateShipmentDetails) => {
    const result = await runMutation('UPDATE_SHIPMENT', { poId, ...details });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const requestAmendment = useCallback(async (poId: string, request: Omit<POAmendmentRequest, 'id' | 'timestamp' | 'status'>) => {
    const result = await runMutation('REQUEST_AMENDMENT', { poId, request });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  const updateDeliveredQty = useCallback(async (poId: string, itemId: string, qty: number) => {
    const result = await runMutation('UPDATE_DELIVERED_QTY', { poId, itemId, qty });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  // ── Payments ─────────────────────────────────────────────
  const recordPayment = useCallback(async (record: Omit<PaymentRecord, 'id'>) => {
    const result = await runMutation('RECORD_PAYMENT', { record });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === record.poId ? result : po) }));
  }, [runMutation]);

  const approvePaymentRecord = useCallback(async (poId: string, recordId: string, status: PaymentRecordStatus) => {
    const result = await runMutation('APPROVE_PAYMENT_RECORD', { poId, recordId, status });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  // ── Documents ────────────────────────────────────────────
  const addDocument = useCallback(async (doc: AppDocument) => {
    const result = await runMutation('ADD_DOCUMENT', doc);
    setState(p => ({ ...p, documents: [...p.documents, result] }));
  }, [runMutation]);

  const uploadNewDocVersion = useCallback(async (originalId: string, newDoc: AppDocument) => {
    const result = await runMutation('UPLOAD_NEW_DOC_VERSION', { originalId, newDoc });
    setState(p => ({
      ...p,
      documents: p.documents.map(d => d.id === originalId ? { ...d, supersededBy: result.id } : d).concat(result),
    }));
  }, [runMutation]);

  // ── RFQs ─────────────────────────────────────────────────
  const addRFQ = useCallback(async (rfq: RFQ) => {
    const result = await runMutation('ADD_RFQ', rfq);
    setState(p => ({ ...p, rfqs: [result, ...p.rfqs] }));
  }, [runMutation]);

  const updateRFQ = useCallback(async (id: string, updates: Partial<RFQ>) => {
    const result = await runMutation('UPDATE_RFQ', { id, updates });
    setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? result : r) }));
  }, [runMutation]);

  const sendRFQ = useCallback(async (id: string) => {
    const result = await runMutation('SEND_RFQ', { id });
    setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? result : r) }));
  }, [runMutation]);

  const closeRFQ = useCallback(async (id: string) => {
    const result = await runMutation('CLOSE_RFQ', { id });
    setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? result : r) }));
  }, [runMutation]);

  const publishRFQ = useCallback(async (id: string) => {
    const result = await runMutation('PUBLISH_RFQ', { id });
    setState(p => ({ ...p, rfqs: p.rfqs.map(r => r.id === id ? result : r) }));
  }, [runMutation]);

  const awardRFQ = useCallback(async (rfqId: string, quotationId: string) => {
    await runMutation('AWARD_RFQ', { rfqId, quotationId });
    // Reload RFQs & Quotations lists from standard REST init data to ensure exact sync
    await initData(authToken || '', tenantId);
  }, [runMutation, initData, authToken, tenantId]);

  // ── Quotations ───────────────────────────────────────────
  const addQuotation = useCallback(async (q: Quotation) => {
    const result = await runMutation('ADD_QUOTATION', q);
    setState(p => ({ ...p, quotations: [result, ...p.quotations] }));
  }, [runMutation]);

  const updateQuotation = useCallback(async (id: string, updates: Partial<Quotation>) => {
    const result = await runMutation('UPDATE_QUOTATION', { id, updates });
    setState(p => ({ ...p, quotations: p.quotations.map(q => q.id === id ? result : q) }));
  }, [runMutation]);

  const submitEvaluation = useCallback(async (quotationId: string, evalData: Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt'>) => {
    const result = await runMutation('SUBMIT_EVALUATION', { quotationId, evaluation: evalData });
    setState(p => ({ ...p, quotations: p.quotations.map(q => q.id === quotationId ? result : q) }));
  }, [runMutation]);

  const addNegotiationMessage = useCallback(async (msg: Omit<NegotiationMessage, 'id' | 'timestamp'>) => {
    const result = await runMutation('ADD_NEGOTIATION_MESSAGE', msg);
    setState(p => ({ ...p, negotiationMessages: [...p.negotiationMessages, result] }));
  }, [runMutation]);

  const updateQuotationFeedback = useCallback(async (id: string, feedback: string) => {
    const result = await runMutation('UPDATE_QUOTATION_FEEDBACK', { id, feedback });
    setState(p => ({ ...p, quotations: p.quotations.map(q => q.id === id ? result : q) }));
  }, [runMutation]);

  // ── Goods Receipt Note (GRN) ──────────────────────────────
  const addGRN = useCallback(async (grn: GRN) => {
    const result = await runMutation('ADD_GRN', grn);
    setState(p => ({ ...p, grns: [result, ...p.grns] }));
  }, [runMutation]);

  const submitGRN = useCallback(async (id: string) => {
    const result = await runMutation('SUBMIT_GRN', { id });
    setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? result : g) }));
  }, [runMutation]);

  const approveGRN = useCallback(async (id: string) => {
    await runMutation('APPROVE_GRN', { id });
    // Reload state completely on GRN approval to correctly pull updated stock items, stock movements, and PO statuses
    await initData(authToken || '', tenantId);
  }, [runMutation, initData, authToken, tenantId]);

  const rejectGRN = useCallback(async (id: string, reason: string) => {
    const result = await runMutation('REJECT_GRN', { id, reason });
    setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? result : g) }));
  }, [runMutation]);

  const updateGRN = useCallback(async (id: string, updates: Partial<GRN>) => {
    const result = await runMutation('UPDATE_GRN', { id, updates });
    setState(p => ({ ...p, grns: p.grns.map(g => g.id === id ? result : g) }));
  }, [runMutation]);

  const deleteGRN = useCallback(async (id: string) => {
    await runMutation('DELETE_GRN', { id });
    setState(p => ({ ...p, grns: p.grns.filter(g => g.id !== id) }));
  }, [runMutation]);

  const adjustStock = useCallback(async (stockItemId: string, delta: number, reason: string) => {
    await runMutation('ADJUST_STOCK', { stockItemId, delta, reason });
    // Reload init to fetch updated stock status & movements list
    await initData(authToken || '', tenantId);
  }, [runMutation, initData, authToken, tenantId]);

  const consumeStock = useCallback(async (stockItemId: string, qty: number, reason: string) => {
    await runMutation('ADJUST_STOCK', { stockItemId, delta: -qty, reason, movementType: 'Issue' });
    await initData(authToken || '', tenantId);
  }, [runMutation, initData, authToken, tenantId]);

  // ── Assets ───────────────────────────────────────────────
  const addAsset = useCallback(async (asset: Asset) => {
    const result = await runMutation('ADD_ASSET', asset);
    setState(p => ({ ...p, assets: [result, ...p.assets] }));
  }, [runMutation]);

  const updateAssetStatus = useCallback(async (id: string, status: AssetStatus) => {
    const result = await runMutation('UPDATE_ASSET_STATUS', { id, status });
    setState(p => ({ ...p, assets: p.assets.map(a => a.id === id ? result : a) }));
  }, [runMutation]);

  const addAssetCategory = useCallback(async (category: string) => {
    const result = await runMutation('ADD_ASSET_CATEGORY', { category });
    setState(p => ({ ...p, assetCategories: Array.from(new Set([...p.assetCategories, result.name])) }));
  }, [runMutation]);

  const logMaintenance = useCallback(async (assetId: string, record: Omit<MaintenanceRecord, 'id'>) => {
    const result = await runMutation('LOG_MAINTENANCE', { assetId, record });
    setState(p => ({ ...p, assets: p.assets.map(a => a.id === assetId ? result : a) }));
  }, [runMutation]);

  const calculateCurrentAssetValue = useCallback((asset: Asset) => {
    const yearsElapsed = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsElapsed <= 0) return asset.purchaseValue;
    return Math.max(asset.purchaseValue * Math.pow(1 - asset.depreciationRate, yearsElapsed), asset.salvageValue);
  }, []);

  // ── Budgets, Contracts & Blanket POs ───────────────────────
  const addBudget = useCallback(async (b: BudgetEnvelope) => {
    const result = await runMutation('ADD_BUDGET', b);
    setState(p => ({ ...p, budgets: [...p.budgets, result] }));
  }, [runMutation]);

  const updateBudget = useCallback(async (id: string, updates: Partial<BudgetEnvelope>) => {
    const result = await runMutation('UPDATE_BUDGET', { id, updates });
    setState(p => ({ ...p, budgets: p.budgets.map(b => b.id === id ? result : b) }));
  }, [runMutation]);

  const addContract = useCallback(async (c: Contract) => {
    const result = await runMutation('ADD_CONTRACT', c);
    setState(p => ({ ...p, contracts: [...p.contracts, result] }));
  }, [runMutation]);

  const updateContract = useCallback(async (id: string, updates: Partial<Contract>) => {
    const result = await runMutation('UPDATE_CONTRACT', { id, updates });
    setState(p => ({ ...p, contracts: p.contracts.map(c => c.id === id ? result : c) }));
  }, [runMutation]);

  const addInvoice = useCallback(async (i: Invoice) => {
    const result = await runMutation('ADD_INVOICE', i);
    setState(p => ({ ...p, invoices: [...p.invoices, result] }));
  }, [runMutation]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const result = await runMutation('UPDATE_INVOICE', { id, updates });
    setState(p => ({ ...p, invoices: p.invoices.map(i => i.id === id ? result : i) }));
  }, [runMutation]);

  const addBlanket = useCallback(async (b: BlanketPO) => {
    const result = await runMutation('ADD_BLANKET', b);
    setState(p => ({ ...p, blanketPOs: [...p.blanketPOs, result] }));
  }, [runMutation]);

  const updateBlanket = useCallback(async (id: string, updates: Partial<BlanketPO>) => {
    const result = await runMutation('UPDATE_BLANKET', { id, updates });
    setState(p => ({ ...p, blanketPOs: p.blanketPOs.map(b => b.id === id ? result : b) }));
  }, [runMutation]);

  // ── Notifications ────────────────────────────────────────
  const addNotification = useCallback(async (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const result = await runMutation('ADD_NOTIFICATION', n);
    setState(p => ({ ...p, notifications: [result, ...p.notifications] }));
  }, [runMutation]);

  const markNotificationRead = useCallback(async (id: string) => {
    const result = await runMutation('MARK_NOTIFICATION_READ', { id });
    setState(p => ({ ...p, notifications: p.notifications.map(n => n.id === id ? result : n) }));
  }, [runMutation]);

  const markAllNotificationsRead = useCallback(async () => {
    await runMutation('MARK_ALL_NOTIFICATIONS_READ', {});
    setState(p => ({ ...p, notifications: p.notifications.map(n => ({ ...n, read: true })) }));
  }, [runMutation]);

  const toggleNotificationRule = useCallback(async (id: string) => {
    const result = await runMutation('TOGGLE_NOTIFICATION_RULE', { id });
    setState(p => ({ ...p, notificationRules: p.notificationRules.map(r => r.id === id ? result : r) }));
  }, [runMutation]);

  // ── Supplier Portal Actions ──────────────────────────────
  const submitInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'matchStatus' | 'status'>) => {
    const result = await runMutation('SUBMIT_INVOICE', invoiceData);
    setState(p => ({ ...p, invoices: [result, ...p.invoices] }));
  }, [runMutation]);

  const disputeGRN = useCallback(async (disputeData: Omit<GRNDispute, 'id' | 'timestamp' | 'status'>) => {
    const result = await runMutation('DISPUTE_GRN', disputeData);
    setState(p => ({ ...p, disputes: [result, ...p.disputes] }));
  }, [runMutation]);

  const uploadComplianceDoc = useCallback(async (docData: Omit<ComplianceDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const result = await runMutation('UPLOAD_COMPLIANCE_DOC', docData);
    setState(p => ({ ...p, complianceDocs: [result, ...p.complianceDocs] }));
  }, [runMutation]);

  const sendPOMessage = useCallback(async (msg: Omit<POMessage, 'id' | 'timestamp'>) => {
    const result = await runMutation('SEND_PO_MESSAGE', msg);
    setState(p => ({ ...p, poMessages: [...p.poMessages, result] }));
  }, [runMutation]);

  const requestEarlyPayment = useCallback(async (invoiceId: string, discountPct: number) => {
    const result = await runMutation('REQUEST_EARLY_PAYMENT', { invoiceId, discountPct });
    setState(p => ({ ...p, invoices: p.invoices.map(inv => inv.id === invoiceId ? result : inv) }));
  }, [runMutation]);

  const addProduct = useCallback(async (product: Omit<ProductLibraryItem, 'id'>) => {
    const result = await runMutation('ADD_PRODUCT', product);
    setState(p => ({ ...p, products: [...p.products, result] }));
  }, [runMutation]);

  // ── Audit logs ───────────────────────────────────────────
  const logAudit = useCallback(async (log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => {
    const result = await runMutation('LOG_AUDIT', log);
    setState(p => ({ ...p, auditLogs: [result, ...p.auditLogs] }));
  }, [runMutation]);

  // ── PO Multi-step Approvals ──────────────────────────────
  const processApprovalStep = useCallback(async (poId: string, stepIndex: number, status: 'Approved' | 'Rejected', comments?: string) => {
    const result = await runMutation('PROCESS_APPROVAL_STEP', { poId, stepIndex, status, comments });
    setState(p => ({ ...p, purchaseOrders: p.purchaseOrders.map(po => po.id === poId ? result : po) }));
  }, [runMutation]);

  // ── 3-Way Match Algorithm trigger ────────────────────────
  // invoiceId (optional) scopes the recalculation to one specific invoice on the PO — omit it to
  // recheck every invoice on the PO (e.g. after a GRN approval that could affect several of them).
  const performMatch = useCallback((poId: string, invoiceId?: string): MatchStatus => {
    // Perform match is triggered instantly via client and updated.
    // Use pendingMatches cache to prevent duplicate requests during re-renders.
    const cacheKey = invoiceId ? `${poId}:${invoiceId}` : poId;
    if (pendingMatches.current[cacheKey]) {
      return 'Pending';
    }
    pendingMatches.current[cacheKey] = true;
    runMutation('PERFORM_MATCH', { poId, invoiceId })
      .then(() => {
        initData(authToken || '', tenantId);
      })
      .finally(() => {
        delete pendingMatches.current[cacheKey];
      });
    return 'Pending';
  }, [runMutation, initData, authToken, tenantId]);

  // ── Navigation & Selection Actions ────────────────────────
  const setActivePage = useCallback((page: string) => setState(p => ({ ...p, activePage: page, selectedItemId: null, selectedSupplierId: null, selectedPOId: null, selectedRFQId: null, selectedGRNId: null })), []);
  const setSelectedItemId = useCallback((id: string | null) => setState(p => ({ ...p, selectedItemId: id })), []);
  const setSelectedSupplierId = useCallback((id: string | null) => setState(p => ({ ...p, selectedSupplierId: id })), []);
  const setSelectedPOId = useCallback((id: string | null) => setState(p => ({ ...p, selectedPOId: id })), []);
  const setSelectedRFQId = useCallback((id: string | null) => setState(p => ({ ...p, selectedRFQId: id })), []);
  const setSelectedGRNId = useCallback((id: string | null) => setState(p => ({ ...p, selectedGRNId: id })), []);
  const setSelectedAssetId = useCallback((id: string | null) => setState(p => ({ ...p, selectedAssetId: id })), []);
  const setSelectedBlanketId = useCallback((id: string | null) => setState(p => ({ ...p, selectedBlanketId: id })), []);
  const setSelectedQuotationId = useCallback((id: string | null) => setState(p => ({ ...p, selectedQuotationId: id })), []);
  const setFabOpen = useCallback((open: boolean) => setState(p => ({ ...p, fabOpen: open })), []);
  const setModalOpen = useCallback((modal: string | null) => setState(p => ({ ...p, modalOpen: modal, fabOpen: false })), []);
  const toggleDarkMode = useCallback(() => setState(p => ({ ...p, darkMode: !p.darkMode })), []);
  const setSupplierPortal = useCallback((val: boolean) => setState(p => ({ ...p, isSupplierPortal: val })), []);
  const setGlobalSearchQuery = useCallback((q: string) => setState(p => ({ ...p, globalSearchQuery: q })), []);
  const setMobileSidebarOpen = useCallback((open: boolean) => setState(p => ({ ...p, isMobileSidebarOpen: open })), []);

  // ── Lookups ──────────────────────────────────────────────
  const getSupplierById = useCallback((id: string) => state.suppliers.find(s => s.id === id), [state.suppliers]);
  const getItemById = useCallback((id: string) => state.items.find(i => i.id === id), [state.items]);
  const getPOById = useCallback((id: string) => state.purchaseOrders.find(po => po.id === id), [state.purchaseOrders]);
  const getRFQById = useCallback((id: string) => state.rfqs.find(r => r.id === id), [state.rfqs]);
  const getStockByItemId = useCallback((itemId: string) => state.stockItems.find(s => s.itemId === itemId), [state.stockItems]);

  return (
    <AppContext.Provider value={{
      ...state,
      setActivePage, setSelectedItemId, setSelectedSupplierId, setSelectedPOId,
      setSelectedRFQId, setSelectedGRNId, setFabOpen, setModalOpen, toggleDarkMode,
      login, logout,
      addItem, updateItem, archiveItem, unarchiveItem, addItemPriceHistory, deleteItem,
      addSupplier, updateSupplier, updateSupplierKPIs, togglePreferredSupplier, addSupplierNote,
      addPurchaseOrder, updatePOStatus, updatePOPayment, approvePO, rejectPO, cancelPO, duplicatePO, updatePO, deletePO,
      recordPayment, approvePaymentRecord,
      addDocument, uploadNewDocVersion,
      addRFQ, updateRFQ, sendRFQ, closeRFQ, awardRFQ, publishRFQ,
      addQuotation, updateQuotation, submitEvaluation,
      addGRN, submitGRN, approveGRN, rejectGRN, updateGRN, deleteGRN,
      adjustStock, consumeStock,
      addAsset, updateAssetStatus, addAssetCategory, logMaintenance, calculateCurrentAssetValue,
      getSupplierById, getItemById, getPOById, getRFQById, getStockByItemId,
      setSelectedAssetId, setSelectedQuotationId,
      addBudget, updateBudget, addContract, updateContract, addInvoice, updateInvoice,
      logAudit, processApprovalStep, performMatch,
      addBlanket, updateBlanket, setSelectedBlanketId,
      addNotification, markNotificationRead, markAllNotificationsRead, toggleNotificationRule,
      setSupplierPortal, addNegotiationMessage, updateQuotationFeedback,
      acknowledgePO, updateShipment, requestAmendment, updateDeliveredQty,
      submitInvoice, disputeGRN, uploadComplianceDoc,
      sendPOMessage, updateSupplierProfile, approveSupplier, rejectSupplier, requestEarlyPayment, addSupplierContact,
      supplierLogin, supplierLogout, addProduct, setGlobalSearchQuery, setMobileSidebarOpen
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
