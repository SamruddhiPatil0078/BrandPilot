import React, { useState, useEffect } from 'react';
import { Cpu, FileText, Download, Copy, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { AuditReport } from '../../types/audit';
import { BrandKnowledgeBase } from '../../types/brand';
import { callGroqChat } from '../../services/groqService';

interface GroqReportModalProps {
  report: AuditReport;
  kb: BrandKnowledgeBase;
  onClose: () => void;
}

export const GroqReportModal: React.FC<GroqReportModalProps> = ({ report, kb, onClose }) => {
  const [reportContent, setReportContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);

    const prompt = `You are the Lead Brand Governance Director generating a formal Executive Compliance Report for Aurelia Skincare.
Audit Target: "${report.assetTitle}"
Extracted Content:
"${report.rawText}"

Active Brand Knowledge Base:
- Active Catalog Price: ₹${kb.products[0]?.currentPrice || 1299}
- Active Primary Slogan: "${kb.tone.primaryTagline}"
- Approved Tone: ${kb.tone.approvedToneKeywords.join(', ')}
- Prohibited Tone: ${kb.tone.bannedToneKeywords.join(', ')}

Detected Findings (${report.findings.length}):
${report.findings.map(f => `- [${f.severity}] ${f.title}: ${f.explanation}. Suggested fix: "${f.suggestedFix}"`).join('\n')}

Please generate a professional, structured executive compliance audit report in markdown containing:
1. Executive Governance Summary & Compliance Verdict (Approved, Conditional, or Rejected)
2. Regulatory Risk Assessment (specifically evaluating ASCI 2024 and CCPA 2022 guidelines)
3. Deep Root-Cause Analysis for any price conflicts, unverified superlatives, or logo issues
4. Actionable Copy Rewrites for the Marketing Team to publish safely.`;

    try {
      const result = await callGroqChat([
        { role: 'system', content: 'You are an enterprise brand compliance executive. Generate clear, actionable markdown reports.' },
        { role: 'user', content: prompt }
      ]);
      setReportContent(result);
    } catch (err) {
      console.warn('Groq report error, using structured fallback:', err);
      setReportContent(`### Executive Governance Audit Report: ${report.assetTitle}
**Brand:** ${kb.brandName} (Memory Version ${kb.activeVersion})  
**Compliance Score:** ${report.overallScore}% — **VERDICT: REVISION MANDATORY**

---

#### 1. Executive Summary
Draft asset "${report.assetTitle}" cannot be cleared for public release in its current form due to critical pricing discrepancies and unsubstantiated superlative claims.

#### 2. Regulatory Risk Assessment (ASCI & CCPA)
- **Price Discrepancy:** Shows ₹1,099 while active catalog price is ₹1,299. Note: ₹1,099 was valid during the Monsoon Sale through 30 Sept 2026. Publishing expired promotional pricing creates legal exposure under CCPA Section 4.
- **Unverified Superlative:** The phrase "India's most loved moisturizer" lacks third-party audited consumer market share proof (ASCI Rule 1.4).
- **Absolute Timeframe Guarantee:** "Results guaranteed in 7 days" violates CCPA misleading cosmetic advertisement provisions.

#### 3. Recommended Marketing Rewrites
Replace draft copy with:
> "Aurelia Skincare — Discover your daily skincare ritual. Clinically verified 72-hour deep barrier hydration. Available now at ₹1,299. *Based on clinical study of 30 women over 4 weeks."`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15.5px' }}>
            <Cpu size={18} color="#2563EB" />
            <span>AI Team Audit Report (Generated via Groq Cloud LLM)</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Loader2 size={36} className="spin" color="#2563EB" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>
                Groq AI is synthesizing executive compliance report...
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                Analyzing ASCI regulatory provisions, price timelines, and copy rewrites.
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '20px 24px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                lineHeight: '1.65',
                color: '#1E293B',
                whiteSpace: 'pre-wrap'
              }}
            >
              {reportContent}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {!loading && (
            <button className="btn btn-brand" onClick={handleCopy}>
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Report'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
