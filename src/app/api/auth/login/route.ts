import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTenantDb } from '@/lib/dbManager';
import { getTenantIdFromRequest, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const tenantId = getTenantIdFromRequest(req);
    const db = getTenantDb(tenantId);

    // Fetch user from tenant database
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password hash
    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      name: user.name,
      role: user.role,
      type: 'user',
      supplierId: null,
      tenantId,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarInitials: user.avatarInitials,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
