import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Check,
  Copy,
  Calendar,
  User,
  Target,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { AuditReport } from '../../types/audit';
import { BrandKnowledgeBase } from '../../types/brand';

interface ExecutiveReportRendererProps {
  content: string;
  report: AuditReport;
  kb: BrandKnowledgeBase;
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown AST Node Types
// ─────────────────────────────────────────────────────────────────────────────

type BlockNode =
  | { type: 'header'; level: number; text: string }
  | { type: 'metadata'; items: Array<{ label: string; value: string }> }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'blockquote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'divider' }
  | { type: 'paragraph'; text: string };

// ─────────────────────────────────────────────────────────────────────────────
// Markdown Parser
// ─────────────────────────────────────────────────────────────────────────────

function parseMarkdown(md: string): BlockNode[] {
  const lines = md.split('\n');
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Headings: # Level 1, ## Level 2, ### Level 3
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      blocks.push({
        type: 'header',
        level: headerMatch[1].length,
        text: headerMatch[2].trim()
      });
      i++;
      continue;
    }

    // Markdown Table: line starts and ends with | (or contains |) and followed by |--
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].includes('|') &&
      lines[i + 1].includes('---')
    ) {
      const headerLine = trimmed;
      i += 2; // skip header line and separator line
      const rows: string[][] = [];

      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowRaw = lines[i].trim();
        // Split by pipe and remove first and last empty elements
        const cells = rowRaw
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        if (cells.length > 0) {
          rows.push(cells);
        }
        i++;
      }

      const headers = headerLine
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());

      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Blockquote: lines starting with >
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    // Key-Value metadata header lines: **Label:** Value
    if (trimmed.startsWith('**') && trimmed.includes(':**')) {
      const metaItems: Array<{ label: string; value: string }> = [];
      while (i < lines.length && lines[i].trim().startsWith('**') && lines[i].trim().includes(':**')) {
        const match = lines[i].trim().match(/^\*\*([^:]+):\*\*\s*(.*)$/);
        if (match) {
          metaItems.push({ label: match[1].trim(), value: match[2].trim().replace(/^\*|\*$/g, '') });
        }
        i++;
      }
      if (metaItems.length > 0) {
        blocks.push({ type: 'metadata', items: metaItems });
        continue;
      }
    }

    // List: unordered (- or *) or ordered (1. 2.)
    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      while (i < lines.length && (/^[-*+]\s+/.test(lines[i].trim()) || /^\d+\.\s+/.test(lines[i].trim()))) {
        const itemText = lines[i].trim().replace(/^([-*+]|\d+\.)\s+/, '');
        listItems.push(itemText);
        i++;
      }
      blocks.push({ type: 'list', ordered: isOrdered, items: listItems });
      continue;
    }

    // Paragraph
    const paraLines: string[] = [rawLine];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('---') &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith('**') && lines[i].trim().includes(':**'))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Text Formatter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Smart detection of status phrases inside table cells and text to render
 * badges instead of plain words.
 */
