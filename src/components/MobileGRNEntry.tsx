'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Camera, Scan, Package, Check, ArrowLeft, 
  Search, Plus, Minus, Image as ImageIcon,
  Save, AlertCircle, ShoppingCart, ChevronRight
} from 'lucide-react';

export default function MobileGRNEntry() {
  const { purchaseOrders, addGRN, setActivePage } = useApp();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [poId, setPoId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [photo, setPhoto] = useState<string | null>(null);

  const selectedPO = purchaseOrders.find(p => p.id === poId);

  const startEntry = (id: string) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;
    setPoId(id);
    const initialQtys: Record<string, number> = {};
    po.items.forEach(item => {
      initialQtys[item.itemId] = item.quantity;
    });
    setQuantities(initialQtys);
    setStep(2);
  };

  const updateQty = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const handleSubmit = () => {
    if (!selectedPO) return;
    const newGrnId = `GRN-W-${Date.now()}`;
    addGRN({
      id: newGrnId,
      poId: selectedPO.id,
      supplierId: selectedPO.supplierId,
      supplierName: selectedPO.supplierName,
      dateCreated: new Date().toISOString().split('T')[0],
      dateApproved: null,
      createdBy: 'Warehouse Staff',
      approvedBy: null,
      lineItems: selectedPO.items.map((item, index) => ({
        poLineIndex: index,
        itemId: item.itemId,
        itemName: item.itemName,
        orderedQty: item.quantity,
        receivedQty: quantities[item.itemId] || 0,
        acceptedQty: quantities[item.itemId] || 0,
        rejectedQty: 0,
        unitPrice: item.unitPrice,
      })),
      totalAccepted: Object.values(quantities).reduce((a,b)=>a+b,0),
      totalRejected: 0,
      stockUpdated: false,
      status: 'Submitted',
    });
    setActivePage('grn');
  };

  if (step === 1) {
    return (
      <div className="mobile-grn-container animate-in">
        <div className="mobile-header">
          <button className="back-btn" onClick={() => setActivePage('grn')}>
             <ArrowLeft size={24} />
          </button>
          <h2>Warehouse Receipt</h2>
        </div>
        
        <div className="mobile-body">
          <div className="scanner-simulation">
            <Scan size={48} />
            <p>Scan Shipping Label / Barcode</p>
            <button className="btn btn-primary" onClick={() => startEntry('PO-001')}>
              <Camera size={20} /> Open Camera
            </button>
          </div>

          <div className="divider"><span>OR ENTER MANUALLY</span></div>

          <div className="form-group" style={{ padding: '0 20px' }}>
            <label className="form-label">Purchase Order Number</label>
            <div className="search-box">
               <Search size={18} />
               <input 
                 type="text" 
                 placeholder="Search PO (e.g. PO-001)" 
                 value={poId}
                 onChange={e => setPoId(e.target.value.toUpperCase())}
               />
            </div>
            {poId && !selectedPO && <p className="error-text"><AlertCircle size={14} /> PO not found</p>}
            {selectedPO && (
              <div className="po-preview-card" onClick={() => startEntry(selectedPO.id)}>
                <div className="po-preview-info">
                   <span className="po-id">{selectedPO.id}</span>
                   <span className="po-supplier">{selectedPO.supplierName}</span>
                </div>
                <ChevronRight size={20} />
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .mobile-grn-container {
            background: #0f172a;
            min-height: 100vh;
            color: #f1f5f9;
            display: flex;
            flex-direction: column;
          }
          .mobile-header {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(255,255,255,0.03);
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .mobile-header h2 { margin: 0; font-size: 18px; }
          .scanner-simulation {
            margin: 40px 20px;
            padding: 40px 20px;
            border: 2px dashed rgba(99,102,241,0.3);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
            color: #6366f1;
            background: rgba(99,102,241,0.02);
          }
          .divider {
            text-align: center;
            position: relative;
            margin: 24px 0;
          }
          .divider::before {
            content: '';
            position: absolute;
            left: 20px;
            right: 20px;
            top: 50%;
            height: 1px;
            background: rgba(255,255,255,0.1);
          }
          .divider span {
            position: relative;
            background: #0f172a;
            padding: 0 12px;
            font-size: 10px;
            font-weight: 700;
            color: var(--text-muted);
            letter-spacing: 1px;
          }
          .po-preview-card {
            margin-top: 16px;
            padding: 16px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .po-preview-info { display: flex; flex-direction: column; gap: 2px; }
          .po-id { font-weight: 700; font-family: monospace; color: #6366f1; }
          .po-supplier { font-size: 13px; color: var(--text-secondary); }
          .error-text { color: #f43f5e; font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mobile-grn-container animate-in">
      <div className="mobile-header">
        <button className="back-btn" onClick={() => setStep(1)}>
           <ArrowLeft size={24} />
        </button>
        <div>
          <h2>Line Entry</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{selectedPO?.id} • {selectedPO?.supplierName}</p>
        </div>
      </div>

      <div className="mobile-body" style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Items Received</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setPhoto('mock-photo')}>
             <Camera size={16} /> {photo ? 'Photo Added' : 'Add Photo'}
          </button>
        </div>

        {selectedPO?.items.map(item => (
          <div key={item.itemId} className="qty-row card-glass" style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>{item.itemName}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Ordered: <span style={{ color: '#f1f5f9' }}>{item.quantity}</span>
              </div>
              <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <button className="qty-btn" onClick={() => updateQty(item.itemId, -1)}><Minus size={18} /></button>
                 <span style={{ fontSize: 20, fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{quantities[item.itemId] || 0}</span>
                 <button className="qty-btn" onClick={() => updateQty(item.itemId, 1)}><Plus size={18} /></button>
              </div>
            </div>
          </div>
        ))}

        {photo && (
           <div style={{ marginTop: 24, padding: 16, background: 'rgba(16,185,129,0.05)', borderRadius: 12, border: '1px dashed #10b981', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ImageIcon size={20} className="text-primary" />
              <span style={{ fontSize: 13, color: '#10b981' }}>Delivery note photo successfully attached.</span>
           </div>
        )}
      </div>

      <div className="mobile-footer" style={{ padding: 20, background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <button className="btn btn-primary" style={{ width: '100%', height: 50, borderRadius: 12, fontSize: 16, fontWeight: 700 }} onClick={handleSubmit}>
           <Save size={20} /> Submit Receipt
        </button>
      </div>

      <style jsx>{`
        .mobile-grn-container {
          background: #0f172a;
          min-height: 100vh;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
        }
        .qty-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-btn:active {
          background: #334155;
          transform: scale(0.95);
        }
        .back-btn { background: transparent; border: none; color: #f1f5f9; padding: 0; }
      `}</style>
    </div>
  );
}
