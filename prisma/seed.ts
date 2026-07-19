import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '..', 'databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Function to seed a single SQLite database file
async function seedDatabase(dbFilePath: string) {
  console.log(`Seeding clean database: ${dbFilePath}`);

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
    await prisma.companyProfile.deleteMany({});

    // 2. Hash user passwords and insert admin user
    await prisma.user.create({
      data: {
        id: 'USR-001',
        name: 'Admin Manager',
        email: 'admin@veltrixlabs.in',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'manager',
        department: 'Procurement Management',
        avatarInitials: 'VT',
        active: true,
      },
    });
    console.log(`- Seeded admin user`);

    // 3. Seed Supplier
    await prisma.supplier.create({
      data: {
        id: 'SUP-001',
        name: 'Veltrix Test Vendor',
        contactPerson: 'Vendor Manager',
        email: 'vendor@veltrixlabs.in',
        phone: '+971 4 555 9999',
        location: 'Dubai, UAE',
        address: 'Industrial Zone 1, Dubai, UAE',
        taxRegNumber: 'TRN-999999999999999',
        kpis: { priceVariation: 0, deliveryPerformance: 100, paymentTerms: 'Net 30', onTimePayment: 100, responseTime: 1, deliveryTerms: 'DDP', rejectionRate: 0 },
        preferred: true,
        passwordHash: bcrypt.hashSync('vendor123', 10),
        active: true,
        logo: '',
        status: 'Active',
      },
    });
    console.log(`- Seeded test supplier`);

    // 4. Seed Config/Static Data (FX rates and Asset Categories)
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
      { id: 'ac-1', name: 'Machinery' },
      { id: 'ac-2', name: 'IT Hardware' },
      { id: 'ac-3', name: 'Office Furniture' },
    ];
    for (const ac of initialAssetCategories) {
      await prisma.assetCategory.create({ data: ac });
    }

    // 5. Seed Company Profile (Enterprise subscription)
    await prisma.companyProfile.create({
      data: {
        id: 'company-profile-1',
        name: 'Veltrix Test Client',
        address: 'Veltrix Head Office, Dubai, UAE',
        email: 'procurement@veltrixlabs.in',
        phone: '+971 4 555 0000',
        taxRegNumber: 'TRN-111111111111111',
        logoUrl: '',
        currency: 'USD',
        country: 'UAE',
        subscriptionTier: 'enterprise',
      },
    });
    console.log('- Seeded company profile');

    // 6. Seed a few clean catalog items for immediate testing
    await prisma.item.create({
      data: {
        id: 'ITM-001',
        name: 'Seamless Carbon Steel Pipe',
        category: 'Piping',
        description: 'High-pressure seamless carbon steel pipe for industrial use.',
        unit: 'Meter',
        currentPrice: 85.50,
        benchmarkPrice: 90.00,
        linkedSupplierIds: ['SUP-001'],
        priceHistory: [{ date: '2026-07', price: 85.50, supplierId: 'SUP-001' }],
        purchaseHistory: [],
      },
    });
    await prisma.item.create({
      data: {
        id: 'ITM-002',
        name: 'Industrial Gate Valve',
        category: 'Valves',
        description: 'API 600 compliant heavy-duty gate valve.',
        unit: 'Piece',
        currentPrice: 320.00,
        benchmarkPrice: 340.00,
        linkedSupplierIds: ['SUP-001'],
        priceHistory: [{ date: '2026-07', price: 320.00, supplierId: 'SUP-001' }],
        purchaseHistory: [],
      },
    });
    console.log('- Seeded 2 base test items');

  } catch (error) {
    console.error(`Error seeding database ${dbFilePath}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const defaultPath = path.join(dbDir, 'company_default.db');
  
  // 1. Seed the default template database
  await seedDatabase(defaultPath);

  // 2. Clone the template database for the clean veltrix database
  const veltrixPath = path.join(dbDir, 'company_veltrix.db');
  console.log(`Cloning default template to veltrix database: ${veltrixPath}`);
  fs.copyFileSync(defaultPath, veltrixPath);

  console.log('Seeding completed successfully!');
}

main().catch(console.error);
