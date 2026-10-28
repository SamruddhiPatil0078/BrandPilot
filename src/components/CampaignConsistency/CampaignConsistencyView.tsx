import React, { useState, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Palette,
  Tag,
  Mic2,
  Users,
  Eye,
  Image as ImageIcon,
  Wand2,
  Grid
} from 'lucide-react';
import { Campaign, CampaignAsset, TeamCampaignBatch } from '../../types/campaign';
import { BrandKnowledgeBase } from '../../types/brand';
import { auditCampaignConsistency, autoAlignCampaignAssets } from '../../services/campaignEngine';
import { saveCampaign } from '../../services/storageService';
import { isValidImageUrl } from '../../services/imageStorage';
import { AssetCardsGrid } from './AssetCardsGrid';
import { AddAssetModal } from './AddAssetModal';
import { CrossAssetConflictMatrix } from './CrossAssetConflictMatrix';

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
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'batches' | 'grid'>('batches');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditingBatches, setIsAuditingBatches] = useState(false);
  const [hasAuditedCampaign, setHasAuditedCampaign] = useState(true);
  const [alignmentSuccessMessage, setAlignmentSuccessMessage] = useState<string | null>(null);

  // Derived baseline from Module 1 Knowledge Base
  const benchmarkTagline = kb.tone.primaryTagline;
  const benchmarkLogo = kb.logos.find(l => l.status === 'Approved Current')?.version || 'v3.0';
  const benchmarkDisclaimer = kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

  // Run dynamic audit against campaign assets and knowledge base
  const { conflicts, updatedAssets } = useMemo(() => {
    return auditCampaignConsistency(campaign, kb);
  }, [campaign, kb]);

  // Group assets into Team Batches
  const batches: TeamCampaignBatch[] = useMemo(() => {
    const knownTeams = [
      { name: 'Team Creative Pulse', role: 'Social Media & Influencer Agency' },
      { name: 'Team Metro Print & Retail', role: 'Offline Print & Store Display Agency' },
      { name: 'Team Growth & CRM Pod', role: 'In-House Digital & CRM Agency' }
    ];

    const teamMap = new Map<string, { role: string; assets: CampaignAsset[] }>();
    knownTeams.forEach(t => teamMap.set(t.name, { role: t.role, assets: [] }));

    updatedAssets.forEach(asset => {
      const team = asset.teamName || 'Team Growth & CRM Pod';
      if (!teamMap.has(team)) {
        teamMap.set(team, { role: 'Multi-Channel Production Team', assets: [] });
      }
      teamMap.get(team)!.assets.push(asset);
    });

    return Array.from(teamMap.entries()).map(([teamName, data], idx) => {
      const faultCount = data.assets.filter(a => a.status === 'Conflicts Detected').length;
      return {
        id: `batch-${idx + 1}`,
        teamName,
        role: data.role,
        status: faultCount > 0 ? ('Conflicts Detected' as const) : ('In Sync' as const),
        faultCount,
        assets: data.assets
      };
    });
  }, [updatedAssets]);

  const activeBatch = batches[activeBatchIndex] || batches[0] || {
    id: 'batch-default',
    teamName: 'Team Creative Pulse',
    role: 'Production Team',
    status: 'In Sync',
    faultCount: 0,
    assets: []
  };

  const handleReviewCampaignBatches = () => {
    setIsAuditingBatches(true);
    setTimeout(() => {
      setIsAuditingBatches(false);
      setHasAuditedCampaign(true);
    }, 450);
  };

  const handleAutoAlignAll = () => {
    const { updatedCampaign, alignedCount } = autoAlignCampaignAssets(campaign, kb);
    onUpdateCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
    setAlignmentSuccessMessage(`Successfully auto-aligned ${alignedCount} creative assets! All prices aligned to approved catalog rates, logos upgraded to ${benchmarkLogo}, and disclaimers applied.`);
    setTimeout(() => setAlignmentSuccessMessage(null), 5000);
  };

  const handleAutoAlignBatch = (teamName: string) => {
    const defaultPrice = kb.products[0]?.currentPrice ?? 1299;
    const currentLogoVersion = kb.logos.find(l => l.status === 'Approved Current')?.version || 'Logo v3 (Approved)';
    const approvedTagline = kb.tone.primaryTagline;
    const approvedDisclaimer = kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

    const newAssets = campaign.assets.map(asset => {
      if (asset.teamName !== teamName) return asset;
      const matchedProd = asset.productSku
        ? kb.products.find(p => p.sku === asset.productSku)
        : asset.productId
        ? kb.products.find(p => p.id === asset.productId)
        : kb.products.find(p => asset.title.toLowerCase().includes(p.productName.toLowerCase()) || (p.aliases && p.aliases.some(a => asset.title.toLowerCase().includes(a.toLowerCase())))) || kb.products[0];
      const targetPrice = matchedProd?.currentPrice ?? defaultPrice;

      return {
        ...asset,
        extractedPrice: targetPrice,
        extractedPriceStr: `₹${targetPrice.toLocaleString('en-IN')}`,
        extractedLogoVersion: currentLogoVersion,
        extractedTagline: approvedTagline,
        extractedDisclaimer: approvedDisclaimer,
        extractedDate: '30 Nov 2026',
        extractedBackground: '✓ Pearl Cream (#F7F5F0) clean approved laboratory backdrop',
        backgroundStatus: 'Clean' as const,
        backgroundFindings: [],
        fullText: `${asset.title} - ${approvedTagline}. Price: ₹${targetPrice.toLocaleString('en-IN')}. ${approvedDisclaimer}`,
        status: 'In Sync' as const,
        conflictCount: 0
      };
    });

    const reaudited = auditCampaignConsistency({ ...campaign, assets: newAssets }, kb);
    const updatedCampaign: Campaign = {
      ...campaign,
      assets: reaudited.updatedAssets,
      conflicts: reaudited.conflicts,
      lastRecheckedAt: new Date().toISOString()
    };
    onUpdateCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
  };

  const handleAddAsset = (newAsset: CampaignAsset) => {
    const newAssets = [...campaign.assets, newAsset];
    const reaudited = auditCampaignConsistency({ ...campaign, assets: newAssets }, kb);
    const updatedCampaign: Campaign = {
      ...campaign,
      assets: reaudited.updatedAssets,
      conflicts: reaudited.conflicts,
      lastRecheckedAt: new Date().toISOString()
    };
    onUpdateCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: ADMIN BENCHMARK STANDARD */}
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
              <FileCheck2 size={14} color="#16A34A" />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                <Tag size={14} color="#16A34A" />
                <span>Catalog Active Prices</span>
              </div>
              <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                {kb.products.length} SKUs
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#00473E', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {kb.products.slice(0, 3).map(prod => (
                <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={prod.productName}>
                    {prod.productName.replace('Aurelia ', '')}
                  </span>
                  <span style={{ fontWeight: 800, color: '#00473E', fontSize: '12px' }}>₹{prod.currentPrice.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: '#15803D', marginTop: '5px', borderTop: '1px dashed #BBF7D0', paddingTop: '3px' }}>
              {kb.products.length > 3 ? `+ ${kb.products.length - 3} more catalog items` : 'Active catalog prices from Brand Memory'}
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

          {/* Approved Background Scene Standard */}
          <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1.5px solid #BBF7D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
              <ImageIcon size={14} color="#16A34A" />
              <span>Background Scene Standard</span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#00473E' }}>
              Pearl Cream, Lab Glass, Botanical Flora
            </div>
            <div style={{ fontSize: '11px', color: '#15803D', marginTop: '6px', fontWeight: 600 }}>
              ✓ Cruelty-free vegan & secular backdrops
            </div>
          </div>
        </div>
      </div>

      {/* CENTRAL ACTION BAR: REVIEW CAMPAIGN BATCHES & AUTO-ALIGN ALL */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
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
              Cross-Audit All Campaign Assets Against Admin Baseline
            </div>
            <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
              {updatedAssets.length} assets audited dynamically. {conflicts.length} cross-team conflicts currently surfaced.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '10px' }}
            onClick={handleReviewCampaignBatches}
            disabled={isAuditingBatches}
          >
            <RefreshCw size={14} className={isAuditingBatches ? 'spin' : ''} />
            <span>{isAuditingBatches ? 'Auditing...' : 'Re-Check Engine'}</span>
          </button>

          <button
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: '10px',
              backgroundColor: '#16A34A',
              borderColor: '#15803D'
            }}
            onClick={handleAutoAlignAll}
          >
            <Wand2 size={16} />
            <span>⚡ Auto-Align All Batches</span>
          </button>
        </div>
      </div>

      {alignmentSuccessMessage && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{alignmentSuccessMessage}</span>
        </div>
      )}

      {/* SECTION 2: MULTI-TEAM CAMPAIGN BATCHES & ASSET ROSTER */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Users size={20} color="#2563EB" />
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>
                Section 2: Multi-Team Campaign Creatives ({batches.length} Teams: {updatedAssets.length} Assets)
              </span>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                Assets submitted by agency partners and internal teams. Audited live for consistency.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Switcher: Team Batches vs Asset Grid */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '2px' }}>
              <button
                className={`btn btn-sm ${viewMode === 'batches' ? 'btn-brand' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '11.5px', border: 'none' }}
                onClick={() => setViewMode('batches')}
              >
                <Users size={13} />
                <span>Agency Batches</span>
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-brand' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '11.5px', border: 'none' }}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={13} />
                <span>Asset Grid</span>
              </button>
            </div>

            {/* Add Creative Asset Button */}
            <button
              className="btn btn-brand btn-sm"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={14} />
              <span>Add Creative Asset</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Team Batches View */}
        {viewMode === 'batches' && (
          <div>
            {/* Batch Selector Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
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
                      marginLeft: '6px'
                    }}
                  >
                    {b.faultCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Batch Header with Inline Align Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                  {activeBatch.teamName}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>
                  ({activeBatch.role}) • {activeBatch.assets.length} Creative Assets
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className={`badge ${activeBatch.faultCount > 0 ? 'badge-violation' : 'badge-success'}`}
                  style={{ fontSize: '11px' }}
                >
                  {activeBatch.faultCount > 0
                    ? `${activeBatch.faultCount} Faulty Assets Detected`
                    : 'All Assets Synchronized'}
                </span>

                {activeBatch.faultCount > 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 10px', color: '#16A34A', fontWeight: 700 }}
                    onClick={() => handleAutoAlignBatch(activeBatch.teamName)}
                  >
                    <Wand2 size={12} />
                    <span>Auto-Align This Batch</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selected Batch Asset Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {activeBatch.assets.map(asset => {
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
                      {/* Optional Creative Image Preview */}
                      {isValidImageUrl(asset.previewUrl) && (
                        <div
                          style={{
                            width: '100%',
                            height: '130px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '10px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FAF5EF'
                          }}
                        >
                          <img
                            src={asset.previewUrl}
                            alt={asset.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '10px', textTransform: 'none' }}>
                          {asset.channel}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {asset.auditStatus && (
                            <span
                              className={`badge ${
                                asset.auditStatus === 'Blocked'
                                  ? 'badge-violation'
                                  : asset.auditStatus === 'Needs Review'
                                  ? 'badge-unverified'
                                  : 'badge-success'
                              }`}
                              style={{ fontSize: '9px', padding: '1px 5px' }}
                            >
                              {asset.auditStatus}
                            </span>
                          )}
                          <span className={`badge ${hasFaults ? 'badge-violation' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                            {hasFaults ? `${asset.conflictCount} Faults` : 'Clean / In Sync'}
                          </span>
                        </div>
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
                          <strong style={{ color: hasFaults ? '#DC2626' : '#00473E' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Validity Window:</span>
                          <span style={{ color: asset.extractedDate?.includes('Expired') || asset.extractedDate?.includes('30 Sept') ? '#DC2626' : '#334155', fontWeight: 600 }}>
                            {asset.extractedDate || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '4px', borderTop: '1px dashed #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ImageIcon size={12} color="#15803D" />
                            <span>Background:</span>
                          </span>
                          <span style={{
                            color: (asset.backgroundStatus === 'Warning' || asset.extractedBackground?.includes('⚠️')) ? '#D97706' : '#15803D',
                            fontWeight: 600,
                            fontSize: '11px',
                            textAlign: 'right',
                            maxWidth: '72%'
                          }}>
                            {asset.extractedBackground || '✓ Clean Backdrop'}
                          </span>
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
        )}

        {/* View Mode 2: Unified Asset Grid View */}
        {viewMode === 'grid' && (
          <AssetCardsGrid
            assets={updatedAssets}
            onInspectAsset={onInspectAssetInAuditor}
          />
        )}
      </div>

      {/* SECTION 3: UNIFIED CROSS-ASSET CONFLICT MATRIX */}
      {hasAuditedCampaign && (
        <CrossAssetConflictMatrix
          conflicts={conflicts}
        />
      )}

      {/* Add Creative Asset Modal */}
      {isAddModalOpen && (
        <AddAssetModal
          onClose={() => setIsAddModalOpen(false)}
          onAddAsset={handleAddAsset}
          products={kb.products}
        />
      )}
    </div>
  );
};
