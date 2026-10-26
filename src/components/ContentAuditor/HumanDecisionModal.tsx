import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, ShieldAlert, User, FileText } from 'lucide-react';
import { AuditFinding, ReviewDecision } from '../../types/audit';

interface HumanDecisionModalProps {
  finding: AuditFinding;
  actionType: ReviewDecision;
  onClose: () => void;
  onConfirm: (findingId: string, decision: ReviewDecision, note: string, decidedBy: string) => void;
}

export const HumanDecisionModal: React.FC<HumanDecisionModalProps> = ({
  finding,
  actionType,
  onClose,
  onConfirm
}) => {
  const [decidedBy, setDecidedBy] = useState('Meera (Compliance Reviewer)');
  const [decisionNote, setDecisionNote] = useState(
    actionType === 'ACCEPTED'
      ? `Applied suggested fix: "${finding.suggestedFix}" to align with approved guidelines.`
      : actionType === 'DISPUTED'
      ? 'Marketing team requests one-time campaign exemption with supporting rationale.'
      : 'Forwarded to Legal & Compliance department for mandatory regulatory risk clearance.'
  );

  const handleSubmit = () => {
    onConfirm(finding.id, actionType, decisionNote, decidedBy);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
            {actionType === 'ACCEPTED' && <CheckCircle2 size={18} color="#16A34A" />}
            {actionType === 'DISPUTED' && <MessageSquare size={18} color="#2563EB" />}
            {actionType === 'ESCALATED' && <ShieldAlert size={18} color="#DC2626" />}
            <span>Record Human Decision: {actionType}</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
              Finding #{finding.pinNumber}: {finding.title}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Category: <strong>{finding.category}</strong> • Flagged: "{finding.flaggedText}"
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reviewer Name & Role</label>
            <select
              className="form-select"
              value={decidedBy}
              onChange={e => setDecidedBy(e.target.value)}
            >
              <option value="Meera (Compliance Reviewer)">Meera (Compliance Reviewer)</option>
              <option value="Riya (Content Creator)">Riya (Content Creator)</option>
              <option value="Arjun (Brand Manager)">Arjun (Brand Manager)</option>
              <option value="Legal Counsel (External)">Legal Counsel (External)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Decision Rationale / Audit Comment</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={decisionNote}
              onChange={e => setDecisionNote(e.target.value)}
              placeholder="Provide context for why this finding was accepted, disputed, or escalated..."
            />
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            This decision will be immutably recorded in the BrandPilot Governance Ledger with your user role and timestamp.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${
              actionType === 'ACCEPTED'
                ? 'btn-brand'
                : actionType === 'DISPUTED'
                ? 'btn-primary'
                : 'btn-danger'
            }`}
            onClick={handleSubmit}
          >
            Confirm & Save to Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
