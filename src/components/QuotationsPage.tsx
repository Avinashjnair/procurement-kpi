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
  const [selectedRFQ, setSelectedRFQ] = useState<string>(rfqs.filter(r => quotations.some(q => q.rfqId === r.id))[0]?.id || '');
  const [evaluating, setEvaluating] = useState<Quotation | null>(null);
  const [expandedQuo, setExpandedQuo] = useState<string | null>(null);

  const rfqsWithQuotes = rfqs.filter(r => quotations.some(q => q.rfqId === r.id));
  const activeRFQ = rfqs.find(r => r.id === selectedRFQ);
  const rfqQuotes = useMemo(() =>
    quotations.filter(q => q.rfqId === selectedRFQ)
      .sort((a, b) => (b.evaluation?.totalScore || 0) - (a.evaluation?.totalScore || 0))
  , [quotations, selectedRFQ]);

  const bestScore = rfqQuotes.reduce((max, q) => Math.max(max, q.evaluation?.totalScore || 0), 0);

  // Radar data
  const radarData = CRITERIA.map(c => {
    const entry: Record<string, string | number> = { criterion: c.label };
    rfqQuotes.forEach(q => { entry[q.supplierId] = q.evaluation?.[c.key] || 0; });
    return entry;
  });

  const RADAR_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div>
      {evaluating && <EvaluationModal quotation={evaluating} onClose={() => setEvaluating(null)} />}

      <div className="page-header">
        <h2>Quotation Comparison & Evaluation</h2>
        <p>Compare supplier quotes across cost, lead time, quality, and more</p>
      </div>

      {/* RFQ selector */}
      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Select RFQ:</div>
        <select className="filter-select" value={selectedRFQ} onChange={e => setSelectedRFQ(e.target.value)} style={{ flex: 1, maxWidth: 400 }}>
          {rfqsWithQuotes.map(r => (
            <option key={r.id} value={r.id}>{r.id} — {r.title}</option>
          ))}
        </select>
        {activeRFQ && (
          <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.08)', color: 'var(--accent-indigo)' }}>
            {rfqQuotes.length} quote{rfqQuotes.length !== 1 ? 's' : ''} received
          </span>
        )}
      </div>

      {rfqQuotes.length === 0 ? (
        <div className="empty-state"><BarChart2 size={40} /><h3>No quotations for this RFQ</h3><p>Select an RFQ that has received quotes</p></div>
      ) : (
        <>
          {/* Comparison table */}
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
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Payment Terms</td>
                    {rfqQuotes.map(q => <td key={q.id}>{q.paymentTerms}</td>)}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Delivery Terms</td>
                    {rfqQuotes.map(q => <td key={q.id}><span className="badge approved">{q.deliveryTerms}</span></td>)}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Valid Until</td>
                    {rfqQuotes.map(q => <td key={q.id}>{q.validUntil}</td>)}
                  </tr>
                  {/* Evaluation scores */}
                  <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                    <td colSpan={rfqQuotes.length + 1} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: 8 }}>
                      Evaluation Scores
                    </td>
                  </tr>
                  {CRITERIA.map(c => (
                    <tr key={c.key}>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {c.label} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({Math.round(c.weight * 100)}%)</span>
                      </td>
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
                  {/* Total score */}
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
            <div style={{ display: 'flex', gap: 10, padding: '14px 0 0', flexWrap: 'wrap' }}>
              {rfqQuotes.map(q => (
                <div key={q.id} style={{ display: 'flex', gap: 6 }}>
                  {can(currentUser, 'evaluate_quotation') && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEvaluating(q)}>
                      {q.evaluation ? 'Re-evaluate' : 'Evaluate'} {q.supplierName.split(' ')[0]}
                    </button>
                  )}
                  {can(currentUser, 'award_quotation') && activeRFQ?.status !== 'Awarded' && q.evaluation && (
                    <button className="btn btn-sm"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                      onClick={() => awardRFQ(selectedRFQ, q.id)}>
                      <Award size={13} /> Award
                    </button>
                  )}
                  {!can(currentUser, 'award_quotation') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>
                      <Lock size={11} /> Manager approval required
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Radar chart */}
          {rfqQuotes.some(q => q.evaluation) && (
            <div className="card" style={{ marginBottom: 20 }}>
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
                      <Radar key={q.id} name={q.supplierName.split(' ')[0]} dataKey={q.supplierId}
                        stroke={RADAR_COLORS[i % RADAR_COLORS.length]} fill={RADAR_COLORS[i % RADAR_COLORS.length]} fillOpacity={0.12} strokeWidth={2} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                {rfqQuotes.filter(q => q.evaluation).map((q, i) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                    {q.supplierName.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed quote cards with recommendations */}
          {rfqQuotes.filter(q => q.evaluation?.recommendation).map(q => (
            <div key={q.id} className="card" style={{ marginBottom: 12, borderColor: q.status === 'Awarded' ? 'rgba(16,185,129,0.25)' : undefined }}>
              <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedQuo(s => s === q.id ? null : q.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {q.status === 'Awarded' && <Award size={15} style={{ color: '#10b981' }} />}
                  <div className="card-title">{q.supplierName}</div>
                  {q.evaluation && (
                    <span style={{ fontSize: 16, fontWeight: 800, color: q.evaluation.totalScore === bestScore ? '#10b981' : '#6366f1' }}>
                      {q.evaluation.totalScore}/10
                    </span>
                  )}
                </div>
                {expandedQuo === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {expandedQuo === q.id && q.evaluation?.recommendation && (
                <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.04)', borderRadius: 8, borderLeft: '3px solid var(--accent-indigo)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {q.evaluation.recommendation}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
