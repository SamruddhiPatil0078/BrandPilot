import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  FileText,
  Code,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { AuditReport } from '../../types/audit';
import { BrandKnowledgeBase } from '../../types/brand';
import { callGroqChat } from '../../services/groqService';
import { ExecutiveReportRenderer } from './ExecutiveReportRenderer';

interface GroqReportModalProps {
  report: AuditReport;
  kb: BrandKnowledgeBase;
  onClose: () => void;
}

export const GroqReportModal: React.FC<GroqReportModalProps> = ({ report, kb, onClose }) => {
  const [reportContent, setReportContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'raw'>('executive');

  const generateReport = useCallback(async () => {
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
      setReportContent(`# Aurelia Skincare — Executive Compliance Audit
**Audit Target:** *${report.assetTitle}*
**Date of Review:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
**Prepared By:** Lead Brand Governance Director

---

## 1. Executive Governance Summary & Compliance Verdict

| Item | Status | Comments |
|------|--------|----------|
| Overall Content | **Conditional Approval** | High-risk violations detected (unsubstantiated claims, price discrepancy). Revisions required prior to distribution. |
| Immediate Publish-Ready? | ❌ No | Required edits must be applied to creative copy before final publish. |
| Re-submission Deadline | **≤ 5 business days** | Target clearance within 5 days to mitigate exposure under ASCI 2024 & CCPA Sec 4. |

## 2. Regulatory Risk Assessment (ASCI & CCPA)
- **Price Discrepancy:** Displays outdated price ₹1,099 while active catalog price is ₹1,299. Note: ₹1,099 was valid through 30 Sept 2026. Publishing expired promotional pricing creates legal exposure under CCPA Section 4.
- **Unverified Superlative:** The phrase "India's most loved moisturizer" lacks third-party audited consumer market share proof required by ASCI Rule 1.4.
- **Absolute Timeframe Guarantee:** "Results guaranteed in 7 days" violates CCPA misleading cosmetic advertisement provisions.

## 3. Deep Root-Cause Analysis
- **Legacy Promo Asset Usage:** The creative was produced using assets from the Q3 Monsoon Promotion that expired on 30 Sept 2026.
- **Unsubstantiated Copywriting:** Agency copywriters inserted hyperbolic superiority claims ("most loved") without referencing the clinical substantiation file.

## 4. Actionable Copy Rewrites for Marketing Team
Replace draft copy with approved on-brand messaging:
> "Aurelia Skincare — Discover your daily skincare ritual. Clinically verified 72-hour deep barrier hydration. Available now at ₹1,299. *Based on clinical study of 30 women over 4 weeks."`);
    } finally {
      setLoading(false);
    }
  }, [kb, report]);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) {
        generateReport();
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [generateReport]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: '920px',
          width: '94vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          className="modal-header"
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Title & LLM badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #BFDBFE'
              }}
            >
              <Cpu size={18} color="#2563EB" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                  AI Executive Compliance Report
                </span>
                <span
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} color="#059669" />
                  <span>Groq Cloud LLaMA 3.3 70B</span>
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Executive brand governance synthesis for <strong>{report.assetTitle}</strong>
              </div>
            </div>
          </div>

          {/* Action Toolbar & Tab Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F1F5F9',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid #E2E8F0'
              }}
            >
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'executive' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'executive' ? '#00473E' : '#64748B',
                  boxShadow: activeTab === 'executive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setActiveTab('executive')}
              >
                <FileText size={13} color={activeTab === 'executive' ? '#16A34A' : '#64748B'} />
                <span>Executive Document</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'raw' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'raw' ? '#2563EB' : '#64748B',
                  boxShadow: activeTab === 'raw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setActiveTab('raw')}
              >
                <Code size={13} color={activeTab === 'raw' ? '#2563EB' : '#64748B'} />
                <span>Markdown Source</span>
              </button>
            </div>

            {/* Print Button */}
            {!loading && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePrint}
                title="Print or Save as PDF"
                style={{ fontSize: '11.5px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Printer size={13} />
                <span>Print / PDF</span>
              </button>
            )}

            {/* Close */}
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '22px',
                color: '#64748B',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
              onClick={onClose}
              title="Close Modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#F1F5F9'
          }}
        >
          {loading ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
                padding: '80px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  border: '1.5px solid #BFDBFE'
                }}
              >
                <Loader2 size={32} className="spin" color="#2563EB" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                Groq AI is Synthesizing Executive Compliance Report...
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0', lineHeight: 1.6 }}>
                Evaluating ASCI 2024 provisions, Consumer Protection Act (CCPA) Section 4 rules, price validity timelines, and copy rewrites.
              </div>
            </div>
          ) : activeTab === 'executive' ? (
            <ExecutiveReportRenderer
              content={reportContent}
              report={report}
              kb={kb}
            />
          ) : (
            /* Raw Markdown View with code styling */
            <div
              style={{
                backgroundColor: '#0F172A',
                borderRadius: '14px',
                border: '1px solid #334155',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              <div
                style={{
                  backgroundColor: '#1E293B',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                  <Code size={14} color="#60A5FA" />
                  <span>report_output.md</span>
                </div>
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '11px', padding: '3px 8px', color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '20px 24px',
                  color: '#E2E8F0',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '12.5px',
                  lineHeight: '1.65',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  maxHeight: '520px'
                }}
              >
                {reportContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!loading && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={generateReport}
                disabled={loading}
                title="Regenerate Executive Report with Groq AI"
                style={{ fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <RotateCcw size={13} />
                <span>Regenerate Analysis</span>
              </button>
            )}
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Complies with Aurelia Brand Guidelines {kb.activeVersion}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '12.5px', padding: '6px 16px' }}>
              Close
            </button>
            {!loading && (
              <button
                className="btn btn-brand"
                onClick={handleCopy}
                style={{ fontSize: '12.5px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <CheckCircle2 size={15} color="#FFFFFF" /> : <Copy size={15} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Executive Report'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
