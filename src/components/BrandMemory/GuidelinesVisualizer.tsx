import React, { useState } from 'react';
import {
  Palette,
  Type,
  Mic2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Edit2,
  Check,
  History,
  Calendar
} from 'lucide-react';
import { BrandKnowledgeBase, ColorToken } from '../../types/brand';

interface GuidelinesVisualizerProps {
  kb: BrandKnowledgeBase;
  onUpdateKb: (updated: BrandKnowledgeBase) => void;
}

export const GuidelinesVisualizer: React.FC<GuidelinesVisualizerProps> = ({ kb, onUpdateKb }) => {
  const [editingTone, setEditingTone] = useState(false);
  const [primaryTagline, setPrimaryTagline] = useState(kb.tone.primaryTagline);
  const [voiceDesc, setVoiceDesc] = useState(kb.tone.voiceDescription);
  const [newApprovedTone, setNewApprovedTone] = useState('');
  const [newBannedTone, setNewBannedTone] = useState('');

  // Retired Slogan Add form
  const [showAddPastSlogan, setShowAddPastSlogan] = useState(false);
  const [pastSloganText, setPastSloganText] = useState('');
  const [pastSloganDate, setPastSloganDate] = useState('2026-09-30');
  const [pastSloganReason, setPastSloganReason] = useState('');

  // Color add modal state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [newColorUsage, setNewColorUsage] = useState('');
  const [showColorForm, setShowColorForm] = useState(false);

  const handleSaveTone = () => {
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        primaryTagline,
        voiceDescription: voiceDesc
      },
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updated);
    setEditingTone(false);
  };

  const handleAddPastSlogan = () => {
    if (!pastSloganText.trim()) return;
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        pastTaglines: [
          ...kb.tone.pastTaglines,
          {
            tagline: pastSloganText.trim(),
            validUntil: pastSloganDate,
            reason: pastSloganReason.trim() || 'Archived previous brand slogan'
          }
        ]
      }
    };
    onUpdateKb(updated);
    setPastSloganText('');
    setPastSloganReason('');
    setShowAddPastSlogan(false);
  };

  const handleRemovePastSlogan = (index: number) => {
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        pastTaglines: kb.tone.pastTaglines.filter((_, i) => i !== index)
      }
    };
    onUpdateKb(updated);
  };

  const handleAddApprovedTone = () => {
    if (!newApprovedTone.trim()) return;
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        approvedToneKeywords: [...kb.tone.approvedToneKeywords, newApprovedTone.trim()]
      }
    };
    onUpdateKb(updated);
    setNewApprovedTone('');
  };

  const handleRemoveApprovedTone = (index: number) => {
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        approvedToneKeywords: kb.tone.approvedToneKeywords.filter((_, i) => i !== index)
      }
    };
    onUpdateKb(updated);
  };

  const handleAddBannedTone = () => {
    if (!newBannedTone.trim()) return;
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        bannedToneKeywords: [...kb.tone.bannedToneKeywords, newBannedTone.trim()]
      }
    };
    onUpdateKb(updated);
    setNewBannedTone('');
  };

  const handleRemoveBannedTone = (index: number) => {
    const updated: BrandKnowledgeBase = {
      ...kb,
      tone: {
        ...kb.tone,
        bannedToneKeywords: kb.tone.bannedToneKeywords.filter((_, i) => i !== index)
      }
    };
    onUpdateKb(updated);
  };

  const handleAddColor = () => {
    if (!newColorName.trim() || !newColorHex.trim()) return;
    const newToken: ColorToken = {
      id: `c-${Date.now()}`,
      name: newColorName.trim(),
      hex: newColorHex.trim(),
      usage: newColorUsage.trim() || 'General marketing brand accent'
    };
    const updated: BrandKnowledgeBase = {
      ...kb,
      colors: [...kb.colors, newToken]
    };
    onUpdateKb(updated);
    setNewColorName('');
    setNewColorUsage('');
    setShowColorForm(false);
  };

  const handleRemoveColor = (id: string) => {
    const updated: BrandKnowledgeBase = {
      ...kb,
      colors: kb.colors.filter(c => c.id !== id)
    };
    onUpdateKb(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: Brand Voice & Slogan Standards in Curved Rounded Box */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Mic2 size={20} color="#00473E" />
            <span>Brand Voice, Slogan Standards & Historical Context</span>
          </div>
          {!editingTone ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingTone(true)}>
              <Edit2 size={13} />
              <span>Edit Voice & Slogans</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-brand btn-sm" onClick={handleSaveTone}>
                <Check size={14} />
                <span>Save Changes</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingTone(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px' }}>
          {/* Left Column: Slogans & Previous Slogan Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Primary Slogan */}
            <div>
              <label className="form-label">Primary Approved Slogan / Tagline</label>
              {!editingTone ? (
                <div className="slogan-active-box">
                  <div>
                    <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                      Active Truth (v{kb.activeVersion})
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#00473E' }}>
                      "{kb.tone.primaryTagline}"
                    </div>
                  </div>
                  <CheckCircle2 size={24} color="#16A34A" />
                </div>
              ) : (
                <input
                  className="form-input"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                  value={primaryTagline}
                  onChange={e => setPrimaryTagline(e.target.value)}
                  placeholder="Enter approved primary tagline"
                />
              )}
            </div>

            {/* Previous Slogans with Context (User explicit request) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ color: '#991B1B', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <History size={13} />
                  <span>Previous Retired Slogans & Audit Context</span>
                </label>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => setShowAddPastSlogan(!showAddPastSlogan)}
                >
                  <Plus size={11} />
                  <span>Add Retired Slogan</span>
                </button>
              </div>

              {showAddPastSlogan && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <input
                    className="form-input"
                    placeholder="e.g. Pure care, your promise"
                    value={pastSloganText}
                    onChange={e => setPastSloganText(e.target.value)}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={pastSloganDate}
                      onChange={e => setPastSloganDate(e.target.value)}
                    />
                    <input
                      className="form-input"
                      placeholder="Retirement context (e.g. Replaced in Oct 2026)"
                      value={pastSloganReason}
                      onChange={e => setPastSloganReason(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPastSlogan(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-brand btn-sm" onClick={handleAddPastSlogan}>
                      Add to Historical Archive
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {kb.tone.pastTaglines.map((pt, idx) => (
                  <div key={idx} className="slogan-past-pill">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '13px', color: '#991B1B' }}>"{pt.tagline}"</strong>
                      <button
                        onClick={() => handleRemovePastSlogan(idx)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0 4px' }}
                        title="Remove past slogan"
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7F1D1D' }}>
                      <Calendar size={11} />
                      <span>Retired on {pt.validUntil}</span>
                      <span>•</span>
                      <span>{pt.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Approved Variations */}
            <div>
              <label className="form-label">Secondary Approved Taglines</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {kb.tone.secondaryTaglines.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13px',
                      color: '#334155',
                      fontWeight: 500
                    }}
                  >
                    • {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Voice Description & Tone Attributes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Brand Voice Description & Posture</label>
              {!editingTone ? (
                <div
                  style={{
                    padding: '14px 16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    lineHeight: '1.65',
                    color: '#334155'
                  }}
                >
                  {kb.tone.voiceDescription}
                </div>
              ) : (
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={voiceDesc}
                  onChange={e => setVoiceDesc(e.target.value)}
                />
              )}
            </div>

            {/* Approved Tone Attributes with Green Pills */}
            <div>
              <label className="form-label" style={{ color: '#166534' }}>
                Approved Tone Attributes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '8px' }}>
                {kb.tone.approvedToneKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="badge badge-success"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{kw}</span>
                    <button
                      onClick={() => handleRemoveApprovedTone(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', padding: '0 2px', fontSize: '14px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '12.5px' }}
                  placeholder="Add approved tone keyword (e.g. Clinical)"
                  value={newApprovedTone}
                  onChange={e => setNewApprovedTone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddApprovedTone()}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddApprovedTone}>
                  Add
                </button>
              </div>
            </div>

            {/* Restricted / Prohibited Tone Attributes with Red Pills */}
            <div>
              <label className="form-label" style={{ color: '#DC2626' }}>
                Restricted / Prohibited Tone Attributes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '8px' }}>
                {kb.tone.bannedToneKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="badge badge-violation"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    <AlertTriangle size={13} />
                    <span>{kw}</span>
                    <button
                      onClick={() => handleRemoveBannedTone(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '0 2px', fontSize: '14px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '12.5px' }}
                  placeholder="Add restricted tone (e.g. Miracle Promises)"
                  value={newBannedTone}
                  onChange={e => setNewBannedTone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddBannedTone()}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddBannedTone}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Brand Color Palette (Image 1 Style) */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Palette size={20} color="#2563EB" />
            <span>Brand Color Palette & Swatches (Image 1 Compliance System)</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowColorForm(!showColorForm)}>
            <Plus size={14} />
            <span>Add Brand Color</span>
          </button>
        </div>

        {showColorForm && (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Color Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Amber Glow Accent"
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Hex Code</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={e => setNewColorHex(e.target.value)}
                    style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                  />
                  <input
                    className="form-input"
                    value={newColorHex}
                    onChange={e => setNewColorHex(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Approved Usage Rule</label>
                <input
                  className="form-input"
                  placeholder="e.g. Primary headline or header CTA only"
                  value={newColorUsage}
                  onChange={e => setNewColorUsage(e.target.value)}
                />
              </div>
              <div>
                <button className="btn btn-primary" onClick={handleAddColor}>
                  Save Color
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Circular Swatches matching Image 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Palette Swatches:
          </span>
          {kb.colors.map(c => (
            <div
              key={c.id}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: c.hex,
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                cursor: 'pointer'
              }}
              title={`${c.name} (${c.hex})`}
            >
              <CheckCircle2 size={16} />
            </div>
          ))}
        </div>

        {/* Detailed Color Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
          {kb.colors.map(c => (
            <div
              key={c.id}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              <div
                style={{
                  height: '60px',
                  backgroundColor: c.hex,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  padding: '8px'
                }}
              >
                <span
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    color: '#FFF',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                >
                  {c.hex}
                </span>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{c.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {c.isPrimary ? (
                      <span className="badge badge-success">Primary</span>
                    ) : (
                      <button
                        className="btn btn-secondary btn-icon-only btn-sm"
                        style={{ padding: '2px', border: 'none', color: '#94A3B8' }}
                        onClick={() => handleRemoveColor(c.id)}
                        title={`Remove color ${c.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{c.usage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Typography Standards (Image 1 Style) */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Type size={20} color="#0F172A" />
            <span>Typography Checker & Standard Hierarchy</span>
          </div>
          <span className="badge badge-neutral">Font Family: Arial Standard</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {kb.typography.map(t => (
            <div
              key={t.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{t.role}</span>
                  <span className="badge badge-inconsistency">{t.size}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '10px' }}>
                  Font: <strong>{t.family}</strong> • Weight: <strong>{t.weight}</strong>
                </div>
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: t.id === 't1' ? '18px' : t.id === 't2' ? '15px' : '13px',
                  fontWeight: t.id === 't1' || t.id === 't2' ? 700 : 400,
                  color: '#0F172A'
                }}
              >
                Sample Preview: Aurelia Skincare
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Brand Logos Comparison (Current Approved v3 vs Deprecated v2) */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <ImageIcon size={20} color="#C89B3C" />
            <span>Brand Logos & Visual Identity Assets</span>
          </div>
          <span className="badge badge-success">Approved Standard: Logo v3.0</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {kb.logos.map(logo => {
            const isApproved = logo.status === 'Approved Current';
            return (
              <div
                key={logo.id}
                style={{
                  border: isApproved ? '2px solid #BBF7D0' : '2px dashed #FECACA',
                  backgroundColor: isApproved ? '#F0FDF4' : '#FEF2F2',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '18px'
                }}
              >
                {/* Visual Emblem Representation */}
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '12px',
                    backgroundColor: isApproved ? '#00473E' : '#991B1B',
                    color: '#FFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '8px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.12)'
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '1px' }}>
                    {isApproved ? 'A' : 'AV'}
                  </div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isApproved ? 'Aurelia v3' : 'Vintage v2'}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '14.5px' }}>{logo.name}</span>
                    <span className={`badge ${isApproved ? 'badge-success' : 'badge-violation'}`}>
                      {logo.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                    Version: <strong>{logo.version}</strong> | Safe Margin: <strong>{logo.clearZone}</strong>
                  </div>

                  <div style={{ fontSize: '12.5px', marginTop: '8px', color: '#334155' }}>
                    {logo.notes}
                  </div>

                  {logo.deprecatedDate && (
                    <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '6px', fontWeight: 700 }}>
                      Retired on {logo.deprecatedDate}. Prohibited in all new creative campaigns!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
