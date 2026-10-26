import React, { useState } from 'react';
import {
  BookOpen,
  Tag,
  Award,
  Ban,
  History,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { BrandKnowledgeBase } from '../../types/brand';
import { GuidelinesVisualizer } from './GuidelinesVisualizer';
import { ProductFactsManager } from './ProductFactsManager';
import { ClaimsManager } from './ClaimsManager';
import { TerminologyManager } from './TerminologyManager';
import { VersionHistoryModal } from './VersionHistoryModal';

interface BrandMemoryViewProps {
  kb: BrandKnowledgeBase;
  onUpdateKb: (updated: BrandKnowledgeBase) => void;
  onNavigateToAuditor: () => void;
  onNavigateToCampaign: () => void;
}

export const BrandMemoryView: React.FC<BrandMemoryViewProps> = ({
  kb,
  onUpdateKb,
  onNavigateToAuditor,
  onNavigateToCampaign
}) => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'products' | 'claims' | 'terminology'>('guidelines');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleFactChanged = (summary: string) => {
    setNotificationMsg(`Fact Updated: ${summary}`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner matching Image 1 & PDF Page 5 */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          border: '1px solid #334155',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-success" style={{ backgroundColor: 'rgba(22, 163, 74, 0.2)', color: '#4ADE80' }}>
                Module 1: Approved Single Source of Truth
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Active Version: <strong>{kb.activeVersion}</strong> (Last updated by {kb.updatedBy})
              </span>
            </div>

            <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
              {kb.brandName} — Brand Memory & Knowledge Base
            </h1>

            <p style={{ color: '#94A3B8', fontSize: '13px', maxWidth: '750px' }}>
              This is where the organisation writes down what is approved. It holds product facts, current and historical prices with valid-from and valid-until dates, approved claims with clinical evidence, tone rules, and logos. The AI reads this knowledge to audit drafts but can never edit it.
            </p>
          </div>

          {/* Quick Metrics from Image 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '12px 18px',
                borderRadius: '12px'
              }}
            >
              {/* Circular gauge mock matching Image 1 */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '4px solid #2563EB',
                  borderTopColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#FFFFFF'
                }}
              >
                94%
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Governance Health</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>All core rules active & verified</div>
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => setShowHistoryModal(true)}>
              <History size={14} />
              <span>Version History ({kb.versionHistory.length})</span>
            </button>
          </div>
        </div>

        {notificationMsg && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '8px',
              color: '#FDE047',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} />
              <span>{notificationMsg}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm"
                style={{ background: '#2563EB', color: '#FFF', padding: '3px 8px' }}
                onClick={onNavigateToAuditor}
              >
                <span>Audit Creatives</span>
                <ArrowRight size={12} />
              </button>
              <button
                className="btn btn-sm"
                style={{ background: '#F59E0B', color: '#000', padding: '3px 8px' }}
                onClick={onNavigateToCampaign}
              >
                <span>Recheck Campaign Assets</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Module 1 Sub-Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', paddingBottom: '2px' }}>
        <button
          className={`btn ${activeTab === 'guidelines' ? 'btn-brand' : 'btn-secondary'}`}
          onClick={() => setActiveTab('guidelines')}
        >
          <BookOpen size={15} />
          <span>Brand Guidelines & Visual Identity</span>
        </button>

        <button
          className={`btn ${activeTab === 'products' ? 'btn-brand' : 'btn-secondary'}`}
          onClick={() => setActiveTab('products')}
        >
          <Tag size={15} />
          <span>Product Facts & Price Timelines ({kb.products.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'claims' ? 'btn-brand' : 'btn-secondary'}`}
          onClick={() => setActiveTab('claims')}
        >
          <Award size={15} />
          <span>Approved Claims & Evidence ({kb.claims.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'terminology' ? 'btn-brand' : 'btn-secondary'}`}
          onClick={() => setActiveTab('terminology')}
        >
          <Ban size={15} />
          <span>Terminology & Disclaimers ({kb.terminology.length})</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'guidelines' && (
        <GuidelinesVisualizer kb={kb} onUpdateKb={onUpdateKb} />
      )}

      {activeTab === 'products' && (
        <ProductFactsManager
          kb={kb}
          onUpdateKb={onUpdateKb}
          onFactChanged={handleFactChanged}
        />
      )}

      {activeTab === 'claims' && (
        <ClaimsManager kb={kb} onUpdateKb={onUpdateKb} />
      )}

      {activeTab === 'terminology' && (
        <TerminologyManager kb={kb} onUpdateKb={onUpdateKb} />
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <VersionHistoryModal kb={kb} onClose={() => setShowHistoryModal(false)} />
      )}
    </div>
  );
};
