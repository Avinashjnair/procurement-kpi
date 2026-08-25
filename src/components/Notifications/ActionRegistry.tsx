import React, { useState } from 'react';
import { Play, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface ActionRegistryProps {
  notificationId: string;
  actionType: string | null | undefined;
  actionPayload: any;
  actionState: string;
  actionResult: string | null | undefined;
  onActionCompleted?: (resultMsg: string) => void;
}

export function ActionRegistry({
  notificationId,
  actionType,
  actionPayload,
  actionState,
  actionResult,
  onActionCompleted
}: ActionRegistryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!actionType) return null;

  const getActionLabel = () => {
    switch (actionType) {
      case 'APPROVE_PO':
        return 'Approve PO';
      case 'REORDER_STOCK':
        return 'Reorder Stock (50x)';
      default:
        return 'Execute Action';
    }
  };

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation trigger
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          actionType,
          payload: typeof actionPayload === 'string' ? JSON.parse(actionPayload) : actionPayload
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute action');
      }
      if (onActionCompleted) {
        onActionCompleted(data.result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = actionState === 'COMPLETED';

  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isCompleted ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.15)' }}>
            <Check size={12} />
            <span>{actionResult || 'Completed'}</span>
          </div>
        ) : (
          <button
            className={`btn ${actionType === 'APPROVE_PO' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, fontSize: 11, padding: '0 10px' }}
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Play size={10} style={{ fill: 'currentColor' }} />
            )}
            <span>{getActionLabel()}</span>
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f43f5e', fontSize: 10, fontWeight: 500 }}>
          <AlertCircle size={10} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
