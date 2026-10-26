import React, { useState, useEffect } from 'react';
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
import { ShieldCheck, Cpu, FileCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveModuleTab>('content-auditor');
  const [brandKB, setBrandKB] = useState<BrandKnowledgeBase>(loadBrandKnowledgeBase);
  const [campaign, setCampaign] = useState<Campaign>(loadCampaign);
  const [ledger, setLedger] = useState<AuditLedgerRecord[]>(loadAuditLedger);

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

  const handleInspectAssetInAuditor = (asset: CampaignAsset) => {
    setActiveTab('content-auditor');
  };

  // Keep ledger refreshed when user switches tabs
  useEffect(() => {
    setLedger(loadAuditLedger());
  }, [activeTab]);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        brandKB={brandKB}
        onResetDefaults={handleResetDefaults}
      />

      <main className="main-view-container">
        {activeTab === 'brand-memory' && (
          <BrandMemoryView
            kb={brandKB}
            onUpdateKb={handleUpdateKb}
            onNavigateToAuditor={() => setActiveTab('content-auditor')}
            onNavigateToCampaign={() => setActiveTab('campaign-consistency')}
          />
        )}

        {activeTab === 'content-auditor' && (
          <ContentAuditorView kb={brandKB} />
        )}

        {activeTab === 'campaign-consistency' && (
          <CampaignConsistencyView
            campaign={campaign}
            kb={brandKB}
            onUpdateCampaign={handleUpdateCampaign}
            onInspectAssetInAuditor={handleInspectAssetInAuditor}
          />
        )}

        {activeTab === 'governance-ledger' && (
          <DecisionLedgerView ledger={ledger} />
        )}
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
