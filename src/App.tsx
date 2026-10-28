import React, { useState } from 'react';
import { Navbar, ActiveModuleTab } from './components/Navbar';
import { BrandMemoryView } from './components/BrandMemory/BrandMemoryView';
import { ContentAuditorView } from './components/ContentAuditor/ContentAuditorView';
import { CampaignConsistencyView } from './components/CampaignConsistency/CampaignConsistencyView';
import { DecisionLedgerView } from './components/DecisionLedger/DecisionLedgerView';
import {
  loadBrandKnowledgeBase,
  saveBrandKnowledgeBase,
  loadCampaign,
  saveCampaign,
  loadAuditLedger,
  resetAllStorageToDefaults
} from './services/storageService';
import { BrandKnowledgeBase } from './types/brand';
import { Campaign, CampaignAsset } from './types/campaign';
import { AuditLedgerRecord, AuditReport } from './types/audit';
import { BatchAsset } from './components/ContentAuditor/UploadPane';
import { isValidImageUrl, getAssetImage } from './services/imageStorage';
import { ShieldCheck, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveModuleTab>('content-auditor');
  const [brandKB, setBrandKB] = useState<BrandKnowledgeBase>(loadBrandKnowledgeBase);
  const [campaign, setCampaign] = useState<Campaign>(loadCampaign);
  const [ledger, setLedger] = useState<AuditLedgerRecord[]>(loadAuditLedger);
  const [incomingAuditorAsset, setIncomingAuditorAsset] = useState<BatchAsset | null>(null);

  // Sync to storage
  const handleUpdateKb = (updated: BrandKnowledgeBase) => {
    setBrandKB(updated);
    saveBrandKnowledgeBase(updated);
  };

  const handleUpdateCampaign = (updated: Campaign) => {
    setCampaign(updated);
    saveCampaign(updated);
  };

  const handleResetDefaults = () => {
    const defaults = resetAllStorageToDefaults();
    setBrandKB(defaults.kb);
    setCampaign(defaults.campaign);
    setLedger(defaults.ledger);
  };

  // Navigates from Campaign Consistency directly into Content Auditor with the selected asset
  const handleInspectAssetInAuditor = async (asset: CampaignAsset) => {
    let batchCategory: 'Instagram Posts' | 'Marketing Pamphlets' | 'Content Banners' = 'Content Banners';
    if (asset.channel === 'Instagram') batchCategory = 'Instagram Posts';
    else if (asset.channel === 'Print Brochure') batchCategory = 'Marketing Pamphlets';

    let resolvedPreviewUrl = '';
    if (isValidImageUrl(asset.previewUrl)) {
      resolvedPreviewUrl = asset.previewUrl;
    } else {
      const stored = await getAssetImage(asset.id);
      if (stored) {
        resolvedPreviewUrl = stored;
      }
    }

    const converted: BatchAsset = {
      id: `campaign-${asset.id}`,
      campaignAssetId: asset.id,
      name: asset.title,
      batchCategory,
      type: asset.format === 'Image' ? 'image' : asset.format === 'PDF' ? 'pdf' : 'text',
      channel: asset.channel,
      description: `Campaign Asset from ${asset.teamName || 'Campaign Batch'} (${asset.channel})`,
      draftText: asset.fullText || '',
      previewUrl: resolvedPreviewUrl,
      previewFormat: asset.channel === 'Instagram' ? 'instagram' : asset.format === 'Image' ? 'image' : asset.format === 'PDF' ? 'pamphlet' : 'banner',
      detectedLogoTag: asset.extractedLogoVersion?.toLowerCase().includes('v2') ? 'v2-vintage' : 'v3-approved',
      expectedStatus: asset.status === 'In Sync' ? 'Approved' : 'Violation',
      productSku: asset.productSku,
      productId: asset.productId
    };

    setIncomingAuditorAsset(converted);
    setActiveTab('content-auditor');
  };

  // Save audit results back to campaign asset for bi-directional consistency
  const handleSaveCampaignAssetAudit = (campaignAssetId: string, report: AuditReport) => {
    const approvalStatus = report.approvalStatus || (report.overallScore >= 90 ? 'Approved' : 'Blocked');
    const updatedAssets = campaign.assets.map(a => {
      if (a.id === campaignAssetId) {
        return {
          ...a,
          lastAuditReport: report,
          auditFindings: report.findings,
          auditStatus: approvalStatus,
          status: approvalStatus === 'Blocked'
            ? ('Conflicts Detected' as const)
            : approvalStatus === 'Needs Review'
            ? ('Needs Recheck' as const)
            : ('In Sync' as const)
        };
      }
      return a;
    });

    const updatedCampaign: Campaign = {
      ...campaign,
      assets: updatedAssets
    };
    setCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
  };

  const handleTabChange = (tab: ActiveModuleTab) => {
    if (tab === 'governance-ledger') {
      setLedger(loadAuditLedger());
    }
    setActiveTab(tab);
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        brandKB={brandKB}
        onResetDefaults={handleResetDefaults}
      />

      <main className="main-view-container">
        <div style={{ display: activeTab === 'brand-memory' ? 'block' : 'none' }}>
          <BrandMemoryView
            kb={brandKB}
            onUpdateKb={handleUpdateKb}
            onNavigateToAuditor={() => handleTabChange('content-auditor')}
            onNavigateToCampaign={() => handleTabChange('campaign-consistency')}
          />
        </div>

        <div style={{ display: activeTab === 'content-auditor' ? 'block' : 'none' }}>
          <ContentAuditorView
            kb={brandKB}
            incomingAsset={incomingAuditorAsset}
            onClearIncomingAsset={() => setIncomingAuditorAsset(null)}
            onSaveCampaignAssetAudit={handleSaveCampaignAssetAudit}
          />
        </div>

        <div style={{ display: activeTab === 'campaign-consistency' ? 'block' : 'none' }}>
          <CampaignConsistencyView
            campaign={campaign}
            kb={brandKB}
            onUpdateCampaign={handleUpdateCampaign}
            onInspectAssetInAuditor={handleInspectAssetInAuditor}
          />
        </div>

        <div style={{ display: activeTab === 'governance-ledger' ? 'block' : 'none' }}>
          <DecisionLedgerView ledger={ledger} />
        </div>
      </main>

      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#64748B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#00473E" />
          <span>
            <strong>BrandPilot Intelligence</strong> — Evidence-Driven Brand Governance Before Publication
          </span>
          <span>•</span>
          <span>Inkloom AI Hackathon / WECODERS-48</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={14} color="#2563EB" />
            <span>AI Inference: Groq Cloud (llama-3.3-70b & 8b)</span>
          </span>
          <span>•</span>
          <span>OCR: Client Tesseract Engine</span>
          <span>•</span>
          <span>Human-in-the-Loop Governance</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
