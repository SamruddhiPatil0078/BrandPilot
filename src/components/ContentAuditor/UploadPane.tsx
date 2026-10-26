import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Layers,
  Share2,
  FileCheck,
  Loader2,
  Mail,
  Cpu,
  Clock,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

import { OcrResult } from '../../services/ocrService';

export interface BatchAsset {
  id: string;
  name: string;
  batchCategory: 'Instagram Posts' | 'Marketing Pamphlets' | 'Content Banners';
  type: 'image' | 'pdf' | 'text';
  channel: string;
  description: string;
  draftText: string;
  previewUrl: string;
  detectedLogoTag?: string;
  expectedStatus: 'Violation' | 'Warning' | 'Approved';
  ocrResult?: OcrResult;
  /** Explicit preview layout. Overrides auto-detection. */
  previewFormat?: 'instagram' | 'pamphlet' | 'banner' | 'image';
  /** Caption shown below image in Instagram layout (separate from OCR text). */
  instagramCaption?: string;
  /** Hashtags shown after caption in Instagram layout. */
  instagramHashtags?: string[];
  /** Account username shown in Instagram header. */
  instagramAccount?: string;
}

// Persisted upload history entry
export interface UploadHistoryEntry {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'text';
  previewUrl: string; // data URL for images, empty for others
  draftText: string;
  timestamp: string;
  channel: string;
}

const UPLOAD_HISTORY_KEY = 'brandpilot-upload-history';

