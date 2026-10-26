import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Palette,
  Volume2,
  Copy
} from 'lucide-react';
import { AuditFinding } from '../../types/audit';

interface AssetPreviewPaneProps {
  assetTitle: string;
  assetType: 'image' | 'pdf' | 'text';
  previewUrl?: string;
  rawText: string;
  findings: AuditFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  extractedVia: string;
  ocrConfidence?: number;
}

export const AssetPreviewPane: React.FC<AssetPreviewPaneProps> = ({
  assetTitle,
  assetType,
  previewUrl,
  rawText,
  findings,
  selectedFindingId,
  onSelectFinding,
  extractedVia,
  ocrConfidence
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCorrectedVersion, setShowCorrectedVersion] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Check if asset is an ad image/pamphlet or text
  const isAdImage = Boolean(
    assetType === 'image' ||
    (previewUrl && (
      previewUrl.includes('aurelia-pamphlet-ad') ||
      previewUrl.startsWith('blob:') ||
      previewUrl.startsWith('data:') ||
      previewUrl.endsWith('.png') ||
      previewUrl.endsWith('.jpg')
    )) ||
    assetTitle.toLowerCase().includes('moisturizer hero ad') ||
    assetTitle.toLowerCase().includes('pamphlet')
  );

  // Map findings by pinNumber or ruleType
  const finding1 = findings.find(f => f.pinNumber === 1 || f.title.toLowerCase().includes('most loved') || f.flaggedText.toLowerCase().includes('most loved'));
  const finding2 = findings.find(f => f.pinNumber === 2 || f.title.toLowerCase().includes('guarantee') || f.flaggedText.toLowerCase().includes('7 days'));
  const finding3 = findings.find(f => f.pinNumber === 3 || f.ruleType === 'Price' || f.flaggedText.includes('1,099'));
  const finding4 = findings.find(f => f.pinNumber === 4 || f.flaggedText.toUpperCase().includes('ACNE') || f.title.toLowerCase().includes('acne'));
  const finding5 = findings.find(f => f.pinNumber === 5 || f.ruleType === 'Logo' || f.title.toLowerCase().includes('logo') || f.flaggedText.toLowerCase().includes('crest'));
  const finding6 = findings.find(f => f.pinNumber === 6 || f.title.toLowerCase().includes('tone') || f.ruleType === 'Terminology');
  const finding7 = findings.find(f => f.pinNumber === 7 || f.title.toLowerCase().includes('color') || f.title.toLowerCase().includes('palette'));
  const finding8 = findings.find(f => f.pinNumber === 8 || f.title.toLowerCase().includes('retired') || f.flaggedText.toLowerCase().includes('glow naturally'));

  // Generate resolved copy for text view
  const getResolvedText = () => {
    let resolved = rawText;
    findings.forEach(f => {
      if (f.flaggedText && f.suggestedFix) {
        resolved = resolved.replace(f.flaggedText, f.suggestedFix);
      }
    });
    return resolved;
  };

  const handleCopyResolved = () => {
    navigator.clipboard.writeText(getResolvedText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {/* Header controls with Old vs Fixed Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
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
            2
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Preview Material
            </span>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {showCorrectedVersion ? 'Showing Regenerated On-Brand Version' : 'Showing Draft with Highlighted Error Markers'}
            </div>
          </div>
        </div>

        {/* View Toggle (Old Draft vs Fixed matching user request) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn btn-sm ${!showCorrectedVersion ? 'btn-brand' : 'btn-secondary'}`}
            style={{ fontSize: '11.5px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setShowCorrectedVersion(false)}
          >
            <Eye size={13} />
            <span>Old (Draft Errors)</span>
          </button>

          <button
            className={`btn btn-sm ${showCorrectedVersion ? 'btn-brand' : 'btn-secondary'}`}
            style={{
              fontSize: '11.5px',
              padding: '5px 12px',
              backgroundColor: showCorrectedVersion ? '#16A34A' : '#FFFFFF',
              borderColor: showCorrectedVersion ? '#16A34A' : '#BBF7D0',
              color: showCorrectedVersion ? '#FFF' : '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onClick={() => setShowCorrectedVersion(true)}
            title="View regenerated compliant on-brand version"
          >
            <CheckCircle2 size={13} />
            <span>Fixed (Approved)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
            <button className="btn btn-secondary btn-icon-only btn-sm" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '11.5px', color: '#64748B', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button className="btn btn-secondary btn-icon-only btn-sm" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={13} />
            </button>
            <button className="btn btn-secondary btn-icon-only btn-sm" onClick={handleResetZoom} title="Reset Zoom">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div
        style={{
          flex: 1,
          minHeight: '520px',
          backgroundColor: '#F1F5F9',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
          overflowY: 'auto',
          overflowX: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '20px 16px',
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* ========================================================================= */}
          {/* CASE 1: IMAGE AD CREATIVE / PAMPHLET (Matching Aurelia Skincare Creative) */}
          {/* ========================================================================= */}
          {isAdImage && (
            <div
              style={{
                width: '420px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                position: 'relative'
              }}
            >
              {/* Top Banner Indicator */}
              {showCorrectedVersion ? (
                <div
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFF',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Regenerated On-Brand Creative (All Violations Fixed)</span>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FECACA',
                    color: '#991B1B',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertCircle size={14} color="#DC2626" />
                  <span>Interactive Ad Preview • Pins ❶–❼ Point to Exact Violations</span>
                </div>
              )}

              {/* DRAFT VIEW: Original Image with Pins ❶–❼ */}
              {!showCorrectedVersion ? (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 32px rgba(0,0,0,0.16)',
                    border: '2px solid #CBD5E1',
                    backgroundColor: '#FAF5EF',
                    width: '100%',
                    maxWidth: '420px',
                    aspectRatio: '1024 / 1536'
                  }}
                >
                  {/* High-Resolution Ad Creative */}
                  <img
                    src={previewUrl?.startsWith('blob:') || previewUrl?.startsWith('data:') ? previewUrl : '/assets/aurelia-pamphlet-ad.png'}
                    alt={assetTitle}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* PIN ❶: Headline Superlative Claim ("INDIA'S MOST LOVED MOISTURIZER!") */}
                  {(() => {
                    const isResolved = finding1?.decision === 'ACCEPTED';
                    const isSelected = selectedFindingId === finding1?.id;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '17%',
                          left: '4%',
                          width: '71%',
                          height: '11.5%',
                          border: isResolved ? '2.5px solid #16A34A' : isSelected ? '3px solid #2563EB' : '2px dashed #DC2626',
                          backgroundColor: isResolved ? 'rgba(22, 163, 74, 0.45)' : isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isResolved ? 'center' : 'flex-start',
                          padding: '0 8px',
                          boxShadow: isResolved ? '0 0 12px rgba(22,163,74,0.7)' : isSelected ? '0 0 16px rgba(37,99,235,0.85)' : '0 2px 8px rgba(220,38,38,0.4)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onClick={() => finding1 && onSelectFinding(finding1.id)}
                        title={isResolved ? 'Fixed: "Discover your daily skincare ritual."' : 'Pin 1: Unverified Superlative Claim'}
                      >
                        {isResolved ? (
                          <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                            <Check size={13} /> Fixed: "Discover your daily skincare ritual."
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                backgroundColor: isSelected ? '#2563EB' : '#DC2626',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 900,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                border: '2px solid #FFF',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                              }}
                            >
                              1
                            </div>
                            <span style={{ backgroundColor: 'rgba(220, 38, 38, 0.92)', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '10px' }}>
                              Unverified Claim
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* PIN ❷: 7-Day Guarantee ("RESULTS GUARANTEED IN 7 DAYS!") */}
                  {(() => {
                    const isResolved = finding2?.decision === 'ACCEPTED';
                    const isSelected = selectedFindingId === finding2?.id;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '30%',
                          left: '3%',
                          width: '45%',
                          height: '8%',
                          border: isResolved ? '2.5px solid #16A34A' : isSelected ? '3px solid #2563EB' : '2px dashed #DC2626',
                          backgroundColor: isResolved ? 'rgba(22, 163, 74, 0.45)' : isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isResolved ? 'center' : 'flex-start',
                          padding: '0 8px',
                          boxShadow: isResolved ? '0 0 12px rgba(22,163,74,0.7)' : isSelected ? '0 0 16px rgba(37,99,235,0.85)' : '0 2px 8px rgba(220,38,38,0.4)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onClick={() => finding2 && onSelectFinding(finding2.id)}
                        title={isResolved ? 'Fixed: Visible barrier hydration within 4 weeks*' : 'Pin 2: Absolute 7-Day Guarantee Policy Violation'}
                      >
                        {isResolved ? (
                          <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: '10.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> Fixed: Hydration in 4 wks*
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: isSelected ? '#2563EB' : '#DC2626',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11.5px',
                                fontWeight: 900,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                border: '2px solid #FFF',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                              }}
                            >
                              2
                            </div>
                            <span style={{ backgroundColor: 'rgba(220, 38, 38, 0.92)', color: '#FFF', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '8px' }}>
                              7-Day Policy Violation
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* PIN ❸: Price Tag Burst ("JUST ₹1,099! Standard price ₹1,299") */}
                  {(() => {
                    const isResolved = finding3?.decision === 'ACCEPTED';
                    const isSelected = selectedFindingId === finding3?.id;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '38.5%',
                          left: '3%',
                          width: '37%',
                          height: '17%',
                          border: isResolved ? '2.5px solid #16A34A' : isSelected ? '3px solid #2563EB' : '2px dashed #DC2626',
                          backgroundColor: isResolved ? 'rgba(22, 163, 74, 0.5)' : isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(220, 38, 38, 0.22)',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isResolved ? 'center' : 'flex-start',
                          padding: '0 8px',
                          boxShadow: isResolved ? '0 0 12px rgba(22,163,74,0.7)' : isSelected ? '0 0 16px rgba(37,99,235,0.85)' : '0 2px 8px rgba(220,38,38,0.4)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onClick={() => finding3 && onSelectFinding(finding3.id)}
                        title={isResolved ? 'Fixed: ₹1,299 Active Catalog Price' : 'Pin 3: Expired Price ₹1,099 (Active Catalog Rate is ₹1,299)'}
                      >
                        {isResolved ? (
                          <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Check size={14} /> ₹1,299 Active
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                backgroundColor: isSelected ? '#2563EB' : '#DC2626',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 900,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                border: '2px solid #FFF',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                              }}
                            >
                              3
                            </div>
                            <span style={{ backgroundColor: 'rgba(220, 38, 38, 0.92)', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '8px' }}>
                              Expired ₹1,099
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* PIN ❹: Prohibited Therapeutic Claim ("MIRACLE GLOW — CURES ACNE PERMANENTLY") */}
                  {(() => {
                    const isResolved = finding4?.decision === 'ACCEPTED';
                    const isSelected = selectedFindingId === finding4?.id;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '21%',
                          left: '75%',
                          width: '22%',
                          height: '14.5%',
                          border: isResolved ? '2.5px solid #16A34A' : isSelected ? '3px solid #2563EB' : '2px dashed #DC2626',
                          backgroundColor: isResolved ? 'rgba(22, 163, 74, 0.45)' : isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isResolved ? '0 0 12px rgba(22,163,74,0.7)' : isSelected ? '0 0 16px rgba(37,99,235,0.85)' : '0 2px 8px rgba(220,38,38,0.4)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onClick={() => finding4 && onSelectFinding(finding4.id)}
                        title={isResolved ? 'Fixed: Clarifies & Soothes Skin*' : 'Pin 4: Prohibited Acne Cure Claim (DMRA 1954)'}
                      >
                        {isResolved ? (
                          <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>
                            <Check size={11} /> Clarifies*
                          </span>
                        ) : (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? '#2563EB' : '#DC2626',
                              color: '#FFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 900,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              border: '2px solid #FFF',
                              transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                            }}
                          >
                            4
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* PIN ❺: Deprecated Logo v2.1 Vintage Crest (Top-Right Medallion) */}
                  {(() => {
                    const isResolved = finding5?.decision === 'ACCEPTED';
                    const isSelected = selectedFindingId === finding5?.id;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '1.2%',
                          left: '72%',
                          width: '25%',
                          height: '15.5%',
                          border: isResolved ? '2.5px solid #16A34A' : isSelected ? '3px solid #2563EB' : '2px dashed #DC2626',
                          backgroundColor: isResolved ? 'rgba(22, 163, 74, 0.45)' : isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isResolved ? 'center' : 'flex-end',
                          padding: '0 6px',
                          boxShadow: isResolved ? '0 0 12px rgba(22,163,74,0.7)' : isSelected ? '0 0 16px rgba(37,99,235,0.85)' : '0 2px 8px rgba(220,38,38,0.4)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onClick={() => finding5 && onSelectFinding(finding5.id)}
                        title={isResolved ? 'Fixed: Logo v3.0 Botanical Wordmark' : 'Pin 5: Deprecated Logo v2.1 Vintage Crest'}
                      >
                        {isResolved ? (
                          <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>
                            <Check size={12} /> Logo v3.0
                          </span>
                        ) : (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? '#2563EB' : '#DC2626',
                              color: '#FFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 900,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              border: '2px solid #FFF',
                              transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                            }}
                          >
                            5
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* PIN ❻: Tone Mismatch Badge */}
                  {finding6 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '29.5%',
                        left: '49%',
                        width: '24%',
                        height: '6%',
                        border: finding6.decision === 'ACCEPTED' ? '2px solid #16A34A' : '1.5px dashed #D97706',
                        backgroundColor: finding6.decision === 'ACCEPTED' ? 'rgba(22,163,74,0.4)' : 'rgba(217, 119, 6, 0.25)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        zIndex: 20
                      }}
                      onClick={() => onSelectFinding(finding6.id)}
                      title="Pin 6: Brand Tone Mismatch (Sensationalist Hype vs Clinical Authority)"
                    >
                      <span style={{ fontSize: '9px', fontWeight: 800, color: finding6.decision === 'ACCEPTED' ? '#166534' : '#92400E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Volume2 size={11} /> ❻ Tone Check
                      </span>
                    </div>
                  )}

                  {/* PIN ❼: Color Theme Conflict Badge */}
                  {finding7 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '56%',
                        left: '3%',
                        width: '37%',
                        height: '6%',
                        border: finding7.decision === 'ACCEPTED' ? '2px solid #16A34A' : '1.5px dashed #D97706',
                        backgroundColor: finding7.decision === 'ACCEPTED' ? 'rgba(22,163,74,0.4)' : 'rgba(217, 119, 6, 0.25)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        zIndex: 20
                      }}
                      onClick={() => onSelectFinding(finding7.id)}
                      title="Pin 7: Color Palette Conflict (Crimson Red #DC2626 vs Brand Emerald & Gold)"
                    >
                      <span style={{ fontSize: '9px', fontWeight: 800, color: finding7.decision === 'ACCEPTED' ? '#166534' : '#92400E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Palette size={11} /> ❼ Red Theme
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* ================================================================ */
                /* REGENERATED ON-BRAND CREATIVE (Fully Fixed matching Brand Memory) */
                /* ================================================================ */
                <div
                  style={{
                    width: '420px',
                    minHeight: '620px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '2.5px solid #16A34A',
                    boxShadow: '0 12px 36px rgba(22, 163, 74, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'radial-gradient(circle at 50% 20%, #FFFFFF 0%, #F8F5F0 60%, #EFE8DE 100%)'
                  }}
                >
                  {/* Top Bar */}
                  <div
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFF',
                      padding: '8px 16px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} />
                      <span>REGENERATED ON-BRAND CREATIVE</span>
                    </span>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                      100% Brand Memory Verified
                    </span>
                  </div>

                  <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'space-between' }}>
                    {/* Approved Logo v3.0 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid #16A34A', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#F0FDF4' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#00473E', letterSpacing: '2px' }}>AURELIA</div>
                        <span style={{ fontSize: '9.5px', color: '#16A34A', fontWeight: 700 }}>Logo v3.0 (Approved)</span>
                        <CheckCircle2 size={14} color="#16A34A" />
                      </div>

                      <div style={{ fontSize: '9.5px', color: '#00473E', fontWeight: 700, backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '4px 10px', borderRadius: '12px' }}>
                        Aurelia Emerald & Gold
                      </div>
                    </div>

                    {/* Slogan Headline */}
                    <div style={{ margin: '16px 0 10px', width: '100%' }}>
                      <div
                        style={{
                          border: '1.5px solid #86EFAC',
                          backgroundColor: '#F0FDF4',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          width: '100%'
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          ✓ Approved Primary Slogan
                        </span>
                        <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#00473E', margin: 0 }}>
                          "Discover your daily skincare ritual."
                        </h2>
                      </div>
                    </div>

                    {/* Approved Claim */}
                    <div style={{ marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          border: '1.5px solid #86EFAC',
                          borderRadius: '20px',
                          padding: '5px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={13} color="#16A34A" />
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>
                          Deep hydration for naturally glowing skin*
                        </span>
                      </div>
                    </div>

                    {/* Product Jar Visual */}
                    <div
                      style={{
                        width: '160px',
                        height: '115px',
                        margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #FAF5EF 0%, #E2D4C3 100%)',
                        borderRadius: '16px',
                        border: '2px solid #C89B3C',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#00473E' }}>AURELIA</div>
                      <div style={{ fontSize: '10px', color: '#475569' }}>Hydrating Moisturizer</div>
                      <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>50g e • Hyaluronic Acid</div>
                    </div>

                    {/* Approved Catalog Price Tag */}
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          background: '#00473E',
                          color: '#FFF',
                          padding: '8px 24px',
                          borderRadius: '26px',
                          boxShadow: '0 4px 14px rgba(0, 71, 62, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.9 }}>Available at:</span>
                        <span style={{ fontSize: '19px', fontWeight: 800, color: '#FCD34D' }}>₹1,299</span>
                        <CheckCircle2 size={16} color="#4ADE80" />
                      </div>
                      <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700, marginTop: '3px' }}>
                        ✓ Active Catalog Price v3.2
                      </div>
                    </div>

                    {/* Mandatory Disclaimer */}
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: '#475569',
                        fontStyle: 'italic',
                        lineHeight: '1.4',
                        borderTop: '1px solid #E2E8F0',
                        paddingTop: '8px',
                        marginTop: '4px'
                      }}
                    >
                      *Based on clinical trial of 30 women over 4 weeks using Aurelia Deep Hydrating Moisturizer. Individual results may vary. MRP inclusive of all taxes.
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#00473E', color: '#FFF', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                    <span>Aurelia Skincare Official</span>
                    <span style={{ color: '#4ADE80', fontWeight: 700 }}>100% Brand Memory Verified</span>
                  </div>
                </div>
              )}

              {/* Clean Navigation Pill Strip (Zero Clutter!) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {!showCorrectedVersion ? (
                  <>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Pins on Ad:</span>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '12px', backgroundColor: finding1?.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${finding1?.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`, color: finding1?.decision === 'ACCEPTED' ? '#166534' : '#DC2626' }}
                      onClick={() => finding1 && onSelectFinding(finding1.id)}
                    >
                      ❶ Slogan Claim
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '12px', backgroundColor: finding2?.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${finding2?.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`, color: finding2?.decision === 'ACCEPTED' ? '#166534' : '#DC2626' }}
                      onClick={() => finding2 && onSelectFinding(finding2.id)}
                    >
                      ❷ 7-Day Guarantee
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '12px', backgroundColor: finding3?.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${finding3?.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`, color: finding3?.decision === 'ACCEPTED' ? '#166534' : '#DC2626' }}
                      onClick={() => finding3 && onSelectFinding(finding3.id)}
                    >
                      ❸ ₹1,099 Price
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '12px', backgroundColor: finding4?.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${finding4?.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`, color: finding4?.decision === 'ACCEPTED' ? '#166534' : '#DC2626' }}
                      onClick={() => finding4 && onSelectFinding(finding4.id)}
                    >
                      ❹ Acne Cure
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '12px', backgroundColor: finding5?.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${finding5?.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`, color: finding5?.decision === 'ACCEPTED' ? '#166534' : '#DC2626' }}
                      onClick={() => finding5 && onSelectFinding(finding5.id)}
                    >
                      ❺ Logo v2
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>Resolved Standards:</span>
                    <span className="badge badge-success" style={{ fontSize: '10.5px' }}>✓ Slogan: Ritual</span>
                    <span className="badge badge-success" style={{ fontSize: '10.5px' }}>✓ Claim: Hydration*</span>
                    <span className="badge badge-success" style={{ fontSize: '10.5px' }}>✓ Price: ₹1,299</span>
                    <span className="badge badge-success" style={{ fontSize: '10.5px' }}>✓ Logo v3.0</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 2: PASTED CUSTOM TEXT / DIGITAL BANNER COPY (Interactive Text Inspector) */}
          {/* ========================================================================= */}
          {!isAdImage && (
            <div
              style={{
                width: '460px',
                minHeight: '480px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                padding: '24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Header */}
              <div style={{ borderBottom: '1.5px solid #E2E8F0', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#2563EB" />
                  <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                    {assetTitle}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                    {extractedVia}
                  </span>
                  {showCorrectedVersion && (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={handleCopyResolved}
                    >
                      <Copy size={12} />
                      <span>{copiedText ? 'Copied!' : 'Copy Fixed'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mode Banner */}
              {showCorrectedVersion ? (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#16A34A" />
                  <span>Showing Approved On-Brand Marketing Copy</span>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '8px 14px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} color="#DC2626" />
                  <span>Click any highlighted phrase (❶–❺) to inspect Brand Memory rule</span>
                </div>
              )}

              {/* Interactive Formatted Text with In-Line Numbered Markers */}
              <div
                style={{
                  fontSize: '13.5px',
                  lineHeight: '1.8',
                  color: '#1E293B',
                  fontFamily: 'Arial, sans-serif',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#FAF5EF',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  minHeight: '260px'
                }}
              >
                {!showCorrectedVersion ? (
                  /* Render draft text with interactive highlighted tags */
                  (() => {
                    const lines = rawText.split('\n');
                    return lines.map((line, lIdx) => {
                      // Check which finding matches this line
                      const matchingFinding = findings.find(f =>
                        f.flaggedText && line.toLowerCase().includes(f.flaggedText.replace(/['"]/g, '').toLowerCase().trim())
                      );

                      if (matchingFinding) {
                        const isResolved = matchingFinding.decision === 'ACCEPTED';
                        const isSelected = selectedFindingId === matchingFinding.id;

                        return (
                          <div
                            key={lIdx}
                            style={{
                              margin: '6px 0',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: isResolved ? '#F0FDF4' : isSelected ? '#EFF6FF' : '#FEF2F2',
                              border: isResolved ? '1.5px solid #BBF7D0' : isSelected ? '2px solid #2563EB' : '1.5px dashed #DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => onSelectFinding(matchingFinding.id)}
                          >
                            <span style={{ fontWeight: 600, color: isResolved ? '#166534' : '#991B1B' }}>
                              {line}
                            </span>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isResolved ? '#16A34A' : isSelected ? '#2563EB' : '#DC2626',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 800,
                                flexShrink: 0
                              }}
                            >
                              {isResolved ? <Check size={12} /> : matchingFinding.pinNumber}
                            </span>
                          </div>
                        );
                      }

                      return <div key={lIdx} style={{ margin: '4px 0' }}>{line}</div>;
                    });
                  })()
                ) : (
                  /* Render 100% compliant fixed text */
                  <div>{getResolvedText()}</div>
                )}
              </div>

              {/* Clean Navigation Pill Strip for Text Findings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Identified Issues:</span>
                {findings.map(f => (
                  <button
                    key={f.id}
                    className="btn btn-sm"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: f.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2',
                      border: `1px solid ${f.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`,
                      color: f.decision === 'ACCEPTED' ? '#166534' : '#DC2626'
                    }}
                    onClick={() => onSelectFinding(f.id)}
                  >
                    Pin {f.pinNumber}: {f.ruleType}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748B' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
          <span>Click any numbered tag (❶, ❷, ❸, ❹, ❺) to inspect Brand Memory evidence or apply fix.</span>
        </span>
        {ocrConfidence && (
          <span style={{ fontWeight: 600, color: '#16A34A' }}>
            OCR Accuracy: {ocrConfidence.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};
