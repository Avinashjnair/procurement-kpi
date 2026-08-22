import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTenantDb } from '@/lib/dbManager';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await req.json();
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const db = getTenantDb(session.tenantId);
    
    // Fetch tenant subscription tier
    const company = await db.companyProfile.findFirst();
    const tier = company?.subscriptionTier || 'essential';

    const PROFESSIONAL_ONLY_ACTIONS = [
      'CREATE_RFQ', 'UPDATE_RFQ', 'DELETE_RFQ',
      'CREATE_QUOTATION', 'UPDATE_QUOTATION',
      'CREATE_BUDGET_ENVELOPE', 'UPDATE_BUDGET_ENVELOPE', 'DELETE_BUDGET_ENVELOPE',
      'CREATE_STOCK_ITEM', 'UPDATE_STOCK_ITEM', 'CREATE_STOCK_MOVEMENT', 'RECORD_STOCK_MOVEMENT'
    ];

    const ENTERPRISE_ONLY_ACTIONS = [
      'CREATE_CONTRACT', 'UPDATE_CONTRACT', 'DELETE_CONTRACT',
      'CREATE_BLANKET_PO', 'UPDATE_BLANKET_PO', 'DELETE_BLANKET_PO',
      'CREATE_ASSET', 'UPDATE_ASSET', 'DELETE_ASSET', 'ADD_ASSET',
      'CREATE_FX_RATE', 'UPDATE_FX_RATE',
      'CREATE_NOTIFICATION_RULE', 'UPDATE_NOTIFICATION_RULE'
    ];

    if (tier === 'essential') {
      if (PROFESSIONAL_ONLY_ACTIONS.includes(action) || ENTERPRISE_ONLY_ACTIONS.includes(action)) {
        return NextResponse.json({ error: `Upgrade required: The feature '${action}' is not available in the Essential tier.` }, { status: 403 });
      }
    } else if (tier === 'professional') {
      if (ENTERPRISE_ONLY_ACTIONS.includes(action)) {
        return NextResponse.json({ error: `Upgrade required: The feature '${action}' is not available in the Professional tier.` }, { status: 403 });
      }
    }

    let result: any = null;

    // Helper to log audit trail
    const logAudit = async (entityType: string, entityId: string, auditAction: string, description: string) => {
      try {
        await db.auditLogEntry.create({
          data: {
            timestamp: new Date().toISOString(),
            actorId: session.userId,
            actorName: session.name,
            entityType,
            entityId,
            action: auditAction,
            description,
          },
        });
      } catch (err) {
        console.error('Audit log failed:', err);
      }
    };
    // Matches a single invoice against its own GRN: prefers the specific GRN it was recorded
    // against (invoice.grnId, set when the invoice was created against a chosen GRN), and only
    // falls back to "any Approved GRN for this PO" for older/unlinked invoices.
    const matchInvoiceToGRN = async (po: any, invoice: any): Promise<string> => {
      let grn = null;
      if (invoice.grnId) {
        const linkedGrn = await db.gRN.findUnique({ where: { id: invoice.grnId } });
        if (linkedGrn && linkedGrn.status === 'Approved') grn = linkedGrn;
      }
      if (!grn) {
        grn = await db.gRN.findFirst({ where: { poId: po.id, status: 'Approved' } });
      }
      if (!grn) return 'Missing GRN';

      const poItems = Array.isArray(po.items) ? po.items : [];
      const grnItems = Array.isArray(grn.lineItems) ? grn.lineItems : [];
      const invItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

      const poQty = poItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const grnQty = grnItems.reduce((sum: number, item: any) => sum + item.acceptedQty, 0);
      const invQty = invItems.reduce((sum: number, item: any) => sum + (item.billedQty || item.quantity), 0);

      if (poQty === grnQty && grnQty === invQty && po.totalAmount === invoice.totalAmount) {
        return 'Full Match';
      }
      return 'Variance';
    };

    // The PO-level match status is a single field summarizing potentially multiple invoices
    // (partial billing) — surface the most concerning status across all of them.
    const aggregatePoMatchStatus = (statuses: string[]): string => {
      if (statuses.length === 0) return 'Pending';
      if (statuses.includes('Variance')) return 'Variance';
      if (statuses.includes('Missing GRN')) return 'Missing GRN';
      if (statuses.includes('Pending')) return 'Pending';
      return 'Full Match';
    };

    // Helper to calculate & persist 3-way match status.
    // If invoiceId is given, only that invoice is (re)matched — used right after creating/submitting
    // it, since a new invoice can't affect the matching of any other invoice on the same PO.
    // If omitted, every invoice on the PO is (re)matched — used after a GRN is approved, since newly
    // available accepted quantities can change the match outcome for any invoice already recorded
    // against this PO. The PO's own matchStatus is always recomputed as an aggregate of all its invoices.
    const runThreeWayMatch = async (poId: string, invoiceId?: string) => {
      try {
        const po = await db.purchaseOrder.findUnique({ where: { id: poId } });
        if (!po) return 'Missing PO';

        const invoicesToMatch = invoiceId
          ? await db.invoice.findMany({ where: { id: invoiceId } })
          : await db.invoice.findMany({ where: { poId } });

        if (invoicesToMatch.length === 0) {
          const grn = await db.gRN.findFirst({ where: { poId, status: 'Approved' } });
          const matchStatus = grn ? 'Pending' : 'Missing GRN';
          await db.purchaseOrder.update({ where: { id: poId }, data: { matchStatus } });
          return matchStatus;
        }

        let lastStatus = 'Pending';
        for (const invoice of invoicesToMatch) {
          lastStatus = await matchInvoiceToGRN(po, invoice);
          await db.invoice.update({
            where: { id: invoice.id },
            data: { matchStatus: lastStatus, status: lastStatus === 'Full Match' ? 'Matched' : 'Variance' },
          });
        }

        // Recompute the PO-level aggregate from every invoice on the PO (not just the one(s) just
        // rechecked), so the PO's overall status always reflects everything billed against it.
        const allInvoices = await db.invoice.findMany({ where: { poId } });
        const poMatchStatus = aggregatePoMatchStatus(allInvoices.map((i: any) => i.matchStatus));
        await db.purchaseOrder.update({ where: { id: poId }, data: { matchStatus: poMatchStatus } });

        return invoiceId ? lastStatus : poMatchStatus;
      } catch (err) {
        console.error('3-Way Match calculation failed:', err);
        return 'Pending';
      }
    };

    switch (action) {
      // ── Items ──────────────────────────────────────────────
      case 'ADD_ITEM': {
        result = await db.item.create({
          data: {
            ...payload,
            linkedSupplierIds: payload.linkedSupplierIds || [],
            priceHistory: payload.priceHistory || [],
            purchaseHistory: payload.purchaseHistory || [],
            serviceDetails: payload.serviceDetails || {},
          },
        });
        await logAudit('Item', payload.id, 'Create', `Created item: ${payload.name}`);
        break;
      }
      case 'UPDATE_ITEM': {
        result = await db.item.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'ARCHIVE_ITEM': {
        result = await db.item.update({
          where: { id: payload.id },
          data: { archived: true },
        });
        await logAudit('Item', payload.id, 'Update', 'Archived item');
        break;
      }
      case 'UNARCHIVE_ITEM': {
        result = await db.item.update({
          where: { id: payload.id },
          data: { archived: false },
        });
        await logAudit('Item', payload.id, 'Update', 'Unarchived item');
        break;
      }
      case 'ADD_ITEM_PRICE_HISTORY': {
        const item = await db.item.findUnique({ where: { id: payload.itemId } });
        if (!item) throw new Error('Item not found');
        const priceHistory = Array.isArray(item.priceHistory) ? [...item.priceHistory, payload.point] : [payload.point];
        result = await db.item.update({
          where: { id: payload.itemId },
          data: {
            priceHistory,
            currentPrice: payload.point.price,
          },
        });
        break;
      }
      case 'DELETE_ITEM': {
        result = await db.item.delete({
          where: { id: payload.id },
        });
        await logAudit('Item', payload.id, 'Delete', `Deleted item: ${payload.id}`);
        break;
      }

      // ── Suppliers ──────────────────────────────────────────
      case 'ADD_SUPPLIER': {
        result = await db.supplier.create({
          data: {
            ...payload,
            kpis: payload.kpis || {},
            notes: payload.notes || [],
            kpiHistory: payload.kpiHistory || [],
            contactList: payload.contactList || [],
            bankInfo: payload.bankInfo || {},
            preferredStatusCriteria: payload.preferredStatusCriteria || [],
            financials: payload.financials || [],
            projectExperienceDocs: payload.projectExperienceDocs || [],
            projectHistory: payload.projectHistory || [],
          },
        });
        await logAudit('Supplier', payload.id, 'Create', `Registered supplier: ${payload.name}`);
        break;
      }
      case 'UPDATE_SUPPLIER': {
        result = await db.supplier.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'UPDATE_SUPPLIER_KPIS': {
        result = await db.supplier.update({
          where: { id: payload.id },
          data: { kpis: payload.kpis },
        });
        break;
      }
      case 'TOGGLE_PREFERRED_SUPPLIER': {
        const sup = await db.supplier.findUnique({ where: { id: payload.id } });
        if (!sup) throw new Error('Supplier not found');
        result = await db.supplier.update({
          where: { id: payload.id },
          data: { preferred: !sup.preferred },
        });
        await logAudit('Supplier', payload.id, 'Update', `Toggled preferred status to ${!sup.preferred}`);
        break;
      }
      case 'ADD_SUPPLIER_NOTE': {
        const sup = await db.supplier.findUnique({ where: { id: payload.supplierId } });
        if (!sup) throw new Error('Supplier not found');
        const newNote = {
          id: `NOTE-${Date.now()}`,
          text: payload.note,
          date: new Date().toISOString().split('T')[0],
          author: session.name,
        };
        const notes = Array.isArray(sup.notes) ? [...sup.notes, newNote] : [newNote];
        result = await db.supplier.update({
          where: { id: payload.supplierId },
          data: { notes },
        });
        break;
      }
      case 'ADD_SUPPLIER_CONTACT': {
        const sup = await db.supplier.findUnique({ where: { id: payload.supplierId } });
        if (!sup) throw new Error('Supplier not found');
        const newContact = {
          ...payload.contact,
          id: `CON-${Date.now()}`,
        };
        const contactList = Array.isArray(sup.contactList) ? [...sup.contactList, newContact] : [newContact];
        result = await db.supplier.update({
          where: { id: payload.supplierId },
          data: { contactList },
        });
        break;
      }
      case 'UPDATE_SUPPLIER_PROFILE': {
        result = await db.supplier.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'APPROVE_SUPPLIER': {
        const sup = await db.supplier.findUnique({ where: { id: payload.id } });
        if (!sup) throw new Error('Supplier not found');
        if (!payload.password || String(payload.password).length < 6) {
          throw new Error('A password of at least 6 characters is required to approve a supplier.');
        }
        result = await db.supplier.update({
          where: { id: payload.id },
          data: {
            status: 'Active',
            active: true,
            passwordHash: bcrypt.hashSync(String(payload.password), 10),
          },
        });
        await logAudit('Supplier', payload.id, 'Approve', `Approved vendor registration for "${sup.name}" and activated portal access.`);
        break;
      }
      case 'REJECT_SUPPLIER': {
        const sup = await db.supplier.findUnique({ where: { id: payload.id } });
        if (!sup) throw new Error('Supplier not found');
        const rejectionNote = {
          id: `NOTE-${Date.now()}`,
          text: `Registration rejected: ${payload.reason || 'No reason provided.'}`,
          date: new Date().toISOString().split('T')[0],
          author: session.name,
        };
        const notes = Array.isArray(sup.notes) ? [...sup.notes, rejectionNote] : [rejectionNote];
        result = await db.supplier.update({
          where: { id: payload.id },
          data: { status: 'Rejected', active: false, notes },
        });
        await logAudit('Supplier', payload.id, 'Reject', `Rejected vendor registration for "${sup.name}": ${payload.reason || 'No reason provided.'}`);
        break;
      }

      // ── Purchase Orders ──────────────────────────────────────
      case 'ADD_PURCHASE_ORDER': {
        result = await db.purchaseOrder.create({
          data: {
            ...payload,
            items: payload.items || [],
            paymentRecords: payload.paymentRecords || [],
            approvalSteps: payload.approvalSteps || [],
            amendmentRequest: payload.amendmentRequest || {},
          },
        });

        // Adjust blanket PO if linked
        if (payload.blanketPoId) {
          const blanket = await db.blanketPO.findUnique({ where: { id: payload.blanketPoId } });
          if (blanket) {
            const releaseOrderIds = Array.isArray(blanket.releaseOrderIds) ? [...blanket.releaseOrderIds, payload.id] : [payload.id];
            await db.blanketPO.update({
              where: { id: payload.blanketPoId },
              data: {
                consumedAmount: blanket.consumedAmount + payload.totalAmount,
                releaseOrderIds,
              },
            });
          }
        }

        await logAudit('PO', payload.id, 'Create', `Created${payload.blanketPoId ? ' Release' : ''} PO: ${payload.id}`);
        break;
      }
      case 'UPDATE_PO': {
        const original = await db.purchaseOrder.findUnique({ where: { id: payload.id } });
        if (!original) throw new Error('PO not found');
        result = await db.purchaseOrder.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        await logAudit('PO', payload.id, 'Update', `Updated PO: ${payload.id}`);
        break;
      }
      case 'DELETE_PO': {
        result = await db.purchaseOrder.delete({ where: { id: payload.id } });
        await logAudit('PO', payload.id, 'Delete', `Deleted PO: ${payload.id}`);
        break;
      }
      case 'UPDATE_PO_STATUS': {
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: { deliveryStatus: payload.status },
        });
        break;
      }
      case 'UPDATE_PO_PAYMENT': {
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: {
            paymentStatus: payload.paymentStatus,
            amountPaid: payload.amountPaid,
            dateOfPayment: payload.dateOfPayment || null,
          },
        });
        break;
      }
      case 'APPROVE_PO': {
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: { deliveryStatus: 'Approved' },
        });
        break;
      }
      case 'REJECT_PO': {
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: { deliveryStatus: 'Cancelled', cancellationReason: `REJECTED: ${payload.reason}` },
        });
        break;
      }
      case 'CANCEL_PO': {
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: { deliveryStatus: 'Cancelled', cancellationReason: payload.reason },
        });
        break;
      }
      case 'DUPLICATE_PO': {
        const original = await db.purchaseOrder.findUnique({
          where: { id: payload.poId },
        });
        if (!original) throw new Error('Original PO not found');

        // Find all POs to calculate the next sequential ID
        const poList = await db.purchaseOrder.findMany({
          select: { id: true }
        });
        
        let maxNum = 0;
        for (const poItem of poList) {
          const match = poItem.id.match(/^PO-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        const newId = `PO-${String(maxNum + 1).padStart(3, '0')}`;

        const { id, createdAt, updatedAt, ...rest } = original as any;

        result = await db.purchaseOrder.create({
          data: {
            ...rest,
            id: newId,
            dateOfIssue: new Date().toISOString().split('T')[0],
            deliveryStatus: 'Draft',
            paymentStatus: 'Unpaid',
            amountPaid: 0.0,
            dateOfPayment: '',
            paymentRecords: [],
            approvalSteps: [
              { role: 'manager', status: 'Pending' },
              { role: 'finance', status: 'Pending' }
            ],
            currentApprovalStep: 0,
            matchStatus: 'Pending',
            acknowledgedAt: '',
            shippedAt: '',
            trackingNumber: '',
            carrier: '',
            amendmentRequest: {},
          },
        });
        await logAudit('PO', newId, 'Create', `Duplicated PO from ${payload.poId} to ${newId}`);
        break;
      }
      case 'ACKNOWLEDGE_PO': {
        const targetPo = await db.purchaseOrder.findUnique({ where: { id: payload.poId } });
        if (!targetPo) throw new Error('PO not found');

        const ackStatus = payload.status === 'Acknowledged with Exceptions' ? 'Acknowledged with Exceptions' : 'Acknowledged';
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: {
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: payload.acknowledgedBy || session.name,
            acknowledgementStatus: ackStatus,
            acknowledgedDeliveryDate: payload.confirmedDeliveryDate || targetPo.eta,
            acknowledgementNotes: payload.notes || '',
          },
        });

        await logAudit(
          'PO',
          payload.poId,
          'StatusChange',
          `Supplier acknowledged PO (${ackStatus})${payload.acknowledgedBy ? ' by ' + payload.acknowledgedBy : ''}${payload.notes ? ' — ' + payload.notes : ''}`
        );
        break;
      }
      case 'UPDATE_SHIPMENT': {
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: {
            deliveryStatus: 'Shipped',
            trackingNumber: payload.trackingNumber,
            carrier: payload.carrier,
            shipmentEta: payload.estimatedDelivery || '',
            shippedAt: new Date().toISOString(),
          },
        });
        await logAudit(
          'PO',
          payload.poId,
          'StatusChange',
          `Shipment confirmed by supplier — carrier: ${payload.carrier || '—'}, tracking: ${payload.trackingNumber || '—'}${payload.estimatedDelivery ? `, ETA: ${payload.estimatedDelivery}` : ''}`
        );
        break;
      }
      case 'REQUEST_AMENDMENT': {
        const amendment = {
          ...payload.request,
          id: `AMD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'Pending',
        };
        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: { amendmentRequest: amendment },
        });
        break;
      }
      case 'UPDATE_DELIVERED_QTY': {
        const po = await db.purchaseOrder.findUnique({ where: { id: payload.poId } });
        if (!po) throw new Error('PO not found');
        const items = Array.isArray(po.items) ? [...po.items] : [];
        const updatedItems = items.map((item: any) => {
          if (item.itemId === payload.itemId) {
            return { ...item, deliveredQty: (item.deliveredQty || 0) + Number(payload.qty) };
          }
          return item;
        });

        const allDelivered = updatedItems.every((i: any) => (i.deliveredQty || 0) >= i.quantity);
        const someDelivered = updatedItems.some((i: any) => (i.deliveredQty || 0) > 0);
        const newStatus = allDelivered ? 'Delivered' : (someDelivered ? 'Partially Delivered' : po.deliveryStatus);

        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: {
            items: updatedItems,
            deliveryStatus: newStatus,
          },
        });
        break;
      }

      // ── Payments ─────────────────────────────────────────────
      case 'RECORD_PAYMENT': {
        const po = await db.purchaseOrder.findUnique({ where: { id: payload.record.poId } });
        if (!po) throw new Error('PO not found');
        const newRecord = { ...payload.record, id: `PAY-${Date.now()}` };
        const existing = Array.isArray(po.paymentRecords) ? po.paymentRecords : [];
        const newRecords = [...existing, newRecord];

        if (payload.record.status === 'Approved') {
          const totalPaid = newRecords.filter((r: any) => r.status === 'Approved').reduce((sum: number, r: any) => sum + r.amount, 0);
          const paymentStatus = totalPaid >= po.totalAmount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
          result = await db.purchaseOrder.update({
            where: { id: payload.record.poId },
            data: {
              paymentRecords: newRecords,
              amountPaid: totalPaid,
              paymentStatus,
              dateOfPayment: totalPaid >= po.totalAmount ? payload.record.paymentDate : po.dateOfPayment,
            },
          });
        } else {
          result = await db.purchaseOrder.update({
            where: { id: payload.record.poId },
            data: { paymentRecords: newRecords },
          });
        }
        break;
      }
      case 'APPROVE_PAYMENT_RECORD': {
        const po = await db.purchaseOrder.findUnique({ where: { id: payload.poId } });
        if (!po) throw new Error('PO not found');
        const records = Array.isArray(po.paymentRecords) ? po.paymentRecords : [];
        const updatedRecords = records.map((r: any) =>
          r.id === payload.recordId ? { ...r, status: payload.status, approvedBy: session.userId, approvedAt: new Date().toISOString().split('T')[0] } : r
        );
        const totalPaid = updatedRecords.filter((r: any) => r.status === 'Approved').reduce((sum: number, r: any) => sum + r.amount, 0);
        const paymentStatus = totalPaid >= po.totalAmount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
        const lastApproved = updatedRecords.filter((r: any) => r.status === 'Approved').sort((a: any, b: any) => b.paymentDate.localeCompare(a.paymentDate))[0];

        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: {
            paymentRecords: updatedRecords,
            amountPaid: totalPaid,
            paymentStatus,
            dateOfPayment: lastApproved?.paymentDate || po.dateOfPayment,
          },
        });
        break;
      }

      // ── RFQs ─────────────────────────────────────────────────
      case 'ADD_RFQ': {
        result = await db.rFQ.create({
          data: {
            ...payload,
            lineItems: payload.lineItems || [],
            invitedSupplierIds: payload.invitedSupplierIds || [],
            evaluationWeights: payload.evaluationWeights || {},
          },
        });
        break;
      }
      case 'UPDATE_RFQ': {
        result = await db.rFQ.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'SEND_RFQ': {
        result = await db.rFQ.update({
          where: { id: payload.id },
          data: { status: 'Sent', dateSent: new Date().toISOString().split('T')[0] },
        });
        break;
      }
      case 'CLOSE_RFQ': {
        result = await db.rFQ.update({
          where: { id: payload.id },
          data: { status: 'Closed' },
        });
        break;
      }
      case 'PUBLISH_RFQ': {
        result = await db.rFQ.update({
          where: { id: payload.id },
          data: { status: 'Published' },
        });
        break;
      }
      case 'AWARD_RFQ': {
        const quotation = await db.quotation.findUnique({ where: { id: payload.quotationId } });
        if (!quotation) throw new Error('Quotation not found');

        // Update RFQ status
        await db.rFQ.update({
          where: { id: payload.rfqId },
          data: {
            status: 'Awarded',
            awardedQuotationId: payload.quotationId,
            awardedSupplierId: quotation.supplierId,
            awardedSupplierName: quotation.supplierName,
          },
        });

        // Award quotation, reject all other quotations for the same RFQ
        await db.quotation.update({
          where: { id: payload.quotationId },
          data: { status: 'Awarded' },
        });
        await db.quotation.updateMany({
          where: { rfqId: payload.rfqId, id: { not: payload.quotationId } },
          data: { status: 'Rejected' },
        });

        result = quotation;
        break;
      }

      // ── Quotations & Negotiation ─────────────────────────────
      case 'ADD_QUOTATION': {
        result = await db.quotation.create({
          data: {
            ...payload,
            lineItems: payload.lineItems || [],
            evaluation: payload.evaluation || {},
          },
        });
        break;
      }
      case 'UPDATE_QUOTATION': {
        result = await db.quotation.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'SUBMIT_EVALUATION': {
        const quotation = await db.quotation.findUnique({ where: { id: payload.quotationId } });
        if (!quotation) throw new Error('Quotation not found');
        const rfq = await db.rFQ.findUnique({ where: { id: quotation.rfqId } });
        if (!rfq) throw new Error('RFQ not found');

        // Simple composite eval scoring calculation
        const e = payload.evaluation;
        const w = (rfq.evaluationWeights || {}) as Record<string, number>;
        const totalScore = Math.round((
          (e.price || 0) * (w.price || 0.3) +
          (e.leadTime || 0) * (w.leadTime || 0.2) +
          (e.pastHistory || 0) * (w.pastHistory || 0.15) +
          (e.paymentTerms || 0) * (w.paymentTerms || 0.12) +
          (e.serviceQuality || 0) * (w.serviceQuality || 0.12) +
          (e.responsiveness || 0) * (w.responsiveness || 0.06) +
          (e.compliance || 0) * (w.compliance || 0.05)
        ) * 10) / 10;

        const fullEval = {
          ...e,
          totalScore,
          evaluatedBy: session.userId,
          evaluatedAt: new Date().toISOString().split('T')[0],
        };

        result = await db.quotation.update({
          where: { id: payload.quotationId },
          data: {
            evaluation: fullEval,
            status: 'Evaluated',
          },
        });
        break;
      }
      case 'ADD_NEGOTIATION_MESSAGE': {
        result = await db.negotiationMessage.create({
          data: {
            ...payload,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }
      case 'UPDATE_QUOTATION_FEEDBACK': {
        result = await db.quotation.update({
          where: { id: payload.id },
          data: { feedback: payload.feedback },
        });
        break;
      }

      // ── Goods Receipt Note (GRN) ──────────────────────────────
      case 'ADD_GRN': {
        result = await db.gRN.create({
          data: {
            ...payload,
            lineItems: payload.lineItems || [],
          },
        });
        break;
      }
      case 'UPDATE_GRN': {
        const original = await db.gRN.findUnique({ where: { id: payload.id } });
        if (!original) throw new Error('GRN not found');
        result = await db.gRN.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        await logAudit('GRN', payload.id, 'Update', `Updated GRN: ${payload.id}`);
        break;
      }
      case 'DELETE_GRN': {
        result = await db.gRN.delete({ where: { id: payload.id } });
        await logAudit('GRN', payload.id, 'Delete', `Deleted GRN: ${payload.id}`);
        break;
      }
      case 'SUBMIT_GRN': {
        result = await db.gRN.update({
          where: { id: payload.id },
          data: { status: 'Submitted' },
        });
        break;
      }
      case 'APPROVE_GRN': {
        const grn = await db.gRN.findUnique({ where: { id: payload.id } });
        if (!grn || grn.stockUpdated) {
          result = grn;
          break;
        }

        const today = new Date().toISOString().split('T')[0];
        const lineItems = Array.isArray(grn.lineItems) ? grn.lineItems : [];

        // Dynamic stock level increases & movement logging
        for (const line of lineItems as any[]) {
          const stock = await db.stockItem.findUnique({ where: { itemId: line.itemId } });
          if (stock) {
            const newBalance = stock.currentStock + line.acceptedQty;
            await db.stockItem.update({
              where: { itemId: line.itemId },
              data: {
                currentStock: newBalance,
                lastUpdated: today,
                lastGRNId: grn.id,
              },
            });
            await db.stockMovement.create({
              data: {
                stockItemId: stock.id,
                itemId: line.itemId,
                itemName: line.itemName,
                movementType: 'GRN',
                quantity: line.acceptedQty,
                referenceId: grn.id,
                date: today,
                performedBy: session.userId,
                balanceAfter: newBalance,
                notes: `GRN ${grn.id} approved`,
              },
            });
          }
        }

        // Close PO delivery status to Delivered
        await db.purchaseOrder.update({
          where: { id: grn.poId },
          data: { deliveryStatus: 'Delivered' },
        });

        result = await db.gRN.update({
          where: { id: payload.id },
          data: {
            status: 'Approved',
            dateApproved: today,
            approvedBy: session.name,
            stockUpdated: true,
          },
        });
        await runThreeWayMatch(grn.poId);
        break;
      }
      case 'REJECT_GRN': {
        const grn = await db.gRN.findUnique({ where: { id: payload.id } });
        const existingNotes = grn?.notes ? grn.notes + ' | ' : '';
        result = await db.gRN.update({
          where: { id: payload.id },
          data: {
            status: 'Rejected',
            notes: `${existingNotes}Rejection: ${payload.reason}`,
          },
        });
        break;
      }

      // ── Inventory / Stock ─────────────────────────────────────
      case 'ADJUST_STOCK': {
        const stock = await db.stockItem.findUnique({ where: { id: payload.stockItemId } });
        if (!stock) throw new Error('Stock item not found');
        const today = new Date().toISOString().split('T')[0];
        const newBalance = Math.max(0, stock.currentStock + payload.delta);

        await db.stockItem.update({
          where: { id: payload.stockItemId },
          data: {
            currentStock: newBalance,
            lastUpdated: today,
          },
        });

        result = await db.stockMovement.create({
          data: {
            stockItemId: payload.stockItemId,
            itemId: stock.itemId,
            itemName: stock.itemName,
            movementType: 'Adjustment',
            quantity: payload.delta,
            referenceId: `ADJ-${Date.now()}`,
            date: today,
            performedBy: session.userId,
            balanceAfter: newBalance,
            notes: payload.reason,
          },
        });
        break;
      }

      // ── Assets ───────────────────────────────────────────────
      case 'ADD_ASSET': {
        result = await db.asset.create({
          data: {
            ...payload,
            maintenanceHistory: payload.maintenanceHistory || [],
          },
        });
        break;
      }
      case 'UPDATE_ASSET_STATUS': {
        result = await db.asset.update({
          where: { id: payload.id },
          data: { status: payload.status },
        });
        break;
      }
      case 'ADD_ASSET_CATEGORY': {
        result = await db.assetCategory.create({
          data: { name: payload.category },
        });
        break;
      }
      case 'LOG_MAINTENANCE': {
        const asset = await db.asset.findUnique({ where: { id: payload.assetId } });
        if (!asset) throw new Error('Asset not found');
        const newRecord = {
          ...payload.record,
          id: `MNT-${Date.now()}`,
        };
        const history = Array.isArray(asset.maintenanceHistory) ? [...asset.maintenanceHistory, newRecord] : [newRecord];
        result = await db.asset.update({
          where: { id: payload.assetId },
          data: { maintenanceHistory: history },
        });
        break;
      }

      // ── Budgets, Contracts & Blanket POs ───────────────────────
      case 'ADD_BUDGET': {
        result = await db.budgetEnvelope.create({ data: payload });
        await logAudit('Budget', payload.id, 'Create', `Created budget: ${payload.name}`);
        break;
      }
      case 'UPDATE_BUDGET': {
        result = await db.budgetEnvelope.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'ADD_CONTRACT': {
        result = await db.contract.create({
          data: {
            ...payload,
            linkedPoIds: payload.linkedPoIds || [],
          },
        });
        await logAudit('Contract', payload.id, 'Create', `Registered contract: ${payload.title}`);
        break;
      }
      case 'UPDATE_CONTRACT': {
        result = await db.contract.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'ADD_INVOICE': {
        result = await db.invoice.create({
          data: {
            ...payload,
            lineItems: payload.lineItems || [],
          },
        });
        await logAudit('Invoice', payload.id, 'Create', `Recorded invoice: ${payload.invoiceNumber}`);
        await runThreeWayMatch(result.poId, result.id);
        break;
      }
      case 'UPDATE_INVOICE': {
        result = await db.invoice.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }
      case 'ADD_BLANKET': {
        result = await db.blanketPO.create({
          data: {
            ...payload,
            releaseOrderIds: payload.releaseOrderIds || [],
          },
        });
        await logAudit('PO', payload.id, 'Create', `Created Blanket PO: ${payload.id}`);
        break;
      }
      case 'UPDATE_BLANKET': {
        result = await db.blanketPO.update({
          where: { id: payload.id },
          data: payload.updates,
        });
        break;
      }

      // ── Notifications ────────────────────────────────────────
      case 'ADD_NOTIFICATION': {
        result = await db.appNotification.create({
          data: {
            ...payload,
            timestamp: new Date().toISOString(),
            read: false,
          },
        });
        break;
      }
      case 'MARK_NOTIFICATION_READ': {
        result = await db.appNotification.update({
          where: { id: payload.id },
          data: { read: true },
        });
        break;
      }
      case 'MARK_ALL_NOTIFICATIONS_READ': {
        result = await db.appNotification.updateMany({
          where: { read: false },
          data: { read: true },
        });
        break;
      }
      case 'TOGGLE_NOTIFICATION_RULE': {
        const rule = await db.notificationRule.findUnique({ where: { id: payload.id } });
        if (!rule) throw new Error('Rule not found');
        result = await db.notificationRule.update({
          where: { id: payload.id },
          data: { enabled: !rule.enabled },
        });
        break;
      }

      // ── Portal Interactions ──────────────────────────────────
      case 'SUBMIT_INVOICE': {
        result = await db.invoice.create({
          data: {
            ...payload,
            id: `INV-${Date.now()}`,
            status: 'Pending',
            matchStatus: 'Pending',
            lineItems: payload.lineItems || [],
          },
        });
        await runThreeWayMatch(result.poId, result.id);
        break;
      }
      case 'DISPUTE_GRN': {
        result = await db.gRNDispute.create({
          data: {
            ...payload,
            id: `DSP-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'Open',
            supportingDocs: payload.supportingDocs || [],
          },
        });
        break;
      }
      case 'UPLOAD_COMPLIANCE_DOC': {
        const expires = new Date(payload.expiryDate);
        const now = new Date();
        const diff = (expires.getTime() - now.getTime()) / (1000 * 3600 * 24);
        const status = expires < now ? 'Expired' : (diff < 30 ? 'Expiring Soon' : 'Active');

        result = await db.complianceDocument.create({
          data: {
            ...payload,
            id: `CDOC-${Date.now()}`,
            uploadedAt: new Date().toISOString(),
            status,
          },
        });
        break;
      }
      case 'SEND_PO_MESSAGE': {
        result = await db.pOMessage.create({
          data: {
            ...payload,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }
      case 'REQUEST_EARLY_PAYMENT': {
        result = await db.invoice.update({
          where: { id: payload.invoiceId },
          data: {
            status: 'Processing',
            matchStatus: `Early Pay (${payload.discountPct}%)`,
          },
        });
        await logAudit('Invoice', payload.invoiceId, 'Payment', `Early payment requested with ${payload.discountPct}% discount.`);
        break;
      }
      case 'ADD_PRODUCT': {
        result = await db.productLibraryItem.create({
          data: {
            ...payload,
            technicalDocs: payload.technicalDocs || [],
            certifications: payload.certifications || [],
          },
        });
        break;
      }

      // ── Process PO Approval Step ─────────────────────────────
      case 'PROCESS_APPROVAL_STEP': {
        const po = await db.purchaseOrder.findUnique({ where: { id: payload.poId } });
        if (!po) throw new Error('PO not found');

        const newSteps = [...(po.approvalSteps as any[])];
        newSteps[payload.stepIndex] = {
          ...newSteps[payload.stepIndex],
          status: payload.status,
          userId: session.userId,
          userName: session.name,
          timestamp: new Date().toISOString(),
          comments: payload.comments || '',
        };

        let newStatus = po.deliveryStatus;
        let nextStep = po.currentApprovalStep;

        if (payload.status === 'Approved') {
          if (payload.stepIndex === newSteps.length - 1) {
            newStatus = 'Approved';
          } else {
            nextStep = payload.stepIndex + 1;
          }
        } else {
          newStatus = 'Cancelled'; // Rejected ends flow
        }

        result = await db.purchaseOrder.update({
          where: { id: payload.poId },
          data: {
            approvalSteps: newSteps,
            currentApprovalStep: nextStep,
            deliveryStatus: newStatus,
            approvedBy: payload.status === 'Approved' && payload.stepIndex === newSteps.length - 1 ? session.name : po.approvedBy,
            approvedAt: payload.status === 'Approved' && payload.stepIndex === newSteps.length - 1 ? new Date().toISOString() : po.approvedAt,
          },
        });

        await logAudit(
          'PO',
          payload.poId,
          payload.status === 'Approved' ? 'Approve' : 'Reject',
          `${payload.status} step ${payload.stepIndex + 1} of approval chain. ${payload.comments || ''}`
        );
        break;
      }

      case 'PERFORM_MATCH': {
        result = await runThreeWayMatch(payload.poId, payload.invoiceId);
        break;
      }

      // ── Documents ────────────────────────────────────────────
      case 'ADD_DOCUMENT': {
        result = await db.appDocument.create({ data: payload });
        break;
      }
      case 'UPLOAD_NEW_DOC_VERSION': {
        await db.appDocument.update({
          where: { id: payload.originalId },
          data: { supersededBy: payload.newDoc.id },
        });
        result = await db.appDocument.create({ data: payload.newDoc });
        break;
      }

      // ── Audit Logs ───────────────────────────────────────────
      case 'LOG_AUDIT': {
        result = await db.auditLogEntry.create({
          data: {
            timestamp: new Date().toISOString(),
            actorId: session.userId,
            actorName: session.name,
            entityType: payload.entityType,
            entityId: payload.entityId,
            action: payload.action,
            description: payload.description || '',
            changeSet: payload.changeSet || null,
          },
        });
        break;
      }

      default: {
        return NextResponse.json({ error: `Unknown mutation action: ${action}` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Mutation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
