import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import fs from 'fs';
import path from 'path';

// Connection cache
const clientCache: Record<string, PrismaClient> = {};

// Ensure databases directory exists
const dbDir = path.join(process.cwd(), 'databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

/**
 * Returns a Prisma client connected to the specific tenant's SQLite database file.
 * Automatically copies the template/default DB if a new tenant is requested.
 */
export function getTenantDb(tenantId: string): PrismaClient {
  // Sanitize tenantId (only alphanumeric, dashes, and underscores)
  const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  
  if (!safeTenantId) {
    throw new Error('Invalid or empty tenant ID');
  }

  // If already cached, return it
  if (clientCache[safeTenantId]) {
    return clientCache[safeTenantId];
  }

  const dbPath = path.join(dbDir, `company_${safeTenantId}.db`);
  const templatePath = path.join(dbDir, 'company_default.db');

  // If the tenant database file doesn't exist, try to clone from the default/template DB
  if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(templatePath)) {
      try {
        fs.copyFileSync(templatePath, dbPath);
      } catch (err) {
        console.error(`Failed to copy template to ${dbPath}:`, err);
      }
    } else {
      console.warn(`Template database not found at ${templatePath}. Creating a fresh empty SQLite database at ${dbPath}`);
    }
  }

  // Create new PrismaClient instance using the better-sqlite3 adapter (url config)
  const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
  });
  const client = new PrismaClient({ adapter });

  // Store in cache
  clientCache[safeTenantId] = client;
  return client;
}

/**
 * Clean up database connections (useful for testing or hot-reload environments)
 */
export async function disconnectAll() {
  const promises = Object.values(clientCache).map(client => client.$disconnect());
  await Promise.all(promises);
  // Clear cache keys
  for (const key in clientCache) {
    delete clientCache[key];
  }
}
