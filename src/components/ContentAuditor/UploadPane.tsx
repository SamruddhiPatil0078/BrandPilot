import React, { useRef, useState } from 'react';
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
  Cpu
} from 'lucide-react';

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
        detectedLogoTag: 'v2-vintage',
        expectedStatus: 'Violation'
      },
      {
        id: 'ig-post-2',
        name: 'Post 2: Vitamin C Glow Reel',
        batchCategory: 'Instagram Posts',
        type: 'image',
        channel: 'Instagram Reel',
        description: 'Promotes rapid miracle cure for hyperpigmentation without clinical trial documentation.',
        draftText: `Aurelia Skincare — Vitamin C Miracle Radiance!
Instant glow guaranteed in 48 hours. Erases dark spots permanently.
10% Ethyl Ascorbic Acid clinical potency.
Special social rate: ₹749 (expired Summer promo).
#InstantGlow #MiracleSkin #NoFilterNeeded`,
        previewUrl: 'instagram-reel-creative',
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
  onOpenGroqReportModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [customInputMode, setCustomInputMode] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
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
      </div>

      {/* Batch Selector Tabs (User requested 3 pamphlets, 3 insta posts, 3 banners) */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
        {ASSET_BATCHES.map((batch, idx) => (
          <button
            key={batch.category}
            className={`btn btn-sm ${selectedBatchIndex === idx && !customInputMode ? 'btn-brand' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none', padding: '6px 4px', fontSize: '11.5px' }}
            onClick={() => {
              setSelectedBatchIndex(idx);
              setCustomInputMode(false);
              onSelectAsset(batch.assets[0]);
            }}
          >
            {batch.category === 'Instagram Posts' ? '3x Insta Posts' : batch.category === 'Marketing Pamphlets' ? '3x Pamphlets' : '3x Banners'}
          </button>
        ))}
      </div>

      {/* Assets within Selected Batch */}
      {!customInputMode && (
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
          onClick={() => setCustomInputMode(!customInputMode)}
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
