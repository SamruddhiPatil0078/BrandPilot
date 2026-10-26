import React from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  User,
  Calendar,
  Sparkles,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AuditLedgerRecord } from '../../types/audit';

interface DecisionLedgerViewProps {
  ledger: AuditLedgerRecord[];
}

export const DecisionLedgerView: React.FC<DecisionLedgerViewProps> = ({ ledger }) => {
  const acceptedCount = ledger.filter(r => r.decision === 'ACCEPTED').length;
  const disputedCount = ledger.filter(r => r.decision === 'DISPUTED').length;
  const escalatedCount = ledger.filter(r => r.decision === 'ESCALATED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          border: '1px solid #334155',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-success" style={{ backgroundColor: 'rgba(22, 163, 74, 0.25)', color: '#4ADE80' }}>
                Human Review & Decision Governance
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Append-Only Audit Ledger
              </span>
            </div>

            <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
              BrandPilot Decision Ledger & Governance Insights
            </h1>

            <p style={{ color: '#94A3B8', fontSize: '13px', maxWidth: '750px' }}>
              Every human review decision is immutably logged with the author, timestamp, evidence citation, and brand guidelines version. The AI proposes, people decide. Over time, recurring human errors suggest proactive guideline improvements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#4ADE80' }}>{acceptedCount}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Fixes Accepted</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#60A5FA' }}>{disputedCount}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Disputed Claims</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#F87171' }}>{escalatedCount}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Escalations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Insights (from PDF Page 6 & 8) */}
      <div className="card" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1' }}>
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="#2563EB" />
            <span>Governance Insights: Recurring Errors & Guideline Health</span>
          </div>
          <span className="badge badge-inconsistency">Proactive Recommendations</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#DC2626' }}>
                #1 Recurring Finding: Unsupported Superlatives
              </span>
              <span className="badge badge-violation" style={{ fontSize: '10px' }}>High Frequency</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
              Marketing creators frequently use "India's most loved" without third-party market share citations.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#166534', fontWeight: 600, background: '#F0FDF4', padding: '6px', borderRadius: '4px' }}>
              Suggested Guideline Fix: Distribute approved copy snippets: "Loved by our community" or "Dermatologist-recommended formulation".
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#D97706' }}>
                #2 Recurring Finding: Post-Promo Price Drift
              </span>
              <span className="badge badge-unverified" style={{ fontSize: '10px' }}>Seasonal</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
              Legacy Monsoon Sale price ₹1,099 persists in agency templates after the 30 Sept expiration date.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#166534', fontWeight: 600, background: '#F0FDF4', padding: '6px', borderRadius: '4px' }}>
              Suggested Guideline Fix: Trigger automated campaign asset recheck 7 days prior to sale conclusion.
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#2563EB' }}>
                #3 Recurring Finding: Deprecated Logo Assets
              </span>
              <span className="badge badge-inconsistency" style={{ fontSize: '10px' }}>Agency Design</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
              Outside design agencies continue referencing obsolete 2025 Vintage Crest v2 in print files.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#166534', fontWeight: 600, background: '#F0FDF4', padding: '6px', borderRadius: '4px' }}>
              Suggested Guideline Fix: Revoke legacy CDN asset links and push approved Logo v3.0 package to agency DAM.
            </div>
          </div>
        </div>
      </div>

      {/* Decision Ledger Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileCheck2 size={18} color="#00473E" />
            <span>Immutable Review Event History ({ledger.length} Recorded Decisions)</span>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>Asset & Flagged Copy</th>
                <th>Issue Category</th>
                <th>Reviewer Decision Note</th>
                <th>Decided By</th>
                <th>Timestamp & Version</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(record => (
                <tr key={record.id}>
                  <td>
                    <span
                      className={`badge ${
                        record.decision === 'ACCEPTED'
                          ? 'badge-success'
                          : record.decision === 'DISPUTED'
                          ? 'badge-inconsistency'
                          : 'badge-violation'
                      }`}
                    >
                      {record.decision === 'ACCEPTED' && <CheckCircle2 size={11} />}
                      {record.decision === 'DISPUTED' && <AlertTriangle size={11} />}
                      {record.decision === 'ESCALATED' && <ShieldAlert size={11} />}
                      <span>{record.decision}</span>
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                      {record.assetTitle}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      "{record.flaggedText}"
                    </div>
                  </td>

                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                      {record.findingCategory}
                    </span>
                  </td>

                  <td style={{ maxWidth: '340px', fontSize: '12px', color: '#334155' }}>
                    {record.decisionNote}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                      <User size={13} color="#2563EB" />
                      <span>{record.decidedBy}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: 600 }}>
                      Brand Truth: {record.brandVersion}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