function renderSmartTableCell(text: string): React.ReactNode {
  const clean = text.replace(/[*_`]/g, '').trim();

  // Conditional Approval
  if (/conditional\s+approval|conditional/i.test(clean)) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FCD34D',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontWeight: 700,
          fontSize: '11.5px',
          letterSpacing: '0.2px'
        }}
      >
        <AlertTriangle size={12} color="#D97706" />
        <span>Conditional Approval</span>
      </span>
    );
  }

  // Approved / Yes / Compliant
  if (/^approved$|^yes$|publish-ready|compliant/i.test(clean) && !/non|not|un/i.test(clean)) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontWeight: 700,
          fontSize: '11.5px'
        }}
      >
        <CheckCircle2 size={12} color="#059669" />
        <span>{clean}</span>
      </span>
    );
  }

  // Rejected / No / Violation
  if (/❌\s*no|^no$|rejected|prohibited|violation/i.test(clean)) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontWeight: 700,
          fontSize: '11.5px'
        }}
      >
        <XCircle size={12} color="#DC2626" />
        <span>{clean}</span>
      </span>
    );
  }

  // Deadlines / Timeframes (e.g. <= 5 business days)
  if (/business days|deadline|within \d+/i.test(clean)) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #BFDBFE',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontWeight: 700,
          fontSize: '11.5px'
        }}
      >
        <Clock size={12} color="#2563EB" />
        <span>{clean}</span>
      </span>
    );
  }

  // Fallback to normal inline markdown formatting
  return renderInline(text);
}

/**
 * Formats inline Markdown: **bold**, *italic*, `code`
 */
function renderInline(text: string): React.ReactNode {
  // Regex to split by **bold**, *italic*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      // High-risk or status badges inside bold text
      if (/high risk|prohibited|mandatory revision|violation/i.test(inner)) {
        return (
          <span
            key={index}
            style={{
              color: '#DC2626',
              fontWeight: 800,
              backgroundColor: '#FEF2F2',
              padding: '1px 6px',
              borderRadius: '4px',
              border: '1px solid #FECACA'
            }}
          >
            {inner}
          </span>
        );
      }
      return (
        <strong key={index} style={{ fontWeight: 700, color: '#0F172A' }}>
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} style={{ fontStyle: 'italic', color: '#475569' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#F1F5F9',
            color: '#0F172A',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            border: '1px solid #E2E8F0'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Executive Report Component
// ─────────────────────────────────────────────────────────────────────────────

export const ExecutiveReportRenderer: React.FC<ExecutiveReportRendererProps> = ({
  content,
  report,
  kb
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const blocks = React.useMemo(() => parseMarkdown(content), [content]);

  // Overall compliance status badge
  const score = report.overallScore;
  const isApproved = score >= 90;
  const isConditional = score >= 70 && score < 90;
  const isRejected = score < 70;

  const handleCopyText = (textToCopy: string, sectionId: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div
      className="executive-report-document"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #CBD5E1',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#1E293B'
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          1. Official Executive Letterhead & Brand Seal
          ───────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #00473E 60%, #0F172A 100%)',
          color: '#FFFFFF',
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '4px solid #C89B3C'
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200, 155, 60, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Brand & Letterhead Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00473E 0%, #16A34A 100%)',
                border: '2px solid #C89B3C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: '24px',
                fontFamily: 'serif',
                letterSpacing: '1px'
              }}
            >
              A
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#C89B3C' }}>
                  {kb.brandName}
                </span>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                  Memory {kb.activeVersion}
                </span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0', color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.25 }}>
                Executive Brand Compliance & Legal Audit
              </h1>
              <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} color="#C89B3C" />
                <span>AI Governance Synthesis Powered by Groq LLaMA 3.3 70B & ASCI Standard 2024</span>
              </div>
            </div>
          </div>

          {/* Official Audit Verdict Stamp Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div
              style={{
                backgroundColor: isApproved ? '#065F46' : isConditional ? '#78350F' : '#7F1D1D',
                border: `2px solid ${isApproved ? '#34D399' : isConditional ? '#FBBF24' : '#F87171'}`,
                borderRadius: '10px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                color: '#FFFFFF'
              }}
            >
              {isApproved && <ShieldCheck size={20} color="#34D399" />}
              {isConditional && <AlertTriangle size={20} color="#FBBF24" />}
              {isRejected && <ShieldAlert size={20} color="#F87171" />}
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 700 }}>
                  Compliance Verdict
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.5px' }}>
                  {isApproved ? 'APPROVED FOR PUBLISH' : isConditional ? 'CONDITIONAL CLEARANCE' : 'REVISION MANDATORY'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Compliance Score:</span>
              <strong style={{ color: isApproved ? '#4ADE80' : isConditional ? '#FCD34D' : '#FCA5A5', fontSize: '13px' }}>
                {report.overallScore}%
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. Executive Metadata Strip Cards
          ───────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '16px 28px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={16} color="#2563EB" />
          </div>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>Target Asset</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
              {report.assetTitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={16} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>Date of Review</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
              {new Date(report.auditTimestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>Prepared By</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>Brand Governance Office</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck2 size={16} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>Regulatory Standard</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>ASCI 2024 & CCPA Sec 4</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. Document Body — Aesthetic Markdown Elements
          ───────────────────────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {blocks.map((block, idx) => {
          // ── Divider ──
          if (block.type === 'divider') {
            return (
              <hr
                key={idx}
                style={{
                  border: 'none',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, #CBD5E1 30%, #CBD5E1 70%, transparent)',
                  margin: '8px 0'
                }}
              />
            );
          }

          // ── Heading ──
          if (block.type === 'header') {
            if (block.level === 1) {
              // Main title already represented in header; render as subtle subheader if distinct
              return (
                <div
                  key={idx}
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#00473E',
                    paddingBottom: '6px',
                    borderBottom: '2px solid #E2E8F0',
                    letterSpacing: '-0.2px'
                  }}
                >
                  {renderInline(block.text)}
                </div>
              );
            }

            if (block.level === 2) {
              // Section header with badge & accent
              const numMatch = block.text.match(/^(\d+)\.\s*(.*)$/);
              const sectionNum = numMatch ? numMatch[1] : null;
              const sectionTitle = numMatch ? numMatch[2] : block.text;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #E2E8F0',
                    marginTop: idx > 0 ? '12px' : '0'
                  }}
                >
                  {sectionNum && (
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#00473E',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '12.5px',
                        flexShrink: 0
                      }}
                    >
                      {sectionNum}
                    </div>
                  )}
                  <h2
                    style={{
                      fontSize: '16.5px',
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                      letterSpacing: '-0.2px'
                    }}
                  >
                    {renderInline(sectionTitle)}
                  </h2>
                </div>
              );
            }

            // Subsections (h3 / h4)
            return (
              <h3
                key={idx}
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#1E293B',
                  margin: '4px 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                <span>{renderInline(block.text)}</span>
              </h3>
            );
          }

          // ── Key-Value Metadata Cards (if extracted in body) ──
          if (block.type === 'metadata') {
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px'
                }}
              >
                {block.items.map((item, mIdx) => (
                  <div key={mIdx}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.label}:{' '}
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          // ── Tables ──
          if (block.type === 'table') {
            return (
              <div
                key={idx}
                style={{
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  margin: '4px 0'
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '12.5px',
                      lineHeight: '1.5',
                      textAlign: 'left'
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                        {block.headers.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            style={{
                              padding: '11px 16px',
                              fontWeight: 700,
                              fontSize: '11.5px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                              borderBottom: '1px solid #334155',
                              borderRight: hIdx < block.headers.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          style={{
                            backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                            transition: 'background-color 0.15s ease',
                            borderBottom: rIdx < block.rows.length - 1 ? '1px solid #E2E8F0' : 'none'
                          }}
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              style={{
                                padding: '12px 16px',
                                color: '#334155',
                                verticalAlign: 'top',
                                borderRight: cIdx < row.length - 1 ? '1px solid #F1F5F9' : 'none',
                                fontWeight: cIdx === 0 ? 600 : 400
                              }}
                            >
                              {renderSmartTableCell(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          // ── Lists (Bullets / Risks / Policy Points) ──
          if (block.type === 'list') {
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  margin: '2px 0'
                }}
              >
                {block.items.map((item, lIdx) => {
                  // Check if item has a bold tag lead-in: **Tag:** description
                  const boldLeadMatch = item.match(/^\*\*([^*]+):\*\*\s*(.*)$/);

                  if (boldLeadMatch) {
                    const tag = boldLeadMatch[1];
                    const desc = boldLeadMatch[2];

                    // Classify severity or category based on tag
                    const isPrice = /price/i.test(tag);
                    const isClaim = /superlative|claim|guarantee/i.test(tag);
                    const isMedical = /cure|medical|dermatologist/i.test(tag);

                    const accentColor = isPrice || isMedical ? '#DC2626' : isClaim ? '#D97706' : '#2563EB';
                    const bgColor = isPrice || isMedical ? '#FEF2F2' : isClaim ? '#FFFBEB' : '#F8FAFC';
                    const borderColor = isPrice || isMedical ? '#FECACA' : isClaim ? '#FDE68A' : '#E2E8F0';

                    return (
                      <div
                        key={lIdx}
                        style={{
                          backgroundColor: bgColor,
                          border: `1px solid ${borderColor}`,
                          borderLeft: `4px solid ${accentColor}`,
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '12.5px',
                          lineHeight: 1.6
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <AlertCircle size={14} color={accentColor} />
                          <strong style={{ color: '#0F172A', fontWeight: 800 }}>{tag}</strong>
                        </div>
                        <div style={{ color: '#334155' }}>{renderInline(desc)}</div>
                      </div>
                    );
                  }

                  // Default clean bullet
                  return (
                    <div
                      key={lIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: '#334155'
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#00473E',
                          marginTop: '8px',
                          flexShrink: 0
                        }}
                      />
                      <div>{renderInline(item)}</div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // ── Blockquote (Actionable Copy Rewrites) ──
          if (block.type === 'blockquote') {
            const cleanText = block.text.replace(/^["“”']|["“”']$/g, '');
            const copyId = `quote-${idx}`;
            const isCopied = copiedSection === copyId;

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  position: 'relative',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.08)',
                  margin: '6px 0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      Approved On-Brand Copy Replacement
                    </span>
                  </div>
                  <button
                    className="btn btn-sm btn-brand"
                    style={{ fontSize: '11px', padding: '3px 10px', backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                    onClick={() => handleCopyText(cleanText, copyId)}
                    title="Copy approved marketing copy to clipboard"
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isCopied ? 'Copied!' : 'Copy Approved Copy'}</span>
                  </button>
                </div>

                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#064E3B',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0'
                  }}
                >
                  &ldquo;{cleanText}&rdquo;
                </div>
              </div>
            );
          }

          // ── Paragraph ──
          if (block.type === 'paragraph') {
            return (
              <p
                key={idx}
                style={{
                  margin: 0,
                  fontSize: '13px',
                  lineHeight: '1.7',
                  color: '#334155'
                }}
              >
                {renderInline(block.text)}
              </p>
            );
          }

          return null;
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. Official Governance Sign-Off Footer
          ───────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: '#64748B',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
          <span>
            Office of Brand Governance & Compliance — <strong>{kb.brandName}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>Verification: <code>BP-SEC-v3-{Date.now().toString(36).toUpperCase()}</code></span>
          <span style={{ color: '#94A3B8' }}>·</span>
          <span style={{ fontWeight: 600 }}>Confidential — Internal Team Review</span>
        </div>
      </div>
    </div>
  );
};
