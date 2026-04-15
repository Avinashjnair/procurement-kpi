'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { can, EVAL_WEIGHTS, calcEvalScore } from '@/types';
import type { Quotation, QuotationEvaluation, RFQ } from '@/types';
import { Award, BarChart2, ChevronDown, ChevronUp, Star, Lock, X, Check } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const CRITERIA: { key: keyof Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt' | 'recommendation'>; label: string; weight: number }[] = [
  { key: 'price',          label: 'Price',           weight: EVAL_WEIGHTS.price },
  { key: 'leadTime',       label: 'Lead Time',       weight: EVAL_WEIGHTS.leadTime },
  { key: 'pastHistory',    label: 'Past History',    weight: EVAL_WEIGHTS.pastHistory },
  { key: 'paymentTerms',   label: 'Payment Terms',   weight: EVAL_WEIGHTS.paymentTerms },
  { key: 'serviceQuality', label: 'Service Quality', weight: EVAL_WEIGHTS.serviceQuality },
  { key: 'responsiveness', label: 'Responsiveness',  weight: EVAL_WEIGHTS.responsiveness },
  { key: 'compliance',     label: 'Compliance',      weight: EVAL_WEIGHTS.compliance },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#f43f5e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(99,102,241,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 26 }}>{score}</span>
    </div>
  );
}

