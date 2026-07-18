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
