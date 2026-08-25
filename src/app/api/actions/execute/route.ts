import { NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/dbManager';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, actionType, payload } = await req.json();
    if (!notificationId || !actionType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = getTenantDb(session.tenantId);

    // Fetch the user's notification record
    const userNotif = await db.userNotification.findUnique({
      where: {
        userId_notificationId: {
          userId: session.userId,
          notificationId
        }
      }
    });

    if (userNotif && userNotif.actionState === 'COMPLETED') {
      return NextResponse.json({ error: 'Action already completed.' }, { status: 400 });
    }

    let actionResultMsg = '';

    // Execute actions based on type
    if (actionType === 'APPROVE_PO') {
      const poId = payload.poId;
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { deliveryStatus: 'Approved' }
      });
      actionResultMsg = `Approved PO #${poId} by ${session.name}`;

      // Create an audit log entry
      await db.auditLogEntry.create({
        data: {
          timestamp: new Date().toISOString(),
          actorId: session.userId,
          actorName: session.name,
          entityType: 'PO',
          entityId: poId,
          action: 'Approve',
          description: `Approved PO #${poId} via interactive notification action.`
        }
      });
    } else if (actionType === 'REORDER_STOCK') {
      const itemId = payload.itemId;
      const item = await db.item.findUnique({ where: { id: itemId } });
      const supplierId = (item?.linkedSupplierIds as string[])?.[0] || 'SUP-001';
      const supplier = await db.supplier.findUnique({ where: { id: supplierId } }) || { name: 'Default Supplier' };
      
      const poList = await db.purchaseOrder.findMany({ select: { id: true } });
      let maxNum = 0;
      for (const poItem of poList) {
        const match = poItem.id.match(/^PO-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const newPoId = `PO-${String(maxNum + 1).padStart(3, '0')}`;
      const qty = 50;
      const unitPrice = item?.currentPrice || 100;

      await db.purchaseOrder.create({
        data: {
          id: newPoId,
          dateOfIssue: new Date().toISOString().split('T')[0],
          supplierId,
          supplierName: supplier.name,
          totalAmount: qty * unitPrice,
          paymentTerms: 'Net 30',
          amountPaid: 0,
          dateOfPayment: '',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          deliveryStatus: 'Draft',
          paymentStatus: 'Unpaid',
          eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          incoterms: 'DDP',
          remarks: `Auto-reorder draft created from low stock alert for item ${itemId}.`,
          items: [
            {
              itemId,
              itemName: item?.name || 'Unknown Item',
              quantity: qty,
              unitPrice,
              deliveredQty: 0,
              billedQty: 0
            }
          ],
          approvalSteps: [],
          currentApprovalStep: 0,
          matchStatus: 'Pending'
        }
      });

      actionResultMsg = `Created draft PO #${newPoId} by ${session.name}`;

      // Create an audit log entry
      await db.auditLogEntry.create({
        data: {
          timestamp: new Date().toISOString(),
          actorId: session.userId,
          actorName: session.name,
          entityType: 'PO',
          entityId: newPoId,
          action: 'Create',
          description: `Created auto-reorder PO #${newPoId} via stockout notification.`
        }
      });
    } else {
      return NextResponse.json({ error: 'Unsupported action type.' }, { status: 400 });
    }

    // Update ALL user notification states to completed for this notification ID to enforce idempotency
    await db.userNotification.updateMany({
      where: { notificationId },
      data: {
        actionState: 'COMPLETED',
        actionResult: actionResultMsg,
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true, result: actionResultMsg });
  } catch (err: any) {
    console.error('Action execution failed:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
