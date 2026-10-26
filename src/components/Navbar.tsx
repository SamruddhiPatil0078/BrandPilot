import React from 'react';
import {
  ShieldCheck,
  BookOpen,
  FileSearch,
  Layers,
  FileCheck2,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { BrandKnowledgeBase } from '../types/brand';

export type ActiveModuleTab = 'brand-memory' | 'content-auditor' | 'campaign-consistency' | 'governance-ledger';

interface NavbarProps {
  activeTab: ActiveModuleTab;
  onTabChange: (tab: ActiveModuleTab) => void;
  brandKB: BrandKnowledgeBase;
  onResetDefaults: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  brandKB,
  onResetDefaults,
}) => {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon-wrapper">
          <ShieldCheck size={22} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">BrandPilot</span>
            <span className="brand-tag">Intelligence</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '-2px' }}>
            Evidence-Driven Brand Governance Before Publication
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'brand-memory' ? 'active' : ''}`}
          onClick={() => onTabChange('brand-memory')}
        >
          <BookOpen size={16} />
          <span>Brand Memory</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'content-auditor' ? 'active' : ''}`}
          onClick={() => onTabChange('content-auditor')}
        >
          <FileSearch size={16} />
          <span>Content Auditor</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'campaign-consistency' ? 'active' : ''}`}
          onClick={() => onTabChange('campaign-consistency')}
        >
          <Layers size={16} />
          <span>Campaign Consistency</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'governance-ledger' ? 'active' : ''}`}
          onClick={() => onTabChange('governance-ledger')}
        >
          <FileCheck2 size={16} />
          <span>Governance Ledger</span>
        </button>
      </nav>

      <div className="nav-actions">
        <div className="brand-badge" title="Active Brand Memory Catalog">
          <span>{brandKB.brandName}</span>
          <span style={{ opacity: 0.8, fontSize: '11px' }}>({brandKB.activeVersion})</span>
        </div>

        <div className="groq-status-badge" title="Groq Cloud LLM Active (openai/gpt-oss-120b & 20b)">
          <span className="groq-indicator-dot"></span>
          <Cpu size={14} />
          <span>Groq AI Active</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (window.confirm('Reset Brand Knowledge Base and all campaign assets to default Aurelia Skincare datasets?')) {
              onResetDefaults();
            }
          }}
          title="Reset Knowledge Base and Campaigns to sample defaults"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
