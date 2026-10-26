import React from 'react';
import { History, GitCommit, CheckCircle2, User, Calendar } from 'lucide-react';
import { BrandKnowledgeBase } from '../../types/brand';

interface VersionHistoryModalProps {
  kb: BrandKnowledgeBase;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ kb, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
            <History size={18} color="#2563EB" />
            <span>Brand Memory Version History & Audit Trail</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '16px', fontSize: '12.5px', color: '#64748B' }}>
            Every guideline, price change, and terminology edit creates an immutable version snapshot. This enables the auditor to differentiate between outdated facts (e.g. valid until last month) and fabricated claims.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {kb.versionHistory.map((v, index) => {
              const isCurrent = v.version === kb.activeVersion;
              return (
                <div
                  key={index}
                  style={{
                    border: isCurrent ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: isCurrent ? '#EFF6FF' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitCommit size={16} color={isCurrent ? '#2563EB' : '#64748B'} />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                        Version {v.version}
                      </span>
                      {isCurrent && <span className="badge badge-inconsistency">Active Truth</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        <span>{v.updatedBy}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{new Date(v.timestamp).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                    {v.changesSummary}
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Context: {v.snapshotDescription}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
