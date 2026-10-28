import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  User,
  TrendingUp,
  Search,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { AuditLedgerRecord } from '../../types/audit';

interface DecisionLedgerViewProps {
  ledger: AuditLedgerRecord[];
}

export const DecisionLedgerView: React.FC<DecisionLedgerViewProps> = ({ ledger }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecisionFilter, setSelectedDecisionFilter] = useState<'ALL' | 'ACCEPTED' | 'DISPUTED' | 'ESCALATED'>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const acceptedCount = ledger.filter(r => r.decision === 'ACCEPTED').length;
  const disputedCount = ledger.filter(r => r.decision === 'DISPUTED').length;
  const escalatedCount = ledger.filter(r => r.decision === 'ESCALATED').length;
  const totalCount = ledger.length;

  const acceptanceRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 100;
  const disputeRate = totalCount > 0 ? Math.round((disputedCount / totalCount) * 100) : 0;

  // Dynamic computation of recurring categories & insights
  const dynamicInsights = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const assetCounts: Record<string, number> = {};

    ledger.forEach(r => {
      const cat = r.findingCategory || 'General Rule';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const asset = r.assetTitle || 'Unnamed Creative';
      assetCounts[asset] = (assetCounts[asset] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0] || ['Verified rule violation', 0];

    const sortedAssets = Object.entries(assetCounts).sort((a, b) => b[1] - a[1]);
    const topAsset = sortedAssets[0] || ['Campaign Assets', 0];

    return {
      topCategoryName: topCategory[0],
      topCategoryCount: topCategory[1],
      topAssetName: topAsset[0],
      topAssetCount: topAsset[1],
      categoriesList: Object.keys(categoryCounts)
    };
  }, [ledger]);

  // Filtered ledger rows
  const filteredLedger = useMemo(() => {
    return ledger.filter(record => {
      const matchesSearch =
        searchQuery === '' ||
        record.assetTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.flaggedText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.decidedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.decisionNote?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDecision =
        selectedDecisionFilter === 'ALL' || record.decision === selectedDecisionFilter;

      const matchesCategory =
        selectedCategoryFilter === 'ALL' || record.findingCategory === selectedCategoryFilter;

      return matchesSearch && matchesDecision && matchesCategory;
    });
  }, [ledger, searchQuery, selectedDecisionFilter, selectedCategoryFilter]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Decision', 'Asset Title', 'Flagged Text', 'Category', 'Decision Note', 'Decided By', 'Brand Version', 'Timestamp'];
    const rows = filteredLedger.map(r => [
      `"${r.id}"`,
      `"${r.decision}"`,
      `"${(r.assetTitle || '').replace(/"/g, '""')}"`,
      `"${(r.flaggedText || '').replace(/"/g, '""')}"`,
      `"${(r.findingCategory || '').replace(/"/g, '""')}"`,
      `"${(r.decisionNote || '').replace(/"/g, '""')}"`,
      `"${(r.decidedBy || '').replace(/"/g, '""')}"`,
      `"${r.brandVersion || ''}"`,
      `"${r.timestamp || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `brandpilot-audit-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredLedger, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.setAttribute('download', `brandpilot-audit-ledger-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
              Every human review decision is immutably logged with the reviewer, timestamp, and brand guidelines version. The AI proposes, people decide.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ADE80' }}>{acceptedCount}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Fixes Accepted</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#60A5FA' }}>{disputedCount}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Disputed/Sent Back</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#F87171' }}>{escalatedCount}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Escalations</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#FBBF24' }}>{acceptanceRate}%</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Adherence Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Governance Insights derived from live ledger */}
      <div className="card" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1' }}>
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="#2563EB" />
            <span>Governance Insights: Dynamic Ledger Intelligence ({totalCount} Historical Decisions)</span>
          </div>
          <span className="badge badge-inconsistency">Computed Live from Storage</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {/* Card 1: Top Category */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#DC2626' }}>
                Top Issue Category: {dynamicInsights.topCategoryName}
              </span>
              <span className="badge badge-violation" style={{ fontSize: '10px' }}>
                {dynamicInsights.topCategoryCount} Events
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
              Accounting for {totalCount > 0 ? Math.round((dynamicInsights.topCategoryCount / totalCount) * 100) : 0}% of all recorded compliance events in the active brand memory.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#166534', fontWeight: 600, background: '#F0FDF4', padding: '6px', borderRadius: '4px' }}>
              Actionable Fix: Review approved claims substantiation repository to equip creators with verified evidence.
            </div>
          </div>

          {/* Card 2: Most Audited Asset */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#D97706' }}>
                Frequent Asset Target: {dynamicInsights.topAssetName}
              </span>
              <span className="badge badge-unverified" style={{ fontSize: '10px' }}>
                {dynamicInsights.topAssetCount} Reviews
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
              Creatives in this stream require multiple iterations to achieve full alignment across pricing and disclaimer rules.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#166534', fontWeight: 600, background: '#F0FDF4', padding: '6px', borderRadius: '4px' }}>
              Actionable Fix: Deploy auto-alignment rules across this production channel to pre-synchronize catalog prices.
            </div>
          </div>

          {/* Card 3: Adherence vs Override Rate */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#2563EB' }}>
                Human Adherence Rate: {acceptanceRate}%
              </span>
              <span className="badge badge-inconsistency" style={{ fontSize: '10px' }}>
                {disputeRate}% Override
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
              {acceptedCount} AI fixes accepted directly into drafts, while {disputedCount} decisions were sent back to creators for manual artwork updates.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#166534', fontWeight: 600, background: '#F0FDF4', padding: '6px', borderRadius: '4px' }}>
              Actionable Fix: Continue append-only ledger tracking to maintain regulatory audit defense compliance.
            </div>
          </div>
        </div>
      </div>

      {/* Decision Ledger Table with Search, Filters & Export */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-title">
            <FileCheck2 size={18} color="#00473E" />
            <span>Immutable Review Event History ({filteredLedger.length} of {ledger.length} Recorded Decisions)</span>
          </div>

          {/* Search, Filter & Export Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '30px', fontSize: '12px', width: '180px', height: '34px' }}
                placeholder="Search asset, text..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Decision Status Filter */}
            <select
              className="form-select"
              style={{ fontSize: '12px', height: '34px', width: '130px' }}
              value={selectedDecisionFilter}
              onChange={e => setSelectedDecisionFilter(e.target.value as any)}
            >
              <option value="ALL">All Decisions</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DISPUTED">DISPUTED</option>
              <option value="ESCALATED">ESCALATED</option>
            </select>

            {/* Category Filter */}
            <select
              className="form-select"
              style={{ fontSize: '12px', height: '34px', width: '150px' }}
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {dynamicInsights.categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Export CSV */}
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', height: '34px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={handleExportCsv}
              title="Export ledger to CSV"
            >
              <FileSpreadsheet size={13} color="#16A34A" />
              <span>CSV</span>
            </button>

            {/* Export JSON */}
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', height: '34px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={handleExportJson}
              title="Export ledger to JSON"
            >
              <FileCode size={13} color="#2563EB" />
              <span>JSON</span>
            </button>
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
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    No decisions match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map(record => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
