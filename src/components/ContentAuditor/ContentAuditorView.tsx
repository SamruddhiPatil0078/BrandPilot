import React, { useState, useEffect } from 'react';
import { BrandKnowledgeBase } from '../../types/brand';
import { AuditFinding, AuditReport, ReviewDecision } from '../../types/audit';
import { UploadPane, ASSET_BATCHES, BatchAsset } from './UploadPane';
import { AssetPreviewPane } from './AssetPreviewPane';
import { ReviewIssuesPane } from './ReviewIssuesPane';
import { HumanDecisionModal } from './HumanDecisionModal';
import { SendBackEmailModal } from './SendBackEmailModal';
import { GroqReportModal } from './GroqReportModal';
import { runContentAudit } from '../../services/auditorEngine';
import { performOcr } from '../../services/ocrService';
import { extractTextFromPdf } from '../../services/pdfService';
import { cleanOcrTextWithGroq } from '../../services/groqService';
import { saveAuditLedgerRecord } from '../../services/storageService';
import { MailCheck, CheckCircle2 } from 'lucide-react';

interface ContentAuditorViewProps {
  kb: BrandKnowledgeBase;
}

export const ContentAuditorView: React.FC<ContentAuditorViewProps> = ({ kb }) => {
  // Current draft asset
  const [selectedAsset, setSelectedAsset] = useState<BatchAsset>(ASSET_BATCHES[0].assets[0]);
  const [draftText, setDraftText] = useState<string>(ASSET_BATCHES[0].assets[0].draftText);

  // Audit state - null until user clicks "Run Evidence Audit" to eliminate confusion
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{ percent: number; status: string } | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals
  const [decisionModalFinding, setDecisionModalFinding] = useState<AuditFinding | null>(null);
  const [decisionModalAction, setDecisionModalAction] = useState<ReviewDecision>('ACCEPTED');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isGroqReportModalOpen, setIsGroqReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep review and evidence blank until user explicitly triggers audit
  useEffect(() => {
    setAuditReport(null);
    setSelectedFindingId(null);
  }, [selectedAsset.id, kb.activeVersion]);

  const executeAudit = async (
    textToAudit: string,
    title: string,
    type: 'image' | 'pdf' | 'text',
    url: string,
    logoTag?: string,
    extractedVia: 'Tesseract OCR' | 'PDF Parser' | 'Direct Input' = 'Direct Input',
    ocrConfidence?: number
  ) => {
    setIsAuditing(true);
    setAuditProgress({ percent: 25, status: 'Running exact price & terminology checks...' });

    try {
      setTimeout(() => {
        setAuditProgress({ percent: 70, status: 'Querying Groq AI for tone & promotional claims...' });
      }, 250);

      const report = await runContentAudit(
        {
          draftText: textToAudit,
          assetTitle: title,
          assetType: type,
          assetUrl: url,
          extractedVia,
          ocrConfidence: ocrConfidence ?? 94.5,
          detectedLogoTag: logoTag
        },
        kb
      );

      setAuditReport(report);
      if (report.findings.length > 0) {
        setSelectedFindingId(report.findings[0].id);
      }
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsAuditing(false);
      setAuditProgress(null);
    }
  };

  const handleSelectAsset = (asset: BatchAsset) => {
    setSelectedAsset(asset);
    setDraftText(asset.draftText);
    setAuditReport(null);
    setSelectedFindingId(null);
  };

  const handleFileUpload = async (file: File) => {
    setIsAuditing(true);
    setAuditReport(null);
    setSelectedFindingId(null);

    const customAsset: BatchAsset = {
      id: `custom-${Date.now()}`,
      name: file.name,
      batchCategory: 'Content Banners',
      type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'text',
      channel: 'Custom Upload',
      description: `Uploaded file: ${file.name}`,
      draftText: '',
      previewUrl: URL.createObjectURL(file),
      expectedStatus: 'Warning'
    };

    if (file.type.startsWith('image/')) {
      setAuditProgress({ percent: 20, status: 'Preprocessing image & running OCR...' });
      try {
        const ocrRes = await performOcr(file, (p, s) => {
          setAuditProgress({ percent: Math.round(p * 0.45), status: `OCR: ${s}` });
        });
        const extracted = ocrRes.text || 'No text detected';
        setAuditProgress({ percent: 75, status: 'Reconstructing copy with Groq AI...' });
        const cleanedText = await cleanOcrTextWithGroq(extracted);
        customAsset.draftText = cleanedText || extracted;
        setSelectedAsset(customAsset);
        setDraftText(cleanedText || extracted);
        setToastMessage(`Image uploaded & text reconstructed with Groq AI. Click "Run Evidence Audit" to review.`);
        setTimeout(() => setToastMessage(null), 5000);
      } catch (err) {
        console.warn('OCR error:', err);
        customAsset.draftText = 'OCR could not read text. You can type or edit copy directly.';
        setSelectedAsset(customAsset);
        setDraftText(customAsset.draftText);
      } finally {
        setIsAuditing(false);
        setAuditProgress(null);
      }
    } else if (file.type === 'application/pdf') {
      setAuditProgress({ percent: 40, status: 'Parsing PDF streams...' });
      try {
        const pdfRes = await extractTextFromPdf(file);
        customAsset.draftText = pdfRes.text;
        setSelectedAsset(customAsset);
        setDraftText(pdfRes.text);
        setToastMessage(`PDF loaded. Click "Run Evidence Audit" to review.`);
        setTimeout(() => setToastMessage(null), 5000);
      } catch (err) {
        console.warn('PDF fallback:', err);
      } finally {
        setIsAuditing(false);
        setAuditProgress(null);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        customAsset.draftText = content;
        setSelectedAsset(customAsset);
        setDraftText(content);
        setIsAuditing(false);
        setAuditProgress(null);
        setToastMessage(`Text loaded. Click "Run Evidence Audit" to review.`);
        setTimeout(() => setToastMessage(null), 5000);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmDecision = (
    findingId: string,
    decision: ReviewDecision,
    note: string,
    decidedBy: string
  ) => {
    if (!auditReport) return;
    const finding = auditReport.findings.find(f => f.id === findingId);
    if (!finding) return;

    saveAuditLedgerRecord({
      id: `led-${Date.now()}`,
      findingId: finding.id,
      assetTitle: auditReport.assetTitle,
      flaggedText: finding.flaggedText,
      findingCategory: finding.category,
      decision,
      decisionNote: note,
      decidedBy,
      brandVersion: kb.activeVersion,
      timestamp: new Date().toISOString()
    });

    const updatedFindings = auditReport.findings.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          decision,
          decisionNote: note,
          decisionBy: decidedBy,
          decisionTimestamp: new Date().toISOString()
        };
      }
      return f;
    });

    const resolvedCount = updatedFindings.filter(f => f.decision === 'ACCEPTED').length;
    const newScore = Math.min(100, auditReport.overallScore + (resolvedCount * 15));

    setAuditReport({
      ...auditReport,
      overallScore: newScore,
      findings: updatedFindings,
      summary: {
        ...auditReport.summary,
        resolvedCount
      }
    });
  };

  const handleQuickApplyFix = (findingId: string) => {
    handleConfirmDecision(findingId, 'ACCEPTED', 'Applied approved on-brand guideline fix', 'Reviewer');
    setToastMessage('Fix applied directly to preview!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyAllFixes = () => {
    if (!auditReport) return;
    auditReport.findings.forEach(f => {
      if (f.decision === 'PENDING') {
        saveAuditLedgerRecord({
          id: `led-${Date.now()}-${f.id}`,
          findingId: f.id,
          assetTitle: auditReport.assetTitle,
          flaggedText: f.flaggedText,
          findingCategory: f.category,
          decision: 'ACCEPTED',
          decisionNote: 'Applied approved guideline fix',
          decidedBy: 'Reviewer',
          brandVersion: kb.activeVersion,
          timestamp: new Date().toISOString()
        });
      }
    });

    const updatedFindings = auditReport.findings.map(f => ({
      ...f,
      decision: 'ACCEPTED' as ReviewDecision,
      decisionNote: 'Applied approved guideline fix',
      decisionBy: 'Reviewer',
      decisionTimestamp: new Date().toISOString()
    }));

    setAuditReport({
      ...auditReport,
      overallScore: 100,
      findings: updatedFindings,
      summary: {
        ...auditReport.summary,
        resolvedCount: updatedFindings.length
      }
    });
    setToastMessage('All approved guideline fixes applied! Preview fully compliant.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendEmailNotification = (data: { recipientEmail: string; recipientName: string; subject: string }) => {
    // Record rejection in ledger
    saveAuditLedgerRecord({
      id: `led-mail-${Date.now()}`,
      findingId: 'batch-rejection',
      assetTitle: selectedAsset.name,
      flaggedText: `${auditReport?.findings.length || 0} Rule Violations`,
      findingCategory: 'Verified rule violation',
      decision: 'DISPUTED',
      decisionNote: `Sent formal rejection email to ${data.recipientEmail} (${data.recipientName}): Re-revision required before publish.`,
      decidedBy: 'Meera (Compliance Reviewer)',
      brandVersion: kb.activeVersion,
      timestamp: new Date().toISOString()
    });

    setToastMessage(`Rejection email notice sent to ${data.recipientEmail}. Creator alerted.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
          }}
        >
          <MailCheck size={18} color="#16A34A" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3-Pane Workspace Container matching Image 2 & PDF Page 7 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr 490px',
          gap: '20px',
          alignItems: 'stretch',
          minHeight: '760px'
        }}
      >
        {/* Pane 1: Batches & Material Selection */}
        <div className="curved-section-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <UploadPane
            selectedAsset={selectedAsset}
            onSelectAsset={handleSelectAsset}
            onFileUpload={handleFileUpload}
            onTextChange={setDraftText}
            currentText={draftText}
            isAuditing={isAuditing}
            onRunAudit={() => executeAudit(draftText, selectedAsset.name, selectedAsset.type, selectedAsset.previewUrl, selectedAsset.detectedLogoTag, 'Direct Input')}
            auditProgress={auditProgress}
            onOpenEmailModal={() => setIsEmailModalOpen(true)}
            onOpenGroqReportModal={() => setIsGroqReportModalOpen(true)}
          />
        </div>

        {/* Pane 2: Preview Material with Interactive Numbered Markers */}
        <div className="curved-section-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <AssetPreviewPane
            assetTitle={selectedAsset.name}
            assetType={selectedAsset.type}
            previewUrl={selectedAsset.previewUrl}
            rawText={draftText}
            findings={auditReport?.findings || []}
            selectedFindingId={selectedFindingId}
            onSelectFinding={id => setSelectedFindingId(id)}
            extractedVia={auditReport?.extractedVia || 'Direct Input'}
            ocrConfidence={auditReport?.ocrConfidence}
          />
        </div>

        {/* Pane 3: Review Issues & Evidence Table */}
        <div className="curved-section-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <ReviewIssuesPane
            findings={auditReport?.findings || []}
            selectedFindingId={selectedFindingId}
            onSelectFinding={id => setSelectedFindingId(id)}
            onOpenDecisionModal={(f, a) => {
              setDecisionModalFinding(f);
              setDecisionModalAction(a);
            }}
            overallScore={auditReport?.overallScore ?? 60}
            hasRunAudit={auditReport !== null}
            onRunAudit={() => executeAudit(draftText, selectedAsset.name, selectedAsset.type, selectedAsset.previewUrl, selectedAsset.detectedLogoTag, 'Direct Input')}
            isAuditing={isAuditing}
            onQuickApplyFix={handleQuickApplyFix}
            onApplyAllFixes={handleApplyAllFixes}
          />
        </div>
      </div>

      {/* Human Decision Modal */}
      {decisionModalFinding && (
        <HumanDecisionModal
          finding={decisionModalFinding}
          actionType={decisionModalAction}
          onClose={() => setDecisionModalFinding(null)}
          onConfirm={handleConfirmDecision}
        />
      )}

      {/* Send Back Email Modal */}
      {isEmailModalOpen && (
        <SendBackEmailModal
          assetTitle={selectedAsset.name}
          findings={auditReport?.findings || []}
          onClose={() => setIsEmailModalOpen(false)}
          onSendEmail={handleSendEmailNotification}
        />
      )}

      {/* Groq Team Report Modal */}
      {isGroqReportModalOpen && auditReport && (
        <GroqReportModal
          report={auditReport}
          kb={kb}
          onClose={() => setIsGroqReportModalOpen(false)}
        />
      )}
    </div>
  );
};
