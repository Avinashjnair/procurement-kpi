import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTenantDb } from '@/lib/dbManager';
import { getTenantIdFromRequest, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { supplierId, password } = await req.json();
    
    if (!supplierId || !password) {
      return NextResponse.json({ error: 'Supplier ID and password are required' }, { status: 400 });
    }

    const tenantId = getTenantIdFromRequest(req);
    const db = getTenantDb(tenantId);

    // Fetch supplier from tenant database
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId.trim().toUpperCase() },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Invalid supplier ID or password' }, { status: 401 });
    }

    // Verify password hash
    const passwordMatch = bcrypt.compareSync(password, supplier.passwordHash || '');
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid supplier ID or password' }, { status: 401 });
    }

    // Check if supplier is active
    if (!supplier.active) {
      return NextResponse.json({ error: 'This supplier account has been deactivated. Please contact support.' }, { status: 401 });
    }

    // Check status
    if (supplier.status === 'Pending Approval') {
      return NextResponse.json({ error: 'Your registration is currently under review by the procurement team. Please check back later.' }, { status: 401 });
    }

    if (supplier.status === 'Rejected') {
      return NextResponse.json({ error: 'Your registration request has been rejected.' }, { status: 401 });
    }

    if (supplier.status !== 'Active') {
      return NextResponse.json({ error: 'Invalid supplier ID or password' }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({
      userId: supplier.id,
      name: supplier.name,
      role: null,
      type: 'supplier',
      supplierId: supplier.id,
      tenantId,
    });

    return NextResponse.json({
      token,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        contactPerson: supplier.contactPerson,
        location: supplier.location,
      },
    });
  } catch (error) {
    console.error('Supplier login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
