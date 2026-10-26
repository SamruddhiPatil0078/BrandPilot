import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertTriangle, User, FileText } from 'lucide-react';
import { AuditFinding } from '../../types/audit';

interface SendBackEmailModalProps {
  assetTitle: string;
  findings: AuditFinding[];
  onClose: () => void;
  onSendEmail: (emailData: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    messageBody: string;
  }) => void;
}

export const SendBackEmailModal: React.FC<SendBackEmailModalProps> = ({
  assetTitle,
  findings,
  onClose,
  onSendEmail
}) => {
  const [recipientEmail, setRecipientEmail] = useState('riya.creator@aureliaskincare.com');
  const [recipientName, setRecipientName] = useState('Riya (Social Media Creative Team)');
  const [subject, setSubject] = useState(`[Action Required] Brand Compliance Audit Rejected: ${assetTitle}`);

  // Build structured rejection body from live findings
  const defaultBody = `Hello ${recipientName},

Your draft creative "${assetTitle}" has been audited by BrandPilot Intelligence against our active Brand Knowledge Base and requires mandatory corrections before publication:

IDENTIFIED COMPLIANCE ISSUES:
${findings
  .map(
    (f, idx) =>
      `${idx + 1}. [${f.severity}] ${f.title}
   - Flagged Content: "${f.flaggedText}"
   - Policy Explanation: ${f.explanation}
   - Approved Source Truth: ${f.approvedSource.title} (${f.approvedSource.validityNote || ''})
   - Required Correction: "${f.suggestedFix}"`
  )
  .join('\n\n')}

NEXT STEPS:
Please revise the asset using the approved on-brand copy above and re-upload to BrandPilot for secondary sign-off.

Best regards,
Meera (Compliance & Brand Governance Reviewer)
Aurelia Skincare Governance Office`;

  const [messageBody, setMessageBody] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      onSendEmail({
        recipientEmail,
        recipientName,
        subject,
        messageBody
      });
      setIsSending(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
              <Mail size={18} color="#DC2626" />
              <span>Send Compliance Rejection Notice via Email</span>
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: '#991B1B',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} />
              <span>
                Sending this notification will alert the creative agency or creator that this draft contains {findings.length} rule violation(s) and cannot be published.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Recipient Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="Enter creator or your email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Creator / Team Name</label>
                <input
                  className="form-input"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Subject</label>
              <input
                className="form-input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Audit Feedback & Required Fixes</label>
              <textarea
                className="form-textarea"
                rows={9}
                style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' }}
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={isSending}>
              <Send size={14} />
              <span>{isSending ? 'Sending Notification...' : 'Send Rejection Email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
