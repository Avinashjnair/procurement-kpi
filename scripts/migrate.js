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

    db.close();
  } catch (err) {
    console.error('Failed to open/migrate database:', file, err.message);
  }
});
console.log('All migrations completed successfully.');
