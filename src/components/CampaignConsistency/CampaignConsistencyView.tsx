import React, { useState } from 'react';
import {
  Layers,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Share2,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Palette,
  Tag,
  Mic2,
  Type,
  FileText,
  Users,
  Eye,
  Check
} from 'lucide-react';
import { Campaign, CampaignAsset, TeamCampaignBatch, CampaignConflict } from '../../types/campaign';
import { BrandKnowledgeBase } from '../../types/brand';

interface CampaignConsistencyViewProps {
  campaign: Campaign;
  kb: BrandKnowledgeBase;
  onUpdateCampaign: (updated: Campaign) => void;
  onInspectAssetInAuditor: (asset: CampaignAsset) => void;
}

export const CampaignConsistencyView: React.FC<CampaignConsistencyViewProps> = ({
  campaign,
  kb,
  onUpdateCampaign,
  onInspectAssetInAuditor
}) => {
  // Initial 3 Batches produced by different teams
  const [batches, setBatches] = useState<TeamCampaignBatch[]>([
    {
      id: 'batch-team-1',
      teamName: 'Team Creative Pulse',
      role: 'Social Media & Influencer Agency',
      status: 'Conflicts Detected',
      faultCount: 3,
      assets: [
        {
          id: 'asset-cp-1',
          title: 'Instagram Story Ad - Autumn Launch',
          channel: 'Instagram',
          format: 'Image',
          teamName: 'Team Creative Pulse',
          previewUrl: 'instagram-aurelia-creative',
          uploadedAt: '2026-10-24T16:20:00Z',
          extractedPrice: 1099,
          extractedPriceStr: '₹1,099',
          extractedOffer: 'Monsoon Sale legacy offer',
          extractedDate: '30 Sept 2026',
          extractedTagline: "India's most loved moisturizer!",
          extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
          extractedDisclaimer: 'Missing mandatory disclaimer',
          extractedTone: 'Urgent / Hyperbolic',
          fullText: "India's most loved moisturizer! Results guaranteed in 7 days. Just ₹1,099! Aurelia Hydrating Moisturizer 50g.",
          status: 'Conflicts Detected',
          conflictCount: 3
        },
        {
          id: 'asset-cp-2',
          title: 'Instagram Reel Promo Banner',
          channel: 'Instagram',
          format: 'Image',
          teamName: 'Team Creative Pulse',
          previewUrl: 'instagram-reel-creative',
          uploadedAt: '2026-10-24T18:00:00Z',
          extractedPrice: 1099,
          extractedPriceStr: '₹1,099',
          extractedOffer: 'Social flash deal',
          extractedDate: '30 Sept 2026',
          extractedTagline: 'Miracle radiance glow',
          extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
          extractedDisclaimer: 'Missing mandatory disclaimer',
          extractedTone: 'Hype / FOMO',
          fullText: "Special social price ₹1,099! Erase barrier dryness with miracle botanicals.",
          status: 'Conflicts Detected',
          conflictCount: 3
        },
        {
          id: 'asset-cp-3',
          title: 'Influencer Collaboration Copy Brief',
          channel: 'Instagram',
          format: 'Copy',
          teamName: 'Team Creative Pulse',
          previewUrl: 'compliant-preview',
          uploadedAt: '2026-10-25T09:30:00Z',
          extractedPrice: 1299,
          extractedPriceStr: '₹1,299',
          extractedOffer: 'Creator affiliate discount',
          extractedDate: '30 Nov 2026',
          extractedTagline: 'Discover your daily skincare ritual.',
          extractedLogoVersion: 'Logo v3 (Approved)',
          extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
          extractedTone: 'Calm / Clinical',
          fullText: "Aurelia Deep Hydrating Moisturizer (₹1,299). 72h cellular hydration backed by clinical trial HT-402.",
          status: 'In Sync',
          conflictCount: 0
        }
      ]
    },
    {
      id: 'batch-team-2',
      teamName: 'Team Metro Print & Retail',
      role: 'Offline Print & Store Display Agency',
      status: 'Conflicts Detected',
      faultCount: 2,
      assets: [
        {
          id: 'asset-mp-1',
          title: 'Clinic Reception Tri-Fold Brochure',
          channel: 'Print Brochure',
          format: 'PDF',
          teamName: 'Team Metro Print & Retail',
          previewUrl: 'clinic-brochure',
          uploadedAt: '2026-10-25T11:15:00Z',
          extractedPrice: 1299,
          extractedPriceStr: '₹1,299',
          extractedOffer: 'Standard catalog',
          extractedDate: '30 Nov 2026',
          extractedTagline: 'Pure care, real results.',
          extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
          extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
          extractedTone: 'Clinical',
          fullText: "Aurelia Clinical Guide. Pure care, real results. Price: ₹1,299. Features Logo v2.1 vintage crest on cover.",
          status: 'Conflicts Detected',
          conflictCount: 1
        },
        {
          id: 'asset-mp-2',
          title: 'Doctor Clinic Standee Banner',
          channel: 'Print Brochure',
          format: 'Image',
          teamName: 'Team Metro Print & Retail',
          previewUrl: 'clinic-brochure',
          uploadedAt: '2026-10-25T14:40:00Z',
          extractedPrice: 1299,
          extractedPriceStr: '₹1,299',
          extractedOffer: 'Clinic partner rate',
          extractedDate: 'Valid till 30 Sept 2026 (Expired)',
          extractedTagline: 'Dermatologist inspired, science backed.',
          extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
          extractedDisclaimer: 'Missing mandatory disclaimer',
          extractedTone: 'Clinical / Educational',
          fullText: "Aurelia Standee. Valid till 30 Sept 2026. Price ₹1,299. No disclaimer asterisk printed.",
          status: 'Conflicts Detected',
          conflictCount: 2
        },
        {
          id: 'asset-mp-3',
          title: 'Counter Prescription Leaflet',
          channel: 'Print Brochure',
          format: 'PDF',
          teamName: 'Team Metro Print & Retail',
          previewUrl: 'pharma-pdf-preview',
          uploadedAt: '2026-10-25T16:00:00Z',
          extractedPrice: 1299,
          extractedPriceStr: '₹1,299',
          extractedOffer: 'Standard pricing',
          extractedDate: '31 Dec 2026',
          extractedTagline: 'Discover your daily skincare ritual.',
          extractedLogoVersion: 'Logo v3 (Approved)',
          extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
          extractedTone: 'Clinical',
          fullText: "Aurelia Patient Sheet. ₹1,299. Approved Logo v3. Full clinical trial disclaimers included.",
          status: 'In Sync',
          conflictCount: 0
        }
      ]
    },
    {
      id: 'batch-team-3',
      teamName: 'Team Growth & CRM Pod',
      role: 'Internal Digital Marketing & CRM Team',
      status: 'Conflicts Detected',
      faultCount: 1,
      assets: [
        {
          id: 'asset-crm-1',
          title: 'VIP Newsletter Email Blast',
          channel: 'Email',
          format: 'Copy',
          teamName: 'Team Growth & CRM Pod',
          previewUrl: 'compliant-preview',
          uploadedAt: '2026-10-26T08:00:00Z',
          extractedPrice: 1299,
          extractedPriceStr: '₹1,299 (20% off with AUTUMN20)',
          extractedOffer: '20% off promo',
          extractedDate: 'Ends 15 Nov 2026',
          extractedTagline: 'Discover your daily skincare ritual.',
          extractedLogoVersion: 'Logo v3 (Approved)',
          extractedDisclaimer: '*Prices inclusive of all taxes.',
          extractedTone: 'Warm / Educational',
          fullText: "VIP Newsletter. Aurelia Deep Hydrating Moisturizer (₹1,299). 20% off code AUTUMN20 ends Nov 15.",
          status: 'In Sync',
          conflictCount: 0
        },
        {
          id: 'asset-crm-2',
          title: 'Website Landing Page Hero Copy',
          channel: 'Website',
          format: 'Copy',
          teamName: 'Team Growth & CRM Pod',
          previewUrl: 'website-hero',
          uploadedAt: '2026-10-26T09:30:00Z',
          extractedPrice: 1299,
          extractedPriceStr: '₹1,299',
          extractedOffer: 'Free cleanser mini',
          extractedDate: '31 Oct 2026',
          extractedTagline: 'Discover your daily skincare ritual.',
          extractedLogoVersion: 'Logo v3 (Approved)',
          extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
          extractedTone: 'Calm / Clinical',
          fullText: "Official Website. Discover your daily skincare ritual. ₹1,299. Logo v3.",
          status: 'In Sync',
          conflictCount: 0
        },
        {
          id: 'asset-crm-3',
          title: 'SMS Promo Push Notification Copy',
          channel: 'Website',
          format: 'Copy',
          teamName: 'Team Growth & CRM Pod',
          previewUrl: 'compliant-preview',
          uploadedAt: '2026-10-26T10:15:00Z',
          extractedPrice: 1099,
          extractedPriceStr: '₹1,099',
          extractedOffer: 'Legacy Monsoon discount',
          extractedDate: 'Expired',
          extractedTagline: 'Glow naturally',
          extractedLogoVersion: 'No logo (SMS)',
          extractedDisclaimer: 'Missing disclaimer',
          extractedTone: 'Urgent',
          fullText: "Flash SMS: Grab Aurelia Moisturizer for ₹1,099 before stocks end!",
          status: 'Conflicts Detected',
          conflictCount: 2
        }
      ]
    }
  ]);

  const [hasAuditedCampaign, setHasAuditedCampaign] = useState(false);
  const [isAuditingBatches, setIsAuditingBatches] = useState(false);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  // Derived baseline from Module 1 Knowledge Base
  const benchmarkPrice = kb.products[0]?.currentPrice || 1299;
  const benchmarkTagline = kb.tone.primaryTagline;
  const benchmarkLogo = kb.logos.find(l => l.status === 'Approved Current')?.version || 'v3.0';
  const benchmarkDisclaimer = kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

  // Comprehensive faults generated across all batches
  const campaignFaults: CampaignConflict[] = [
    {
      id: 'fault-1',
      type: 'Price Discrepancy',
      title: 'Conflicting Product Price across Agency Batches',
      severity: 'HIGH',
      description: `Team Creative Pulse (Social) and Team Growth (SMS) are broadcasting legacy rate ₹1,099, while Team Metro Print and Official Website display active approved price ₹${benchmarkPrice.toLocaleString('en-IN')}.`,
      involvedAssets: [
        { assetId: 'asset-cp-1', assetTitle: 'Instagram Story Ad', channel: 'Instagram', teamName: 'Creative Pulse', detectedValue: '₹1,099 (Legacy Monsoon)' },
        { assetId: 'asset-crm-3', assetTitle: 'SMS Promo Push', channel: 'Website', teamName: 'Growth CRM', detectedValue: '₹1,099 (Outdated)' },
        { assetId: 'asset-mp-1', assetTitle: 'Clinic Tri-Fold', channel: 'Print Brochure', teamName: 'Metro Print', detectedValue: `₹${benchmarkPrice} (Approved)` }
      ],
      approvedTruth: {
        rule: `Approved Product Price for ${kb.products[0]?.productName || 'Moisturizer'}`,
        validValue: `₹${benchmarkPrice.toLocaleString('en-IN')} (Active Brand Memory v${kb.activeVersion})`,
        sourceDocument: `Catalog Standards v${kb.activeVersion}`
      },
      suggestedAlignment: `Force price update across all social and SMS templates to approved ₹${benchmarkPrice.toLocaleString('en-IN')}.`
    },
    {
      id: 'fault-2',
      type: 'Outdated Logo',
      title: 'Deprecated Logo v2.1 in Social and Print Batches',
      severity: 'HIGH',
      description: 'Team Metro Print (Standee & Brochure) and Team Creative Pulse (Instagram Story) are distributing the obsolete 2025 Vintage Crest v2.1 instead of approved Botanical Emblem Logo v3.0.',
      involvedAssets: [
        { assetId: 'asset-cp-1', assetTitle: 'Instagram Story Ad', channel: 'Instagram', teamName: 'Creative Pulse', detectedValue: 'Logo v2.1 (Deprecated Crest)' },
        { assetId: 'asset-mp-1', assetTitle: 'Clinic Tri-Fold', channel: 'Print Brochure', teamName: 'Metro Print', detectedValue: 'Logo v2.1 (Deprecated Crest)' },
        { assetId: 'asset-crm-2', assetTitle: 'Website Hero', channel: 'Website', teamName: 'Growth CRM', detectedValue: 'Logo v3.0 (Approved)' }
      ],
      approvedTruth: {
        rule: 'Current Approved Brand Visual Identity Standard',
        validValue: `Logo ${benchmarkLogo} (Botanical Wordmark)`,
        sourceDocument: 'Brand Visual Assets Library v3.0'
      },
      suggestedAlignment: 'Replace outdated raster crest files with official SVG Logo v3.0 package.'
    },
    {
      id: 'fault-3',
      type: 'Tagline Inconsistency',
      title: 'Unapproved Slogan & Unsubstantiated Superlative in Social Batch',
      severity: 'HIGH',
      description: `Team Creative Pulse uses unapproved superlative "India's most loved moisturizer!", conflicting with approved corporate slogan "${benchmarkTagline}".`,
      involvedAssets: [
        { assetId: 'asset-cp-1', assetTitle: 'Instagram Story Ad', channel: 'Instagram', teamName: 'Creative Pulse', detectedValue: "India's most loved moisturizer!" },
        { assetId: 'asset-crm-2', assetTitle: 'Website Hero', channel: 'Website', teamName: 'Growth CRM', detectedValue: benchmarkTagline }
      ],
      approvedTruth: {
        rule: 'Approved Primary Brand Slogan',
        validValue: `"${benchmarkTagline}"`,
        sourceDocument: 'Tone & Voice Standards v3.0'
      },
      suggestedAlignment: `Replace unverified superlative with approved primary tagline: "${benchmarkTagline}".`
    },
    {
      id: 'fault-4',
      type: 'Missing Disclaimer',
      title: 'Mandatory Clinical Trial Disclaimer Omitted in Social & Standee',
      severity: 'HIGH',
      description: 'Instagram Story Ad and Clinic Standee claim 7-day efficacy without printing the required clinical footnote asterisk.',
      involvedAssets: [
        { assetId: 'asset-cp-1', assetTitle: 'Instagram Story Ad', channel: 'Instagram', teamName: 'Creative Pulse', detectedValue: 'Disclaimer Omitted' },
        { assetId: 'asset-mp-2', assetTitle: 'Clinic Standee', channel: 'Print Brochure', teamName: 'Metro Print', detectedValue: 'Disclaimer Omitted' },
        { assetId: 'asset-crm-2', assetTitle: 'Website Hero', channel: 'Website', teamName: 'Growth CRM', detectedValue: '*Based on clinical trial of 30 women over 4 weeks.' }
      ],
      approvedTruth: {
        rule: 'Mandatory Clinical Efficacy Footnote',
        validValue: benchmarkDisclaimer,
        sourceDocument: 'Legal & Regulatory Standards (ASCI / CCPA)'
      },
      suggestedAlignment: `Include approved asterisk footnote: "${benchmarkDisclaimer}".`
    },
    {
      id: 'fault-5',
      type: 'Date Expiry Conflict',
      title: 'Campaign Expiration Date Drift Across Channels',
      severity: 'MEDIUM',
      description: 'Clinic Standee states offer expired on 30 Sept 2026, while VIP Email states promotion ends 15 Nov 2026 and Website states 31 Oct 2026.',
      involvedAssets: [
        { assetId: 'asset-mp-2', assetTitle: 'Clinic Standee', channel: 'Print Brochure', teamName: 'Metro Print', detectedValue: '30 Sept 2026 (Expired)' },
        { assetId: 'asset-crm-1', assetTitle: 'VIP Newsletter', channel: 'Email', teamName: 'Growth CRM', detectedValue: '15 Nov 2026' },
        { assetId: 'asset-crm-2', assetTitle: 'Website Hero', channel: 'Website', teamName: 'Growth CRM', detectedValue: '31 Oct 2026' }
      ],
      approvedTruth: {
        rule: 'Approved Autumn Campaign Term',
        validValue: '01 October 2026 through 30 November 2026',
        sourceDocument: 'Q4 Master Campaign Brief 2026'
      },
      suggestedAlignment: 'Standardize campaign validity end-date to 30 November 2026 across all print and digital assets.'
    }
  ];

  const handleReviewCampaignBatches = () => {
    setIsAuditingBatches(true);
    setTimeout(() => {
      setIsAuditingBatches(false);
      setHasAuditedCampaign(true);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: ADMIN BENCHMARK STANDARD (User requested Section 1) */}
      <div
        className="curved-section-box"
        style={{
          border: '2px solid #00473E',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0, 71, 62, 0.08)'
        }}
      >
        <div className="curved-section-header">
          <div className="curved-section-title">
            <ShieldCheck size={22} color="#00473E" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#00473E' }}>
                Section 1: Admin Approved Benchmark Standard (Brand Memory v{kb.activeVersion})
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                This is the single source of truth defined by the Brand Manager. All agency campaign batches below must align with these parameters.
              </div>
            </div>
          </div>
          <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '12px' }}>
            <CheckCircle2 size={13} />
            <span>Enforced Admin Baseline</span>
          </span>
        </div>

        {/* Admin Baseline Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {/* Approved Colors */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Palette size={14} color="#2563EB" />
              <span>Approved Palette</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#00473E', border: '1px solid #FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#C89B3C', border: '1px solid #FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Emerald & Gold</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>#00473E (Primary), #C89B3C (Accent)</div>
          </div>

          {/* Approved Voice & Tone */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Mic2 size={14} color="#00473E" />
              <span>Approved Voice & Tone</span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#00473E' }}>
              Calm, Factual, Clinical
            </div>
            <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '6px', fontWeight: 600 }}>
              Prohibited: Hype, FOMO, Miracles
            </div>
          </div>

          {/* Approved Tagline */}
          <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1.5px solid #BBF7D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FileText size={14} color="#16A34A" />
              <span>Primary Approved Slogan</span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#00473E' }}>
              "{benchmarkTagline}"
            </div>
            <div style={{ fontSize: '11px', color: '#15803D', marginTop: '6px' }}>
              Required across all hero headlines
            </div>
          </div>

          {/* Approved Benchmark Price */}
          <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1.5px solid #BBF7D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Tag size={14} color="#16A34A" />
              <span>Catalog Active Price</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#00473E' }}>
              ₹{benchmarkPrice.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#15803D', marginTop: '4px' }}>
              Moisturizer 50g (Monsoon ₹1,099 Expired)
            </div>
          </div>

          {/* Approved Visual Logo */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Layers size={14} color="#C89B3C" />
              <span>Logo Standard</span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
              Logo {benchmarkLogo} (Botanical)
            </div>
            <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '6px', fontWeight: 600 }}>
              Logo v2.1 Vintage Crest Prohibited
            </div>
          </div>

          {/* Mandatory Disclaimer */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FileCheck2 size={14} color="#2563EB" />
              <span>Mandatory Disclaimer</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#334155', fontStyle: 'italic', lineHeight: '1.4' }}>
              "{benchmarkDisclaimer.slice(0, 75)}..."
            </div>
            <div style={{ fontSize: '10.5px', color: '#2563EB', marginTop: '6px', fontWeight: 600 }}>
              Required on all clinical & efficacy ads
            </div>
          </div>
        </div>
      </div>

      {/* CENTRAL ACTION BAR: REVIEW CAMPAIGN BATCHES & CROSS-AUDIT FAULTS */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#2563EB',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={22} className={isAuditingBatches ? 'spin' : ''} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
              Cross-Audit All Campaign Batches Against Admin Baseline
            </div>
            <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
              Click to evaluate all 3 agency batches (9 assets) simultaneously and surface every pricing, logo, and claim conflict.
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}
          onClick={handleReviewCampaignBatches}
          disabled={isAuditingBatches}
        >
          <RefreshCw size={16} className={isAuditingBatches ? 'spin' : ''} />
          <span>{isAuditingBatches ? 'Cross-Auditing All Teams...' : 'Review Campaign & Detect Faults'}</span>
        </button>
      </div>

      {/* SECTION 2: CAMPAIGN BATCHES MADE BY DIFFERENT TEAMS (User requested Section 2) */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Users size={20} color="#2563EB" />
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>
                Section 2: Multi-Team Campaign Batches (3 Submissions: 9 Creative Assets)
              </span>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                Assets submitted by external agencies (Social Media, Offline Print) and internal CRM pod.
              </div>
            </div>
          </div>

          {/* Batch Selector Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {batches.map((b, idx) => (
              <button
                key={b.id}
                className={`btn btn-sm ${activeBatchIndex === idx ? 'btn-brand' : 'btn-secondary'}`}
                onClick={() => setActiveBatchIndex(idx)}
                style={{ fontSize: '12px' }}
              >
                <span>{b.teamName}</span>
                <span
                  style={{
                    backgroundColor: b.faultCount > 0 ? '#DC2626' : '#16A34A',
                    color: '#FFF',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    marginLeft: '4px'
                  }}
                >
                  {b.faultCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Batch Asset Cards */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                {batches[activeBatchIndex].teamName}
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>
                ({batches[activeBatchIndex].role}) • {batches[activeBatchIndex].assets.length} Assets
              </span>
            </div>

            <span className="badge badge-violation" style={{ fontSize: '11px' }}>
              {batches[activeBatchIndex].faultCount} Cross-Asset Faults Found
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {batches[activeBatchIndex].assets.map(asset => {
              const hasFaults = asset.status === 'Conflicts Detected';
              return (
                <div
                  key={asset.id}
                  style={{
                    border: hasFaults ? '1.5px solid #FECACA' : '1.5px solid #BBF7D0',
                    backgroundColor: hasFaults ? '#FFF5F5' : '#F0FDF4',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '10px', textTransform: 'none' }}>
                        {asset.channel}
                      </span>
                      <span className={`badge ${hasFaults ? 'badge-violation' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                        {hasFaults ? `${asset.conflictCount} Faults` : 'Clean / In Sync'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '8px' }}>
                      {asset.title}
                    </div>

                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        marginBottom: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Extracted Price:</span>
                        <strong style={{ color: asset.extractedPriceStr?.includes('1,099') ? '#DC2626' : '#00473E' }}>
                          {asset.extractedPriceStr}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Logo Version:</span>
                        <span style={{ color: asset.extractedLogoVersion?.includes('v2') ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                          {asset.extractedLogoVersion}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Tagline:</span>
                        <span style={{ color: '#334155', fontWeight: 600 }}>"{asset.extractedTagline}"</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Format: {asset.format}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onInspectAssetInAuditor(asset)}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Eye size={12} />
                      <span>Audit Asset</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* UNIFIED CROSS-ASSET FAULTS MATRIX (Revealed after clicking "Review Campaign Batches") */}
      {hasAuditedCampaign && (
        <div
          className="curved-section-box"
          style={{
            border: '2px solid #DC2626',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.12)'
          }}
        >
          <div className="curved-section-header">
            <div className="curved-section-title">
              <ShieldAlert size={22} color="#DC2626" />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                  Unified Campaign Faults Matrix ({campaignFaults.length} Cross-Team Conflicts Detected)
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                  Immediate resolution required across Team Creative Pulse, Team Metro Print, and Team Growth before campaign rollout.
                </div>
              </div>
            </div>
            <span className="badge badge-violation" style={{ padding: '6px 14px', fontSize: '12px' }}>
              Action Required
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {campaignFaults.map(fault => (
              <div
                key={fault.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  backgroundColor: '#FFFFFF',
                  borderLeft: `5px solid ${fault.severity === 'HIGH' ? '#DC2626' : '#D97706'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                {/* Fault Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-violation">{fault.type}</span>
                      <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                        {fault.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px', lineHeight: '1.5' }}>
                      {fault.description}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: fault.severity === 'HIGH' ? '#DC2626' : '#D97706',
                      color: '#FFF'
                    }}
                  >
                    {fault.severity}
                  </span>
                </div>

                {/* Involved Teams & Detected Values */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${fault.involvedAssets.length}, 1fr)`,
                    gap: '10px',
                    margin: '12px 0',
                    backgroundColor: '#F8FAFC',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  {fault.involvedAssets.map((ia, idx) => {
                    const isConflicting = ia.detectedValue.includes('1,099') ||
                      ia.detectedValue.includes('v2') ||
                      ia.detectedValue.includes('loved') ||
                      ia.detectedValue.includes('Omitted') ||
                      ia.detectedValue.includes('Expired');

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '10px',
                          backgroundColor: isConflicting ? '#FEF2F2' : '#FFFFFF',
                          borderRadius: '8px',
                          border: isConflicting ? '1px solid #FECACA' : '1px solid #E2E8F0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            {ia.teamName || ia.channel}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: isConflicting ? '#DC2626' : '#16A34A' }}>
                            {isConflicting ? 'Conflict' : 'Approved'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{ia.assetTitle}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isConflicting ? '#991B1B' : '#0F172A', marginTop: '4px' }}>
                          {ia.detectedValue}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Approved Baseline from Section 1 & Action */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F0FDF4',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#166534' }}>Admin Truth: </span>
                    <span style={{ color: '#00473E', fontWeight: 600 }}>{fault.approvedTruth.validValue}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#15803D' }}>
                    {fault.suggestedAlignment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
