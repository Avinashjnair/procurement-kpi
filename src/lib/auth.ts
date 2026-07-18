import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-procureiq-stealth-key';
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || '28800'); // 8 hours in seconds

export interface TokenPayload {
  userId: string;
  name: string;
  role: string | null; // null for suppliers
  type: 'user' | 'supplier';
  supplierId: string | null;
  tenantId: string;
}

/**
 * Signs a JWT token containing tenant and user context.
 */
export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verifies a JWT token. Returns payload or throws an error.
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Dynamic tenant resolution helper.
 * Reads the tenant ID from the x-tenant-id header OR parses it from a valid JWT.
 * Defaults to 'default' if no tenant is provided.
 */
export function getTenantIdFromRequest(req: Request | NextRequest): string {
  // 1. Try header
  const headerTenant = req.headers.get('x-tenant-id');
  if (headerTenant) {
    return headerTenant.toLowerCase().trim();
  }

  // 2. Try JWT Auth token header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.tenantId) {
        return decoded.tenantId.toLowerCase().trim();
      }
    } catch (e) {
      // Ignore token verification errors here; let the route handle it
    }
  }

  return 'default';
}

/**
 * Authenticates a request. Returns the decoded token payload or null if unauthorized.
 */
export function getAuthSession(req: Request | NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}
