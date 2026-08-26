const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbDir = path.join(__dirname, '..', 'databases');

console.log('Target database directory for migrations:', dbDir);

if (!fs.existsSync(dbDir)) {
  console.log('Databases directory does not exist yet. Skipping migrations.');
  process.exit(0);
}

const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.db'));
files.forEach(file => {
  const dbPath = path.join(dbDir, file);
  console.log('Migrating database schema for:', file);
  try {
    const db = new Database(dbPath);
    
    // Migrate BlanketPO
    try {
      db.prepare('ALTER TABLE BlanketPO ADD COLUMN description TEXT DEFAULT ""').run();
      console.log('  - Added description to BlanketPO');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        // Expected if already migrated
      } else {
        console.error('  - Error migrating BlanketPO:', e.message);
      }
    }

    // Migrate Contract
    try {
      db.prepare('ALTER TABLE Contract ADD COLUMN linkedBlanketPoId TEXT DEFAULT ""').run();
      console.log('  - Added linkedBlanketPoId to Contract');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        // Expected
      } else {
        console.error('  - Error migrating Contract (linkedBlanketPoId):', e.message);
      }
    }

    try {
      db.prepare('ALTER TABLE Contract ADD COLUMN description TEXT DEFAULT ""').run();
      console.log('  - Added description to Contract');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        // Expected
      } else {
        console.error('  - Error migrating Contract (description):', e.message);
      }
    }

    // Migrate PurchaseOrder
    const poColumns = [
      { name: 'acknowledgedAt', type: 'TEXT DEFAULT ""' },
      { name: 'acknowledgedBy', type: 'TEXT DEFAULT ""' },
      { name: 'acknowledgementStatus', type: 'TEXT DEFAULT ""' },
      { name: 'acknowledgedDeliveryDate', type: 'TEXT DEFAULT ""' },
      { name: 'acknowledgementNotes', type: 'TEXT DEFAULT ""' },
      { name: 'trackingNumber', type: 'TEXT DEFAULT ""' },
      { name: 'carrier', type: 'TEXT DEFAULT ""' },
      { name: 'shippedAt', type: 'TEXT DEFAULT ""' },
      { name: 'shipmentEta', type: 'TEXT DEFAULT ""' },
      { name: 'amendmentRequest', type: 'TEXT DEFAULT NULL' }
    ];

    poColumns.forEach(col => {
      try {
        db.prepare(`ALTER TABLE PurchaseOrder ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`  - Added ${col.name} to PurchaseOrder`);
      } catch (e) {
        if (e.message.includes('duplicate column name')) {
          // Expected
        } else {
          console.error(`  - Error migrating PurchaseOrder (${col.name}):`, e.message);
        }
      }
    });

    // Migrate Quotation
    const quotColumns = [
      { name: 'quotationFileName', type: 'TEXT DEFAULT ""' },
      { name: 'quotationFileSize', type: 'TEXT DEFAULT ""' }
    ];

    quotColumns.forEach(col => {
      try {
        db.prepare(`ALTER TABLE Quotation ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`  - Added ${col.name} to Quotation`);
      } catch (e) {
        if (e.message.includes('duplicate column name')) {
          // Expected
        } else {
          console.error(`  - Error migrating Quotation (${col.name}):`, e.message);
        }
      }
    });

    // Migrate Invoice
    const invColumns = [
      { name: 'grnId', type: 'TEXT DEFAULT ""' },
      { name: 'expectedPaymentDate', type: 'TEXT DEFAULT ""' },
      { name: 'invoiceFileName', type: 'TEXT DEFAULT ""' }
    ];

    invColumns.forEach(col => {
      try {
        db.prepare(`ALTER TABLE Invoice ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`  - Added ${col.name} to Invoice`);
      } catch (e) {
        if (e.message.includes('duplicate column name')) {
          // Expected
        } else {
          console.error(`  - Error migrating Invoice (${col.name}):`, e.message);
        }
      }
    });

    // Migrate AppNotification Action Columns
    const appNotifCols = [
      { name: 'actionType', type: 'TEXT DEFAULT ""' },
      { name: 'actionPayload', type: 'TEXT DEFAULT NULL' } // In SQLite, JSONB is stored as TEXT/JSON
    ];
    appNotifCols.forEach(col => {
      try {
        db.prepare(`ALTER TABLE AppNotification ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`  - Added ${col.name} to AppNotification`);
      } catch (e) {
        if (e.message.includes('duplicate column name')) {
          // Expected
        } else {
          console.error(`  - Error migrating AppNotification (${col.name}):`, e.message);
        }
      }
    });

    // Migrate UserNotification Table
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS "UserNotification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "notificationId" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL DEFAULT 0,
          "readAt" DATETIME,
          "actionState" TEXT NOT NULL DEFAULT 'PENDING',
          "actionResult" TEXT DEFAULT '',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      db.prepare(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UserNotification_userId_notificationId_key" ON "UserNotification"("userId", "notificationId")
      `).run();
      console.log('  - Created UserNotification table and indexes');

      // Seed UserNotification entries for existing notifications so they remain visible to existing users (default 'admin' and 'supplier')
      const existingNotifs = db.prepare('SELECT id, read FROM AppNotification').all();
      const insertUserNotif = db.prepare(`
        INSERT OR IGNORE INTO UserNotification (id, userId, notificationId, isRead, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      existingNotifs.forEach(notif => {
        const isReadVal = notif.read ? 1 : 0;
        // Seed for default user 'admin' (Veltrix Manager/Admin)
        insertUserNotif.run(`${notif.id}_admin`, 'admin', notif.id, isReadVal);
      });
    } catch (e) {
      console.error('  - Error creating UserNotification table:', e.message);
    }

    db.close();
  } catch (err) {
    console.error('Failed to open/migrate database:', file, err.message);
  }
});
console.log('All migrations completed successfully.');
