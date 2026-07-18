import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Relative imports from source data files
import { items, suppliers, purchaseOrders, documents } from '../src/data/mockData';
import { users, rfqs, quotations, stockItems, stockMovements, grns, assets, assetCategories } from '../src/data/extendedMockData';
import { initialBudgets, initialContracts, initialInvoices, initialBlankets, initialComplianceDocs, initialDisputes } from '../src/data/roadmapMockData';

const dbDir = path.join(__dirname, '..', 'databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Function to seed a single SQLite database file
async function seedDatabase(dbFilePath: string) {
  console.log(`Seeding database: ${dbFilePath}`);

  const adapter = new PrismaBetterSqlite3({
    url: `file:${dbFilePath}`,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Delete all existing data in reverse order of dependencies
    await prisma.negotiationMessage.deleteMany({});
    await prisma.pOMessage.deleteMany({});
    await prisma.pOAmendmentRequest.deleteMany({});
    await prisma.auditLogEntry.deleteMany({});
    await prisma.appNotification.deleteMany({});
    await prisma.notificationRule.deleteMany({});
    await prisma.complianceDocument.deleteMany({});
    await prisma.appDocument.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.assetCategory.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.budgetEnvelope.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.gRNDispute.deleteMany({});
    await prisma.gRN.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.stockItem.deleteMany({});
    await prisma.blanketPO.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQ.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.item.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.fXRate.deleteMany({});
    await prisma.productLibraryItem.deleteMany({});

    // 2. Hash user passwords and insert users
    const hashedUsers = users.map(u => ({
      ...u,
      passwordHash: bcrypt.hashSync(u.passwordHash, 10),
    }));
    for (const u of hashedUsers) {
      await prisma.user.create({ data: u });
    }
    console.log(`- Seeded ${users.length} users`);

    // 3. Seed Suppliers
    for (const s of suppliers) {
      await prisma.supplier.create({
        data: {
          id: s.id,
          name: s.name,
          contactPerson: s.contactPerson,
          email: s.email,
          phone: s.phone,
          location: s.location,
          address: s.address,
          taxRegNumber: s.taxRegNumber,
          kpis: s.kpis as any,
          preferred: s.preferred ?? false,
          notes: (s.notes || []) as any,
          kpiHistory: (s.kpiHistory || []) as any,
          contactList: (s.contactList || []) as any,
          bankInfo: (s.bankInfo || {}) as any,
          preferredStatusCriteria: (s.preferredStatusCriteria || []) as any,
          passwordHash: s.passwordHash ? bcrypt.hashSync(s.passwordHash, 10) : bcrypt.hashSync('supplier123', 10),
          active: s.active ?? true,
          logo: s.logo ?? '',
          status: s.status || 'Active',
          financials: (s.financials || []) as any,
          projectExperienceDocs: (s.projectExperienceDocs || []) as any,
          projectHistory: (s.projectHistory || []) as any,
        },
      });
    }
    console.log(`- Seeded ${suppliers.length} suppliers`);

    // Seed Config/Static Data (FX rates and Asset Categories) even in minimal seed
    const initialFXRates = [
      { id: 'fx-usd', currency: 'USD', rate: 3.67 },
      { id: 'fx-eur', currency: 'EUR', rate: 3.95 },
      { id: 'fx-gbp', currency: 'GBP', rate: 4.65 },
      { id: 'fx-aed', currency: 'AED', rate: 1.0 },
    ];
    for (const r of initialFXRates) {
      await prisma.fXRate.create({ data: r });
    }
    
    const initialAssetCategories = [
      { id: 'ac-1', name: 'Machinery', code: 'MACH', depreciationRate: 10 },
      { id: 'ac-2', name: 'IT Hardware', code: 'IT', depreciationRate: 33 },
      { id: 'ac-3', name: 'Office Furniture', code: 'FURN', depreciationRate: 15 },
    ];
    for (const ac of initialAssetCategories) {
      await prisma.assetCategory.create({ data: ac });
    }

    if (process.env.SEED_ONLY_LOGINS === 'true') {
      console.log('Skipping operational and transactional tables (seeded logins + config only).');
      return;
    }

    // 4. Seed Items
    for (const item of items) {
      await prisma.item.create({
        data: {
          id: item.id,
          name: item.name,
          category: item.category,
          description: item.description,
          unit: item.unit,
          currentPrice: item.currentPrice,
          benchmarkPrice: item.benchmarkPrice ?? 0.0,
          linkedSupplierIds: item.linkedSupplierIds as any,
          priceHistory: item.priceHistory as any,
          purchaseHistory: item.purchaseHistory as any,
          serviceDetails: (item.serviceDetails || {}) as any,
          archived: item.archived ?? false,
        },
      });
    }
    console.log(`- Seeded ${items.length} items`);

    // 5. Seed Purchase Orders
    for (const po of purchaseOrders) {
      await prisma.purchaseOrder.create({
        data: {
          id: po.id,
          dateOfIssue: po.dateOfIssue,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          items: po.items as any,
          totalAmount: po.totalAmount,
          totalAmountBase: po.totalAmountBase ?? (po.totalAmount * (po.fxRate || 1.0)),
          currency: po.currency || 'USD',
          fxRate: po.fxRate || 1.0,
          paymentTerms: po.paymentTerms,
          amountPaid: po.amountPaid || 0.0,
          dateOfPayment: po.dateOfPayment ?? '',
          dueDate: po.dueDate,
          deliveryStatus: po.deliveryStatus,
          paymentStatus: po.paymentStatus,
          eta: po.eta,
          incoterms: po.incoterms,
          remarks: po.remarks ?? '',
          projectReference: po.projectReference ?? '',
          requestNumber: po.requestNumber ?? '',
          approvalAuthority: po.approvalAuthority ?? '',
          cancellationReason: po.cancellationReason ?? '',
          revisionNumber: po.revisionNumber ?? 0,
          approvedBy: po.approvedBy ?? (po.deliveryStatus !== 'Draft' && po.deliveryStatus !== 'Pending' ? 'Aisha Al-Mansoori' : ''),
          approvedAt: po.approvedAt ?? '',
          paymentRecords: (po.paymentRecords || []) as any,
          budgetId: po.budgetId ?? '',
          approvalSteps: (po.approvalSteps || [
            { role: 'manager', status: po.deliveryStatus !== 'Draft' && po.deliveryStatus !== 'Pending' ? 'Approved' : 'Pending' },
            { role: 'finance', status: po.deliveryStatus !== 'Draft' && po.deliveryStatus !== 'Pending' && po.deliveryStatus !== 'Approved' ? 'Approved' : 'Pending' }
          ]) as any,
          currentApprovalStep: po.currentApprovalStep ?? 0,
          matchStatus: po.matchStatus ?? 'Pending',
          savingsAmount: po.savingsAmount ?? 0.0,
          contractId: po.contractId ?? '',
          blanketPoId: po.blanketPoId ?? '',
          acknowledgedAt: po.acknowledgedAt ?? '',
          trackingNumber: po.trackingNumber ?? '',
          carrier: po.carrier ?? '',
          shippedAt: po.shippedAt ?? '',
          amendmentRequest: (po.amendmentRequest || {}) as any,
        },
      });
    }
    console.log(`- Seeded ${purchaseOrders.length} purchase orders`);

    // 6. Seed RFQs
    for (const rfq of rfqs) {
      await prisma.rFQ.create({
        data: {
          id: rfq.id,
          title: rfq.title,
          status: rfq.status,
          createdBy: rfq.createdBy,
          createdByName: rfq.createdByName,
          dateCreated: rfq.dateCreated,
          dateSent: rfq.dateSent ?? '',
          deadlineDate: rfq.deadlineDate,
          projectReference: rfq.projectReference ?? '',
          notes: rfq.notes ?? '',
          lineItems: rfq.lineItems as any,
          invitedSupplierIds: rfq.invitedSupplierIds as any,
          awardedQuotationId: rfq.awardedQuotationId ?? '',
          awardedSupplierId: rfq.awardedSupplierId ?? '',
          awardedSupplierName: rfq.awardedSupplierName ?? '',
          tenderType: rfq.tenderType || 'open',
          evaluationWeights: rfq.evaluationWeights as any,
          bidDeadline: rfq.bidDeadline,
          clarificationDeadline: rfq.clarificationDeadline,
        },
      });
    }
    console.log(`- Seeded ${rfqs.length} RFQs`);

    // 7. Seed Quotations
    for (const q of quotations) {
      await prisma.quotation.create({
        data: {
          id: q.id,
          rfqId: q.rfqId,
          supplierId: q.supplierId,
          supplierName: q.supplierName,
          status: q.status,
          dateReceived: q.dateReceived ?? '',
          validUntil: q.validUntil,
          paymentTerms: q.paymentTerms,
          deliveryTerms: q.deliveryTerms,
          currency: q.currency,
          totalAmount: q.totalAmount,
          lineItems: q.lineItems as any,
          evaluation: (q.evaluation || {}) as any,
          notes: q.notes ?? '',
          feedback: q.feedback ?? '',
          negotiationCount: q.negotiationCount ?? 0,
        },
      });
    }
    console.log(`- Seeded ${quotations.length} quotations`);

    // 8. Seed Blanket POs
    for (const b of initialBlankets) {
      await prisma.blanketPO.create({
        data: {
          id: b.id,
          supplierId: b.supplierId,
          supplierName: b.supplierName,
          totalCeiling: b.totalCeiling,
          consumedAmount: b.consumedAmount,
          validFrom: b.validFrom,
          validTo: b.validTo,
          currency: b.currency,
          status: b.status,
          releaseOrderIds: b.releaseOrderIds as any,
          category: b.category ?? '',
          department: b.department ?? '',
          project: b.project ?? '',
        },
      });
    }
    console.log(`- Seeded ${initialBlankets.length} blanket POs`);

    // 9. Seed Stock Items
    for (const item of stockItems) {
      await prisma.stockItem.create({
        data: {
          id: item.id,
          itemId: item.itemId,
          itemName: item.itemName,
          category: item.category,
          unit: item.unit,
          currentStock: item.currentStock,
          reservedStock: item.reservedStock,
          reorderPoint: item.reorderPoint,
          maxStock: item.maxStock,
          location: item.location,
          lastUpdated: item.lastUpdated,
          lastGRNId: item.lastGRNId ?? '',
        },
      });
    }
    console.log(`- Seeded ${stockItems.length} stock items`);

    // 10. Seed Stock Movements
    for (const m of stockMovements) {
      await prisma.stockMovement.create({
        data: {
          id: m.id,
          stockItemId: m.stockItemId,
          itemId: m.itemId,
          itemName: m.itemName,
          movementType: m.movementType,
          quantity: m.quantity,
          referenceId: m.referenceId,
          date: m.date,
          performedBy: m.performedBy,
          notes: m.notes ?? '',
          balanceAfter: m.balanceAfter,
        },
      });
    }
    console.log(`- Seeded ${stockMovements.length} stock movements`);

    // 11. Seed GRNs
    for (const g of grns) {
      await prisma.gRN.create({
        data: {
          id: g.id,
          poId: g.poId,
          supplierId: g.supplierId,
          supplierName: g.supplierName,
          status: g.status,
          dateCreated: g.dateCreated,
          dateApproved: g.dateApproved ?? '',
          createdBy: g.createdBy,
          approvedBy: g.approvedBy ?? '',
          deliveryNoteNumber: g.deliveryNoteNumber ?? '',
          vehicleNumber: g.vehicleNumber ?? '',
          notes: g.notes ?? '',
          lineItems: g.lineItems as any,
          totalAccepted: g.totalAccepted,
          totalRejected: g.totalRejected,
          stockUpdated: g.stockUpdated,
        },
      });
    }
    console.log(`- Seeded ${grns.length} GRNs`);

    // 12. Seed Disputes
    for (const d of initialDisputes) {
      await prisma.gRNDispute.create({
        data: {
          id: d.id,
          grnId: d.grnId,
          poId: d.poId,
          supplierId: d.supplierId,
          itemId: d.itemId,
          itemName: d.itemName,
          rejectedQty: d.rejectedQty,
          reason: d.reason,
          supportingDocs: (d.supportingDocs || []) as any,
          status: d.status || 'Open',
          timestamp: d.timestamp,
        },
      });
    }
    console.log(`- Seeded ${initialDisputes.length} disputes`);

    // 13. Seed Invoices
    for (const inv of initialInvoices) {
      await prisma.invoice.create({
        data: {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          poId: inv.poId,
          supplierId: inv.supplierId,
          supplierName: inv.supplierName,
          date: inv.date,
          dueDate: inv.dueDate,
          totalAmount: inv.totalAmount,
          currency: inv.currency,
          status: inv.status,
          lineItems: inv.lineItems as any,
          matchStatus: inv.matchStatus,
          notes: inv.notes ?? '',
          expectedPaymentDate: inv.expectedPaymentDate ?? '',
          invoiceFileName: inv.invoiceFileName ?? '',
        },
      });
    }
    console.log(`- Seeded ${initialInvoices.length} invoices`);

    // 14. Seed Budget Envelopes
    for (const b of initialBudgets) {
      await prisma.budgetEnvelope.create({
        data: {
          id: b.id,
          name: b.name,
          department: b.department,
          project: b.project ?? '',
          period: b.period,
          totalAmount: b.totalAmount,
          committedAmount: b.committedAmount,
          spentAmount: b.spentAmount,
          currency: b.currency,
          status: b.status,
        },
      });
    }
    console.log(`- Seeded ${initialBudgets.length} budgets`);

    // 15. Seed Contracts
    for (const c of initialContracts) {
      await prisma.contract.create({
        data: {
          id: c.id,
          title: c.title,
          supplierId: c.supplierId,
          supplierName: c.supplierName,
          startDate: c.startDate,
          endDate: c.endDate,
          totalValue: c.totalValue,
          currency: c.currency,
          status: c.status,
          renewalWindowDays: c.renewalWindowDays,
          linkedPoIds: c.linkedPoIds as any,
          docId: c.docId ?? '',
        },
      });
    }
    console.log(`- Seeded ${initialContracts.length} contracts`);

    // 16. Seed Assets & Categories
    const categoriesSet = new Set(assetCategories);
    for (const catName of categoriesSet) {
      await prisma.assetCategory.create({
        data: { name: catName },
      });
    }

    for (const a of assets) {
      await prisma.asset.create({
        data: {
          id: a.id,
          name: a.name,
          category: a.category,
          supplierId: a.supplierId,
          purchaseDate: a.purchaseDate,
          purchaseValue: a.purchaseValue,
          salvageValue: a.salvageValue,
          depreciationRate: a.depreciationRate,
          usefulLife: a.usefulLife,
          location: a.location,
          serialNumber: a.serialNumber ?? '',
          warrantyExpiry: a.warrantyExpiry ?? '',
          warrantyDetails: a.warrantyDetails ?? '',
          maintenancePlan: a.maintenancePlan,
          maintenanceHistory: a.maintenanceHistory as any,
          status: a.status,
          description: a.description ?? '',
          poId: a.poId ?? '',
        },
      });
    }
    console.log(`- Seeded ${assets.length} assets`);

    // 17. Seed FX Rates
    const defaultRates = [
      { currency: 'USD', rate: 3.67 },
      { currency: 'EUR', rate: 3.95 },
      { currency: 'GBP', rate: 4.65 },
      { currency: 'AED', rate: 1.0 },
    ];
    for (const rate of defaultRates) {
      await prisma.fXRate.create({ data: rate });
    }
    console.log(`- Seeded FX Rates`);

    // 18. Seed App Documents
    for (const doc of documents) {
      await prisma.appDocument.create({
        data: {
          id: doc.id,
          name: doc.name,
          category: doc.category,
          poId: doc.poId,
          itemId: doc.itemId,
          uploadDate: doc.uploadDate,
          fileSize: doc.fileSize,
          fileType: doc.fileType,
          expiryDate: doc.expiryDate ?? '',
          version: doc.version ?? 1,
          supersededBy: doc.supersededBy ?? '',
        },
      });
    }
    console.log(`- Seeded ${documents.length} app documents`);

    // 19. Seed Compliance Documents
    for (const cd of initialComplianceDocs) {
      await prisma.complianceDocument.create({
        data: {
          id: cd.id,
          supplierId: cd.supplierId,
          title: cd.title,
          category: cd.category,
          expiryDate: cd.expiryDate,
          status: cd.status,
          fileName: cd.fileName,
          fileSize: cd.fileSize ?? '',
          uploadedAt: cd.uploadedAt,
        },
      });
    }
    console.log(`- Seeded ${initialComplianceDocs.length} compliance documents`);

    // 20. Seed App Notifications & Rules
    const initialRules = [
      { eventType: 'approval_request', enabled: true, channels: ['in-app'] },
      { eventType: 'overdue_payment', enabled: true, channels: ['in-app', 'email'] },
      { eventType: 'low_stock', enabled: true, threshold: 10.0, channels: ['in-app'] },
    ];
    for (const rule of initialRules) {
      await prisma.notificationRule.create({ data: { ...rule, channels: rule.channels as any } });
    }

    const initialNotifications = [
      { type: 'warning', source: 'PO', title: 'Overdue Payment', message: 'PO-002 payment is overdue by 5 days', timestamp: new Date(Date.now() - 86400000).toISOString(), read: false, entityId: 'PO-002', entityType: 'PO' },
      { type: 'info', source: 'GRN', title: 'GRN Submitted', message: 'GRN-005 has been submitted by Warehouse', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, entityId: 'GRN-005', entityType: 'GRN' }
    ];
    for (const n of initialNotifications) {
      await prisma.appNotification.create({ data: n });
    }
    console.log(`- Seeded notifications`);

    // 21. Seed Product Library
    const initialProducts = [
      { name: 'Seamless Carbon Pipe', sku: 'PIPE-SM-001', category: 'Piping', description: 'High-pressure seamless carbon steel pipe for industrial use.', unit: 'Meter', basePrice: 85.50, currency: 'USD', image: '', technicalDocs: ['CDOC-005'], certifications: ['ASME B16.5'] },
      { name: 'Industrial Gate Valve', sku: 'VALV-GT-04', category: 'Valves', description: 'API 600 compliant heavy-duty gate valve.', unit: 'Piece', basePrice: 320.00, currency: 'USD', image: '', technicalDocs: ['CDOC-006'], certifications: ['API 600', 'ISO 9001'] },
      { name: 'Stainless Steel Flange', sku: 'FLG-SS-08', category: 'Fittings', description: 'Corrosion resistant 316L stainless steel flange.', unit: 'Piece', basePrice: 195.00, currency: 'USD', image: '', technicalDocs: [], certifications: ['ASME B16.5'] }
    ];
    for (const p of initialProducts) {
      await prisma.productLibraryItem.create({ data: { ...p, technicalDocs: p.technicalDocs as any, certifications: p.certifications as any } });
    }
    console.log(`- Seeded product library`);

  } catch (error) {
    console.error(`Error seeding database ${dbFilePath}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const defaultPath = path.join(dbDir, 'company_default.db');
  
  // 1. Seed only the default template database
  await seedDatabase(defaultPath);

  // 2. Clone the template database for the default test tenants
  const tenants = ['steelmax', 'eurochem'];
  for (const tenant of tenants) {
    const tenantPath = path.join(dbDir, `company_${tenant}.db`);
    console.log(`Cloning default template to tenant: ${tenantPath}`);
    fs.copyFileSync(defaultPath, tenantPath);
  }

  console.log('Seeding completed successfully!');
}

main().catch(console.error);