// ── Evaluation Modal ──
function EvaluationModal({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  const { submitEvaluation } = useApp();
  const initial = quotation.evaluation;
  type EvalScores = Omit<QuotationEvaluation, 'totalScore' | 'evaluatedBy' | 'evaluatedAt' | 'recommendation'>;

  const [scores, setScores] = useState<EvalScores>({
    price:          initial?.price          ?? 5,
    leadTime:       initial?.leadTime       ?? 5,
    pastHistory:    initial?.pastHistory    ?? 5,
    paymentTerms:   initial?.paymentTerms   ?? 5,
    serviceQuality: initial?.serviceQuality ?? 5,
    responsiveness: initial?.responsiveness ?? 5,
    compliance:     initial?.compliance     ?? 5,
  });
  const [recommendation, setRecommendation] = useState(initial?.recommendation || '');

  const preview = calcEvalScore(scores);

  const handleSave = () => {
    submitEvaluation(quotation.id, { ...scores, recommendation });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Evaluate: {quotation.supplierName}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Live score preview */}
        <div style={{ padding: '14px 16px', marginBottom: 20, borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Weighted Score</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: preview >= 8 ? '#10b981' : preview >= 6 ? '#f59e0b' : '#f43f5e' }}>{preview}/10</span>
        </div>

        {CRITERIA.map(({ key, label, weight }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weight: {Math.round(weight * 100)}%</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-indigo)', minWidth: 20, textAlign: 'right' }}>{scores[key]}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(v => (
                <button key={v} type="button"
                  onClick={() => setScores(p => ({ ...p, [key]: v }))}
                  style={{ flex: 1, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
                    background: v <= scores[key] ? 'var(--accent-indigo)' : 'rgba(99,102,241,0.08)',
                    color: v <= scores[key] ? '#fff' : 'var(--text-muted)', transition: 'all 0.1s' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="form-group">
          <label className="form-label">Recommendation / Notes</label>
          <textarea className="form-input" rows={2} value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder="Summarise your recommendation…" />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><Check size={14} /> Save Evaluation</button>
        </div>
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  const { quotations, rfqs, suppliers, currentUser, awardRFQ, setActivePage } = useApp();
  const [viewMode, setViewMode] = useState<'rfqs' | 'quotes' | 'compare'>('rfqs');
  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<Quotation | null>(null);
  const [expandedQuo, setExpandedQuo] = useState<string | null>(null);

  const rfqsWithQuotes = useMemo(() => 
    rfqs.filter(r => quotations.some(q => q.rfqId === r.id))
  , [rfqs, quotations]);

  const activeRFQ = rfqs.find(r => r.id === selectedRFQId);
  const rfqQuotes = useMemo(() =>
    quotations.filter(q => q.rfqId === selectedRFQId)
      .sort((a, b) => (b.evaluation?.totalScore || 0) - (a.evaluation?.totalScore || 0))
  , [quotations, selectedRFQId]);

  const bestScore = rfqQuotes.reduce((max, q) => Math.max(max, q.evaluation?.totalScore || 0), 0);

  // Radar data
  const radarData = CRITERIA.map(c => {
    const entry: Record<string, string | number> = { criterion: c.label };
    rfqQuotes.forEach(q => { entry[q.supplierId] = q.evaluation?.[c.key] || 0; });
    return entry;
  });

  const RADAR_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  // ─────────────────────────────────────────────────────────────
  // 1. RFQ List View
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'rfqs') {
    return (
      <div>
        <div className="page-header">
          <h2>Quotation Management</h2>
          <p>Select an RFQ to review received supplier quotations</p>
        </div>

        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RFQ #</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Closing Date</th>
                  <th>Quotes Received</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rfqsWithQuotes.map(r => {
                  const count = quotations.filter(q => q.rfqId === r.id).length;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{r.id}</td>
                      <td>{r.title}</td>
                      <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                      <td>{r.deadlineDate}</td>
                      <td>
                        <span style={{ display:'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--accent-indigo)' }}>
                          <BarChart2 size={14} /> {count}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedRFQId(r.id); setViewMode('quotes'); }}>
                          Manage Quotes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Quotation List / Manual Review
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'quotes') {
    return (
      <div>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('rfqs')} style={{ paddingLeft: 0 }}>
               ← All RFQs
            </button>
            <h2 style={{ margin: 0 }}>Quotations for {activeRFQ?.id}</h2>
          </div>
          <p style={{ marginTop: 4 }}>{activeRFQ?.title} · Review each quotation manually before comparison</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {rfqQuotes.map(q => (
            <div key={q.id} className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'all 0.2s', border: expandedQuo === q.id ? '1px solid var(--accent-indigo)' : undefined }}>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{q.id}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{q.supplierName}</div>
                </div>
                {q.status === 'Awarded' && <Award size={20} style={{ color: '#10b981' }} />}
              </div>
              
              <div style={{ padding: 16, flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-indigo)' }}>${q.totalAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valid Until</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{q.validUntil}</div>
                  </div>
                </div>
                
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>Payment:</strong> {q.paymentTerms}<br/>
                  <strong>Delivery:</strong> {q.deliveryTerms}
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'rgba(99,102,241,0.02)', display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setExpandedQuo(expandedQuo === q.id ? null : q.id)}>
                   {expandedQuo === q.id ? 'Close' : 'View Items'}
                </button>
                {can(currentUser, 'evaluate_quotation') && (
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setEvaluating(q)}>
                    <Star size={12} /> {q.evaluation ? 'Re-evaluate' : 'Evaluate'}
                  </button>
                )}
              </div>

              {expandedQuo === q.id && (
                <div style={{ padding: 16, background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Line Items</div>
                  {q.lineItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: idx < q.lineItems.length - 1 ? '1px dashed var(--border-color)' : undefined }}>
                      <span>{item.itemName} (x{item.quantity})</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>${item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, padding: 20, background: 'rgba(99,102,241,0.05)', borderRadius: 16, border: '1px dashed rgba(99,102,241,0.3)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>All quotations received? Analyze them side-by-side using the Performance Radar.</p>
            <button className="btn btn-primary" onClick={() => setViewMode('compare')}>
               <BarChart2 size={16} /> Show Competitive Comparison
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Competitive Comparison View (Existing Logic)
  // ─────────────────────────────────────────────────────────────
  return (
    <div>
      {evaluating && <EvaluationModal quotation={evaluating} onClose={() => setEvaluating(null)} />}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('quotes')} style={{ paddingLeft: 0 }}>
             ← RFQ Detail
          </button>
          <h2 style={{ margin: 0 }}>Competitive Analysis: {activeRFQ?.id}</h2>
        </div>
        <p style={{ marginTop: 4 }}>Compare supplier quotes across cost, lead time, quality, and more</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Side-by-Side Comparison</div>
            <div className="card-subtitle">{activeRFQ?.title}</div>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>Criterion</th>
                {rfqQuotes.map((q, i) => (
                  <th key={q.id} style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {q.evaluation?.totalScore === bestScore && q.evaluation && <Star size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />}
                      {q.supplierName}
                    </div>
                    {q.status === 'Awarded' && <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>★ AWARDED</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Total Amount</td>
                {rfqQuotes.map(q => {
                  const lowest = Math.min(...rfqQuotes.map(x => x.totalAmount));
                  return <td key={q.id} className="font-mono" style={{ fontWeight: 700, color: q.totalAmount === lowest ? '#10b981' : '#f1f5f9' }}>${q.totalAmount.toLocaleString()}</td>;
                })}
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Max Lead Time</td>
                {rfqQuotes.map(q => {
                  const days = q.lineItems.length > 0 ? Math.max(...q.lineItems.map(l => l.leadTimeDays)) : 0;
                  const fastest = Math.min(...rfqQuotes.map(x => x.lineItems.length > 0 ? Math.max(...x.lineItems.map(l => l.leadTimeDays)) : 999));
                  return <td key={q.id} style={{ color: days === fastest ? '#10b981' : '#f1f5f9' }}>{days}d</td>;
                })}
              </tr>
              <tr><td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Payment Terms</td>{rfqQuotes.map(q => <td key={q.id}>{q.paymentTerms}</td>)}</tr>
              <tr><td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Delivery Terms</td>{rfqQuotes.map(q => <td key={q.id}><span className="badge approved">{q.deliveryTerms}</span></td>)}</tr>
              <tr><td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Valid Until</td>{rfqQuotes.map(q => <td key={q.id}>{q.validUntil}</td>)}</tr>
              
              <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                <td colSpan={rfqQuotes.length + 1} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: 8 }}>Evaluation Scores</td>
              </tr>
              {CRITERIA.map(c => (
                <tr key={c.key}>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.label} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({Math.round(c.weight * 100)}%)</span></td>
                  {rfqQuotes.map(q => {
                    const s = q.evaluation?.[c.key] ?? null;
                    const best = Math.max(...rfqQuotes.map(x => x.evaluation?.[c.key] || 0));
                    return (
                      <td key={q.id}>
                        {s !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 4, borderRadius: 2, background: 'rgba(99,102,241,0.08)', overflow: 'hidden' }}>
                              <div style={{ width: `${s * 10}%`, height: '100%', background: s === best ? '#10b981' : '#6366f1', transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: s === best ? '#10b981' : '#f1f5f9' }}>{s}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid rgba(99,102,241,0.2)' }}>
                <td style={{ fontWeight: 800, color: '#f1f5f9' }}>TOTAL SCORE</td>
                {rfqQuotes.map(q => (
                  <td key={q.id}>
                    {q.evaluation ? (
                      <span style={{ fontSize: 18, fontWeight: 800, color: q.evaluation.totalScore === bestScore ? '#10b981' : '#f1f5f9' }}>
                        {q.evaluation.totalScore}/10
                        {q.evaluation.totalScore === bestScore && <Star size={14} fill="#f59e0b" style={{ color: '#f59e0b', marginLeft: 5 }} />}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not evaluated</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 0 0', flexWrap: 'wrap' }}>
          {rfqQuotes.map(q => (
            <div key={q.id} style={{ display: 'flex', gap: 6 }}>
              {can(currentUser, 'evaluate_quotation') && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEvaluating(q)}>
                  {q.evaluation ? 'Re-evaluate' : 'Evaluate'} {q.supplierName.split(' ')[0]}
                </button>
              )}
              {can(currentUser, 'award_quotation') && activeRFQ?.status !== 'Awarded' && q.evaluation && (
                <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => activeRFQ && awardRFQ(activeRFQ.id, q.id)}>
                  <Award size={13} /> Award
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      {rfqQuotes.some(q => q.evaluation) && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Performance Radar</div>
            <div className="card-subtitle">Visual evaluation comparison</div>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(99,102,241,0.12)" />
                <PolarAngleAxis dataKey="criterion" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} />
                {rfqQuotes.filter(q => q.evaluation).map((q, i) => (
                  <Radar key={q.id} name={q.supplierName.split(' ')[0]} dataKey={q.supplierId} stroke={RADAR_COLORS[i % RADAR_COLORS.length]} fill={RADAR_COLORS[i % RADAR_COLORS.length]} fillOpacity={0.12} strokeWidth={2} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
