import { NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/dbManager';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = getAuthSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getTenantDb(session.tenantId);

    // ── Just-in-Time Background Alert Scanner ──
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. PO Overdue Delivery (PO-02)
      const overduePOs = await db.purchaseOrder.findMany({
        where: {
          deliveryStatus: { notIn: ['Delivered', 'Cancelled'] },
          eta: { not: '' }
        }
      });
      for (const po of overduePOs) {
        if (todayStr > po.eta) {
          const title = 'PO Overdue Delivery';
          const exists = await db.appNotification.findFirst({ where: { title, entityId: po.id } });
          if (!exists) {
            const rule = await db.notificationRule.findFirst({ where: { eventType: 'po_alert' } });
            if (!rule || rule.enabled) {
              await db.appNotification.create({
                data: {
                  type: 'warning',
                  source: 'PO',
                  title,
                  message: `PO #${po.id} is overdue. Promised ETA was ${po.eta}.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  entityId: po.id,
                  entityType: 'PO'
                }
              });
            }
          }
        }
      }

      // 2. Critical Stockout (STK-01) & Low Stock (STK-02)
      const stockItems = await db.stockItem.findMany();
      for (const item of stockItems) {
        const rule = await db.notificationRule.findFirst({ where: { eventType: 'inventory_alert' } });
        if (rule && !rule.enabled) continue;

        if (item.currentStock === 0) {
          const title = 'Critical Stockout (Zero)';
          const exists = await db.appNotification.findFirst({ where: { title, entityId: item.itemId } });
          if (!exists) {
            await db.appNotification.create({
              data: {
                type: 'alert',
                source: 'GRN',
                title,
                message: `CRITICAL: ${item.itemName} (SKU: ${item.itemId}) is OUT OF STOCK.`,
                timestamp: new Date().toISOString(),
                read: false,
                entityId: item.itemId,
                entityType: 'Item'
              }
            });
          }
        } else if (item.currentStock <= item.reorderPoint) {
          const title = 'Stock Below Reorder Point';
          const exists = await db.appNotification.findFirst({ where: { title, entityId: item.itemId } });
          if (!exists) {
            await db.appNotification.create({
              data: {
                type: 'warning',
                source: 'GRN',
                title,
                message: `Low Stock Warning: ${item.itemName} stock (${item.currentStock}) has fallen below reorder level (${item.reorderPoint}).`,
                timestamp: new Date().toISOString(),
                read: false,
                entityId: item.itemId,
                entityType: 'Item'
              }
            });
          }
        }
      }

      // 3. Budget Overrun (BGT-01) & Budget Warning (BGT-02)
      const budgets = await db.budgetEnvelope.findMany();
      for (const bgt of budgets) {
        const rule = await db.notificationRule.findFirst({ where: { eventType: 'budget_alert' } });
        if (rule && !rule.enabled) continue;

        const totalUtilized = bgt.committedAmount + bgt.spentAmount;
        if (totalUtilized >= bgt.totalAmount) {
          const title = 'Budget Over-Budget (100%+)';
          const exists = await db.appNotification.findFirst({ where: { title, entityId: bgt.id } });
          if (!exists) {
            const utilPct = bgt.totalAmount > 0 ? Math.round((totalUtilized / bgt.totalAmount) * 100) : 100;
            await db.appNotification.create({
              data: {
                type: 'alert',
                source: 'Payment',
                title,
                message: `Budget Exceeded: Envelope '${bgt.name}' is at ${utilPct}% utilization.`,
                timestamp: new Date().toISOString(),
                read: false,
                entityId: bgt.id,
                entityType: 'Budget'
              }
            });
          }
        } else if (totalUtilized >= bgt.totalAmount * 0.8) {
          const title = 'Budget Warning (>80%)';
          const exists = await db.appNotification.findFirst({ where: { title, entityId: bgt.id } });
          if (!exists) {
            const utilPct = bgt.totalAmount > 0 ? Math.round((totalUtilized / bgt.totalAmount) * 100) : 80;
            await db.appNotification.create({
              data: {
                type: 'warning',
                source: 'Payment',
                title,
                message: `Budget Alert: Envelope '${bgt.name}' has reached ${utilPct}% of allocated funds.`,
                timestamp: new Date().toISOString(),
                read: false,
                entityId: bgt.id,
                entityType: 'Budget'
              }
            });
          }
        }
      }

      // 4. Contract Expiring Soon (CON-01)
      const contracts = await db.contract.findMany();
      for (const con of contracts) {
        if (con.endDate) {
          const end = new Date(con.endDate);
          const diffDays = Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0 && diffDays <= (con.renewalWindowDays || 30)) {
            const title = 'Contract Expiring Soon';
            const exists = await db.appNotification.findFirst({ where: { title, entityId: con.id } });
            if (!exists) {
              const rule = await db.notificationRule.findFirst({ where: { eventType: 'contract_alert' } });
              if (!rule || rule.enabled) {
                await db.appNotification.create({
                  data: {
                    type: 'warning',
                    source: 'Document',
                    title,
                    message: `Contract '${con.title}' with ${con.supplierName || 'Supplier'} expires in ${diffDays} days (${con.endDate}).`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    entityId: con.id,
                    entityType: 'Contract'
                  }
                });
              }
            }
          }
        }
      }

      // 5. Blanket PO Ceiling Warning (CON-02)
      const blankets = await db.blanketPO.findMany();
      for (const bl of blankets) {
        if (bl.totalCeiling > 0) {
          const util = bl.consumedAmount / bl.totalCeiling;
          if (util >= 0.85) {
            const title = 'Blanket Ceiling (>85%)';
            const exists = await db.appNotification.findFirst({ where: { title, entityId: bl.id } });
            if (!exists) {
              const rule = await db.notificationRule.findFirst({ where: { eventType: 'contract_alert' } });
              if (!rule || rule.enabled) {
                const utilPct = Math.round(util * 100);
                await db.appNotification.create({
                  data: {
                    type: 'warning',
                    source: 'PO',
                    title,
                    message: `Blanket PO #${bl.id} (${bl.supplierName || 'Supplier'}) has consumed ${utilPct}% of its $${bl.totalCeiling.toLocaleString()} ceiling.`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    entityId: bl.id,
                    entityType: 'BlanketPO'
                  }
                });
              }
            }
          }
        }
      }

      // 6. Compliance Document Expired / Expiring (SUP-02)
      const cdocs = await db.complianceDocument.findMany();
      for (const doc of cdocs) {
        if (doc.expiryDate) {
          const exp = new Date(doc.expiryDate);
          const diffDays = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 30) {
            const title = diffDays <= 0 ? 'Compliance Document Expired' : 'Compliance Document Expiring Soon';
            const exists = await db.appNotification.findFirst({ where: { title, entityId: doc.id } });
            if (!exists) {
              const rule = await db.notificationRule.findFirst({ where: { eventType: 'supplier_alert' } });
              if (!rule || rule.enabled) {
                const supplier = await db.supplier.findUnique({ where: { id: doc.supplierId } });
                const supName = supplier?.name || `Supplier ${doc.supplierId}`;
                const type = diffDays <= 0 ? 'alert' : 'warning';
                const msg = diffDays <= 0 
                  ? `Compliance Alert: '${doc.title}' for ${supName} EXPIRED on ${doc.expiryDate}.`
                  : `Compliance Alert: '${doc.title}' for ${supName} will expire in ${diffDays} days (${doc.expiryDate}).`;
                await db.appNotification.create({
                  data: {
                    type,
                    source: 'Supplier',
                    title,
                    message: msg,
                    timestamp: new Date().toISOString(),
                    read: false,
                    entityId: doc.id,
                    entityType: 'ComplianceDoc'
                  }
                });
              }
            }
          }
        }
      }

      // 7. Asset Maintenance Due (AST-01)
      const assets = await db.asset.findMany();
      for (const ast of assets) {
        if (ast.status === 'Under Maintenance') {
          const title = 'Maintenance Due';
          const exists = await db.appNotification.findFirst({ where: { title, entityId: ast.id } });
          if (!exists) {
            const rule = await db.notificationRule.findFirst({ where: { eventType: 'asset_alert' } });
            if (!rule || rule.enabled) {
              await db.appNotification.create({
                data: {
                  type: 'info',
                  source: 'Document',
                  title,
                  message: `Scheduled maintenance due for asset '${ast.name}' (${ast.location || 'Main Site'}).`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  entityId: ast.id,
                  entityType: 'Asset'
                }
              });
            }
          }
        }
      }

    } catch (scannerErr) {
      console.error('Background alert scanner failed:', scannerErr);
    }

    // Fetch all collections in parallel from the tenant-specific SQLite database
    const [
      users,
      suppliers,
      items,
      purchaseOrders,
      documents,
      rfqs,
      quotations,
      stockItems,
      stockMovements,
      grns,
      assets,
      budgets,
      contracts,
      invoices,
      blanketPOs,
      notifications,
      auditLogs,
      complianceDocs,
      disputes,
      products,
      negotiationMessages,
      poMessages,
      notificationRules,
      poAmendmentRequests,
      dbAssetCategories,
      dbFxRates,
      companyProfile,
    ] = await Promise.all([
      db.user.findMany(),
      db.supplier.findMany(),
      db.item.findMany(),
      db.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' } }),
      db.appDocument.findMany(),
      db.rFQ.findMany({ orderBy: { createdAt: 'desc' } }),
      db.quotation.findMany({ orderBy: { createdAt: 'desc' } }),
      db.stockItem.findMany(),
      db.stockMovement.findMany({ orderBy: { createdAt: 'desc' } }),
      db.gRN.findMany({ orderBy: { createdAt: 'desc' } }),
      db.asset.findMany({ orderBy: { createdAt: 'desc' } }),
      db.budgetEnvelope.findMany(),
      db.contract.findMany(),
      db.invoice.findMany({ orderBy: { createdAt: 'desc' } }),
      db.blanketPO.findMany(),
      db.appNotification.findMany({ orderBy: { createdAt: 'desc' } }),
      db.auditLogEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
      db.complianceDocument.findMany(),
      db.gRNDispute.findMany({ orderBy: { createdAt: 'desc' } }),
      db.productLibraryItem.findMany(),
      db.negotiationMessage.findMany({ orderBy: { createdAt: 'asc' } }),
      db.pOMessage.findMany({ orderBy: { createdAt: 'asc' } }),
      db.notificationRule.findMany(),
      db.pOAmendmentRequest.findMany({ orderBy: { createdAt: 'desc' } }),
      db.assetCategory.findMany(),
      db.fXRate.findMany(),
      db.companyProfile.findFirst(),
    ]);

    // Map asset categories to string array
    const assetCategories = dbAssetCategories.map(c => c.name);
    // Convert FX rates array to Record<string, number>
    const fxRates = dbFxRates.reduce((acc, curr) => ({ ...acc, [curr.currency]: curr.rate }), {});

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        avatarInitials: u.avatarInitials,
        active: u.active
      })),
      suppliers,
      items,
      purchaseOrders,
      documents,
      rfqs,
      quotations,
      stockItems,
      stockMovements,
      grns,
      assets,
      budgets,
      contracts,
      invoices,
      blanketPOs,
      notifications,
      auditLogs,
      complianceDocs,
      disputes,
      products,
      negotiationMessages,
      poMessages,
      notificationRules,
      poAmendmentRequests,
      assetCategories,
      fxRates,
      companyProfile,
    });
  } catch (error) {
    console.error('Failed to fetch tenant initial data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
