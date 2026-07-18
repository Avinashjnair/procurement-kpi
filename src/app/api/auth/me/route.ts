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

    if (session.type === 'user') {
      const user = await db.user.findUnique({
        where: { id: session.userId },
      });

      if (!user || !user.active) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json({
        type: 'user',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatarInitials: user.avatarInitials,
        },
      });
    } else {
      const supplier = await db.supplier.findUnique({
        where: { id: session.userId },
      });

      if (!supplier || !supplier.active) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json({
        type: 'supplier',
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          contactPerson: supplier.contactPerson,
          location: supplier.location,
        },
      });
    }
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
