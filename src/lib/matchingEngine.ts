import { PrismaClient } from '@prisma/client';

export interface VarianceReport {
  itemId: string;
  itemName: string;
  type: 'Quantity' | 'Price' | 'Missing Item';
  message: string;
}

export async function runThreeWayMatch(db: any, poId: string, invoiceId?: string) {
  try {
    const po = await db.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) return 'Missing PO';

    // 1. Fetch all approved GRNs for this PO to build cumulative delivered quantities
    const grns = await db.gRN.findMany({
      where: { poId, status: 'Approved' }
    });

    const deliveredMap = new Map<string, number>();
    for (const grn of grns) {
      const lineItems = Array.isArray(grn.lineItems) ? grn.lineItems : [];
      for (const line of lineItems as any[]) {
        const cur = deliveredMap.get(line.itemId) || 0;
        deliveredMap.set(line.itemId, cur + (line.acceptedQty || 0));
      }
    }

    // 2. Fetch all invoices to determine prior billing ledger states
    const allInvoices = await db.invoice.findMany({ where: { poId } });
    const invoicesToMatch = invoiceId
      ? allInvoices.filter((i: any) => i.id === invoiceId)
      : allInvoices;

    if (allInvoices.length === 0) {
      const matchStatus = grns.length > 0 ? 'Pending' : 'Missing GRN';
      await db.purchaseOrder.update({ where: { id: poId }, data: { matchStatus } });
      return matchStatus;
    }

    const poItems = Array.isArray(po.items) ? JSON.parse(JSON.stringify(po.items)) : [];
    
    // We will re-build the PO billed quantities from scratch for matched invoices
    const poBilledMap = new Map<string, number>();

    // Sort invoices: process previously matched ones first, then process the current active matching ones
    const sortedInvoices = [...allInvoices].sort((a: any, b: any) => {
      if (a.matchStatus === 'Full Match' && b.matchStatus !== 'Full Match') return -1;
      if (a.matchStatus !== 'Full Match' && b.matchStatus === 'Full Match') return 1;
      return 0;
    });

    let lastStatus = 'Pending';

    for (const invoice of sortedInvoices) {
      const isEvaluating = !invoiceId || invoicesToMatch.some((i: any) => i.id === invoice.id);
      
      const invItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
      const variances: VarianceReport[] = [];

      for (const invItem of invItems as any[]) {
        const poItem = poItems.find((p: any) => p.itemId === invItem.itemId);
        if (!poItem) {
          variances.push({
            itemId: invItem.itemId,
            itemName: invItem.itemName || 'Unknown',
            type: 'Missing Item',
            message: `Item ${invItem.itemId} does not exist on PO #${poId}.`
          });
          continue;
        }

        // Cumulative check
        const totalDelivered = deliveredMap.get(invItem.itemId) || 0;
        const alreadyBilled = poBilledMap.get(invItem.itemId) || 0;
        const allowedToBill = Math.max(0, totalDelivered - alreadyBilled);

        // Price Check
        if (invItem.unitPrice !== poItem.unitPrice) {
          variances.push({
            itemId: invItem.itemId,
            itemName: poItem.itemName,
            type: 'Price',
            message: `Price mismatch: billed $${invItem.unitPrice.toFixed(2)} but PO is $${poItem.unitPrice.toFixed(2)}.`
          });
        }

        // Quantity Check
        if (invItem.billedQty > allowedToBill) {
          variances.push({
            itemId: invItem.itemId,
            itemName: poItem.itemName,
            type: 'Quantity',
            message: `Quantity mismatch: billed ${invItem.billedQty} units but only ${allowedToBill} units are open to bill (Delivered: ${totalDelivered}, Previously Billed: ${alreadyBilled}).`
          });
        }
      }

      const matchStatus = variances.length === 0 ? 'Full Match' : 'Variance';
      const matchReport = variances.length > 0 ? JSON.stringify(variances) : '';

      // If evaluating (in the filter queue), we update its status in DB
      if (isEvaluating) {
        lastStatus = matchStatus;
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            matchStatus,
            status: matchStatus === 'Full Match' ? 'Matched' : 'Variance',
            matchReport
          }
        });
      }

      // If this invoice is a Full Match, count its quantities towards the PO billing ledger
      if (matchStatus === 'Full Match') {
        for (const invItem of invItems as any[]) {
          const cur = poBilledMap.get(invItem.itemId) || 0;
          poBilledMap.set(invItem.itemId, cur + invItem.billedQty);
        }
      }
    }

    // 3. Update PO items JSON with the finalized cumulative billed quantities
    for (const poItem of poItems) {
      poItem.billedQty = poBilledMap.get(poItem.itemId) || 0;
    }

    // 4. Determine overall PO-level match status
    const finalizedInvoices = await db.invoice.findMany({ where: { poId } });
    const statuses = finalizedInvoices.map((i: any) => i.matchStatus);
    
    let poMatchStatus = 'Pending';
    if (statuses.length > 0) {
      if (statuses.includes('Variance')) {
        poMatchStatus = 'Variance';
      } else if (statuses.includes('Missing GRN')) {
        poMatchStatus = 'Missing GRN';
      } else if (statuses.includes('Pending')) {
        poMatchStatus = 'Pending';
      } else {
        poMatchStatus = 'Full Match';
      }
    }

    await db.purchaseOrder.update({
      where: { id: poId },
      data: {
        items: poItems,
        matchStatus: poMatchStatus
      }
    });

    return invoiceId ? lastStatus : poMatchStatus;
  } catch (err) {
    console.error('Cumulative 3-way match calculation failed:', err);
    return 'Pending';
  }
}