export function loadUploadHistory(): UploadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(UPLOAD_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUploadHistory(entries: UploadHistoryEntry[]) {
  // Keep only latest 20 to avoid localStorage bloat
  const trimmed = entries.slice(0, 20);
  try {
    localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Upload history save failed (storage full):', e);
  }
}

export function clearUploadHistory() {
  localStorage.removeItem(UPLOAD_HISTORY_KEY);
}

export const ASSET_BATCHES: {
  category: 'Instagram Posts' | 'Marketing Pamphlets' | 'Content Banners';
  title: string;
  description: string;
  assets: BatchAsset[];
}[] = [
  {
    category: 'Instagram Posts',
    title: 'Batch A: Instagram Social Posts (3 Assets)',
    description: 'Produced by Creative Pulse Agency for Q4 social campaign.',
    assets: [
      {
        id: 'ig-post-1',
        name: 'Post 1: Moisturizer Hero Ad',
        batchCategory: 'Instagram Posts',
        type: 'image',
        channel: 'Instagram Feed & Print Ad',
        description: 'Contains legacy price ₹1,099, "India\'s most loved", "guaranteed in 7 days", outdated logo v2, and miracle cure claim.',
        draftText: `Aurelia Skincare — Discover your daily skincare ritual.
INDIA'S MOST LOVED MOISTURIZER!
RESULTS GUARANTEED IN 7 DAYS!
MIRACLE GLOW — CURES ACNE PERMANENTLY
JUST ₹1,099! Standard price: ₹1,299
Aurelia Deep Hydrating Moisturizer 50g
Deep hydration for naturally glowing skin. Dermatologist inspired, science backed. Supports barrier hydration.
Glow naturally, your promise.
#AureliaSkincare #GlowingSkin #SelfCare`,
        previewUrl: '/assets/aurelia-pamphlet-ad.png',
        previewFormat: 'instagram',
        instagramAccount: 'aurelia.skincare',
        instagramCaption: 'Your new daily ritual is here. ✨ Introducing the Deep Hydrating Moisturizer — deep hydration for naturally glowing skin. Shop now! 💚',
        instagramHashtags: ['#AureliaSkincare', '#GlowingSkin', '#SelfCare', '#SkincareCommunity'],
        detectedLogoTag: 'v2-vintage',
        expectedStatus: 'Violation'
      },
      {
        id: 'ig-post-2',
        name: 'Post 2: Vitamin C Glow Reel',
        batchCategory: 'Instagram Posts',
        type: 'image',
        channel: 'Instagram Reel',
        description: 'Contains miracle radiance, 100% cure for wrinkles, results guaranteed in 48 hours, and expired ₹749 promo.',
        draftText: `AURELIA SKINCARE
VITAMIN C GLOW SERUM
MIRACLE RADIANCE — 100% CURE FOR WRINKLES
RESULTS GUARANTEED IN 48 HOURS!
SPECIAL OFFER: ₹749 ONLY!
*Individual results may vary. Consult a dermatologist before use. Product benefits are based on user experiences and limited studies.`,
        previewUrl: '/assets/test-vitamin-c-ad.jpg',
        previewFormat: 'instagram',
        instagramAccount: 'aurelia.skincare',
        instagramCaption: 'Glow brighter every day with Vitamin C Glow Serum. ☀️ Limited time offer — grab yours now!',
        instagramHashtags: ['#VitaminC', '#GlowSerum', '#AureliaSkincare', '#SkincareRoutine'],
        detectedLogoTag: 'v2-vintage',
        expectedStatus: 'Violation'
      },
      {
        id: 'ig-post-3',
        name: 'Post 3: Barrier Repair Carousel',
        batchCategory: 'Instagram Posts',
        type: 'text',
        channel: 'Instagram Carousel',
        description: '100% compliant on-brand copy referencing study #DS-991 and current ₹1,299 price.',
        draftText: `Aurelia Skincare — Discover your daily skincare ritual.
Formulated with 2% Multi-Weight Hyaluronic Acid and 5 Essential Ceramides.
Provides up to 72 hours of clinically verified deep hydration.
Dermatologist tested and approved for sensitive skin.
Available now at ₹1,299.
*Based on clinical trial of 30 women over 4 weeks using Aurelia Deep Hydrating Moisturizer. Individual results may vary. MRP inclusive of all taxes.`,
        previewUrl: 'compliant-preview',
        previewFormat: 'instagram',
        instagramAccount: 'aurelia.skincare',
        instagramCaption: 'Science meets skincare. Our Deep Hydrating Moisturizer gives you 72 hours of clinically verified deep hydration. Available at ₹1,299.',
        instagramHashtags: ['#AureliaSkincare', '#SkinBarrier', '#Hyaluronic', '#DermatologistApproved'],
        detectedLogoTag: 'v3-approved',
        expectedStatus: 'Approved'
      }
    ]
  },
  {
    category: 'Marketing Pamphlets',
    title: 'Batch B: Marketing Pamphlets & Flyers (3 Assets)',
    description: 'Produced by Metro Print Studio for clinic reception and retail counters.',
    assets: [
      {
        id: 'pamphlet-1',
        name: 'Pamphlet 1: In-Store Clinic Tri-Fold',
        batchCategory: 'Marketing Pamphlets',
        type: 'pdf',
        channel: 'Print Brochure',
        description: 'Carries deprecated Logo v2.1, legacy price ₹1,099, and omits mandatory clinical trial disclaimer.',
        draftText: `AURELIA CLINICAL DERMATOLOGY TRI-FOLD
Pure care, real results.
Aurelia Deep Hydrating Moisturizer 50g.
Special Clinic Price: ₹1,099.
Clinically tested for dry and barrier-damaged skin.
Visit our certified aesthetic partners across India.`,
        previewUrl: 'clinic-brochure',
        previewFormat: 'pamphlet',
        detectedLogoTag: 'v2',
        expectedStatus: 'Violation'
      },
      {
        id: 'pamphlet-2',
        name: 'Pamphlet 2: Patient Efficacy Leaflet',
        batchCategory: 'Marketing Pamphlets',
        type: 'pdf',
        channel: 'Doctor Handout',
        description: 'Claims absolute superiority over competitors without independent audited market studies.',
        draftText: `Patient Guidance Sheet: Product Efficacy Overview
Aurelia provides the best skin hydration on the market.
Guaranteed relief from dermatitis and barrier dryness in 7 days.
Recommended by top doctors nationwide. Standard price: ₹1,299.`,
        previewUrl: 'pharma-pdf-preview',
        previewFormat: 'pamphlet',
        detectedLogoTag: 'v2',
        expectedStatus: 'Warning'
      },
      {
        id: 'pamphlet-3',
        name: 'Pamphlet 3: Salon & Spa Partner Flyer',
        batchCategory: 'Marketing Pamphlets',
        type: 'pdf',
        channel: 'Spa Handout',
        description: 'Contains outdated Monsoon Sale promo validity date (ended 30 Sept 2026).',
        draftText: `Exclusive Spa Partnership Program — Aurelia Skincare
Discover your daily skincare ritual.
Aurelia Hydrating Moisturizer 50g — Partner rate: ₹1,099.
Offer valid strictly through 30 September 2026.
*Based on clinical trial of 30 women over 4 weeks.`,
        previewUrl: 'clinic-brochure',
        previewFormat: 'pamphlet',
        detectedLogoTag: 'v2',
        expectedStatus: 'Violation'
      }
    ]
  },
  {
    category: 'Content Banners',
    title: 'Batch C: Content Banners & Digital Copy (3 Assets)',
    description: 'Produced by In-House Digital Team for web and retargeting ads.',
    assets: [
      {
        id: 'banner-1',
        name: 'Banner 1: Website Hero Banner Copy',
        batchCategory: 'Content Banners',
        type: 'text',
        channel: 'Website Banner',
        description: 'Uses active price ₹1,299, but references retired 2025 slogan "Your skin, our secret".',
        draftText: `Aurelia Skincare — Your skin, our secret.
Experience 72 hours of deep barrier restoration.
Now in stock: Aurelia Deep Hydrating Moisturizer at ₹1,299.
Complimentary mini cleanser with every order this week.
*Based on clinical trial of 30 women over 4 weeks.`,
        previewUrl: 'website-hero',
        previewFormat: 'banner',
        detectedLogoTag: 'v3-approved',
        expectedStatus: 'Warning'
      },
      {
        id: 'banner-2',
        name: 'Banner 2: Google Display Network Ad',
        batchCategory: 'Content Banners',
        type: 'text',
        channel: 'Display Ad',
        description: 'Employs aggressive FOMO and urgent hype tone prohibited under brand guidelines.',
        draftText: `URGENT ALERT: Stocks running out fast!
Buy Aurelia Deep Hydrating Moisturizer today for only ₹1,099 before permanent price increase!
Miracle skin transformation guaranteed!
Click now to claim your bottle!`,
        previewUrl: 'website-hero',
        previewFormat: 'banner',
        detectedLogoTag: 'v2',
        expectedStatus: 'Violation'
      },
      {
        id: 'banner-3',
        name: 'Banner 3: E-Commerce Catalog PDP',
        batchCategory: 'Content Banners',
        type: 'text',
        channel: 'Product Page',
        description: 'Fully compliant product detail page text aligning with active catalog v3.2.',
        draftText: `Aurelia Deep Hydrating Moisturizer (50g)
Discover your daily skincare ritual.
Formulated with 2% Multi-Weight Hyaluronic Acid and 5 Essential Ceramides.
Current Price: ₹1,299 inclusive of all taxes.
*Based on clinical trial of 30 women over 4 weeks. Individual results may vary.`,
        previewUrl: 'compliant-preview',
        previewFormat: 'banner',
        detectedLogoTag: 'v3-approved',
        expectedStatus: 'Approved'
      }
    ]
  }
];

interface UploadPaneProps {
  selectedAsset: BatchAsset;
  onSelectAsset: (asset: BatchAsset) => void;
  onFileUpload: (file: File) => void;
  onTextChange: (text: string) => void;
  currentText: string;
  isAuditing: boolean;
  onRunAudit: () => void;
  auditProgress: { percent: number; status: string } | null;
  onOpenEmailModal: () => void;
  onOpenGroqReportModal: () => void;
  uploadHistory: UploadHistoryEntry[];
  onClearHistory: () => void;
}

export const UploadPane: React.FC<UploadPaneProps> = ({
  selectedAsset,
  onSelectAsset,
  onFileUpload,
  onTextChange,
  currentText,
  isAuditing,
  onRunAudit,
  auditProgress,
  onOpenEmailModal,
  onOpenGroqReportModal,
  uploadHistory,
  onClearHistory
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [customInputMode, setCustomInputMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleSelectHistoryEntry = (entry: UploadHistoryEntry) => {
    const asset: BatchAsset = {
      id: `history-${entry.id}`,
      name: entry.name,
      batchCategory: 'Content Banners',
      type: entry.type,
      channel: entry.channel,
      description: `Uploaded: ${entry.name} (${new Date(entry.timestamp).toLocaleString()})`,
      draftText: entry.draftText,
      previewUrl: entry.previewUrl,
      expectedStatus: 'Warning'
    };
    onSelectAsset(asset);
    setShowHistory(false);
  };

  const currentBatch = ASSET_BATCHES[selectedBatchIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Pane Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '12px'
            }}
          >
            1
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Select Draft Asset / Batch
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              3 Batches: Social Posts, Pamphlets, Banners
            </div>
          </div>
        </div>

        {/* Upload History Toggle */}
        {uploadHistory.length > 0 && (
          <button
            className={`btn btn-sm ${showHistory ? 'btn-brand' : 'btn-secondary'}`}
            onClick={() => setShowHistory(!showHistory)}
            style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Clock size={12} />
            <span>History ({uploadHistory.length})</span>
          </button>
        )}
      </div>

      {/* Upload History Panel */}
      {showHistory && uploadHistory.length > 0 && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1.5px solid #CBD5E1',
            borderRadius: '12px',
            padding: '12px',
            maxHeight: '240px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#2563EB" />
              Upload History
            </span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={onClearHistory}
              style={{ fontSize: '10px', padding: '2px 8px', color: '#DC2626', borderColor: '#FECACA' }}
            >
              <Trash2 size={10} />
              <span>Clear All</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {uploadHistory.map(entry => {
              const isActive = selectedAsset.id === `history-${entry.id}`;
              return (
                <div
                  key={entry.id}
                  onClick={() => handleSelectHistoryEntry(entry)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isActive ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {/* Thumbnail */}
                  {entry.type === 'image' && entry.previewUrl ? (
                    <img
                      src={entry.previewUrl}
                      alt={entry.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #CBD5E1',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: entry.type === 'pdf' ? '#FEF3C7' : '#EFF6FF',
                        border: `1px solid ${entry.type === 'pdf' ? '#FDE68A' : '#BFDBFE'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={18} color={entry.type === 'pdf' ? '#D97706' : '#2563EB'} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: entry.type === 'image' ? '#DBEAFE' : entry.type === 'pdf' ? '#FEF3C7' : '#F1F5F9',
                          color: entry.type === 'image' ? '#1D4ED8' : entry.type === 'pdf' ? '#92400E' : '#475569',
                          textTransform: 'uppercase'
                        }}
                      >
                        {entry.type}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                        {new Date(entry.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Selector Tabs (User requested 3 pamphlets, 3 insta posts, 3 banners) */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
        {ASSET_BATCHES.map((batch, idx) => (
          <button
            key={batch.category}
            className={`btn btn-sm ${selectedBatchIndex === idx && !customInputMode && !showHistory ? 'btn-brand' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none', padding: '6px 4px', fontSize: '11.5px' }}
            onClick={() => {
              setSelectedBatchIndex(idx);
              setCustomInputMode(false);
              setShowHistory(false);
              onSelectAsset(batch.assets[0]);
            }}
          >
            {batch.category === 'Instagram Posts' ? '3x Insta Posts' : batch.category === 'Marketing Pamphlets' ? '3x Pamphlets' : '3x Banners'}
          </button>
        ))}
      </div>

      {/* Assets within Selected Batch */}
      {!customInputMode && !showHistory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
            {currentBatch.title}
          </div>

          {currentBatch.assets.map(asset => {
            const isSelected = selectedAsset.id === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.12)' : '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                    {asset.name}
                  </div>
                  <span
                    className={`badge ${
                      asset.expectedStatus === 'Violation'
                        ? 'badge-violation'
                        : asset.expectedStatus === 'Warning'
                        ? 'badge-unverified'
                        : 'badge-success'
                    }`}
                    style={{ fontSize: '9.5px', padding: '2px 6px' }}
                  >
                    {asset.expectedStatus}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                  {asset.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Upload or Custom Text Toggle */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid #E2E8F0' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.txt"
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, fontSize: '11.5px' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={13} />
          <span>Upload Custom File (OCR)</span>
        </button>

        <button
          className={`btn btn-sm ${customInputMode ? 'btn-brand' : 'btn-secondary'}`}
          style={{ flex: 1, fontSize: '11.5px' }}
          onClick={() => { setCustomInputMode(!customInputMode); setShowHistory(false); }}
        >
          <FileText size={13} />
          <span>Paste Custom Text</span>
        </button>
      </div>

      {customInputMode && (
        <div>
          <label className="form-label">Custom Draft Marketing Copy</label>
          <textarea
            className="form-textarea"
            rows={5}
            value={currentText}
            onChange={e => onTextChange(e.target.value)}
            placeholder="Type or paste draft copy here to run exact checks and Groq AI tone analysis..."
          />
        </div>
      )}

      {/* Run Audit Button */}
      {isAuditing ? (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#EFF6FF',
            borderRadius: '10px',
            border: '1px solid #BFDBFE'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Loader2 size={16} className="spin" color="#2563EB" />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E40AF' }}>
              {auditProgress?.status || 'Analyzing against Brand Memory...'}
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#DBEAFE', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: '#2563EB',
                width: `${auditProgress?.percent || 55}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          style={{ padding: '11px', fontSize: '13.5px', fontWeight: 700, borderRadius: '10px' }}
          onClick={onRunAudit}
        >
          <Sparkles size={16} />
          <span>Run Evidence Audit</span>
        </button>
      )}

      {/* NEW Action Buttons: "Send Back Email" and "Groq AI Report" */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenEmailModal}
          style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
          title="Send rejection notification to creator"
        >
          <Mail size={13} />
          <span>Send Back Email</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenGroqReportModal}
          style={{ color: '#2563EB', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
          title="Generate executive team report with Groq AI"
        >
          <Cpu size={13} />
          <span>Groq AI Report</span>
        </button>
      </div>
    </div>
  );
};
