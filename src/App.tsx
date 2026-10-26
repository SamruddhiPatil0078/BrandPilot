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
import { AuditLedgerRecord } from './types/audit';
import { BatchAsset } from './components/ContentAuditor/UploadPane';
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
  const handleInspectAssetInAuditor = (asset: CampaignAsset) => {
    let batchCategory: 'Instagram Posts' | 'Marketing Pamphlets' | 'Content Banners' = 'Content Banners';
    if (asset.channel === 'Instagram') batchCategory = 'Instagram Posts';
    else if (asset.channel === 'Print Brochure') batchCategory = 'Marketing Pamphlets';

    const converted: BatchAsset = {
      id: `campaign-${asset.id}`,
      name: asset.title,
      batchCategory,
      type: asset.format === 'Image' ? 'image' : asset.format === 'PDF' ? 'pdf' : 'text',
      channel: asset.channel,
      description: `Campaign Asset from ${asset.teamName || 'Campaign Batch'} (${asset.channel})`,
      draftText: asset.fullText || '',
      previewUrl: asset.previewUrl,
      detectedLogoTag: asset.extractedLogoVersion?.toLowerCase().includes('v2') ? 'v2-vintage' : 'v3-approved',
      expectedStatus: asset.status === 'In Sync' ? 'Approved' : 'Violation'
    };

    setIncomingAuditorAsset(converted);
    setActiveTab('content-auditor');
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
            <span>AI Inference: Groq Cloud (openai/gpt-oss-120b & 20b)</span>
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
