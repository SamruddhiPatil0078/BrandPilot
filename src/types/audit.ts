export type FindingCategory =
  | 'Verified rule violation'
  | 'No supporting evidence found'
  | 'Potential inconsistency'
  | 'Confirmed false claim';

export type FindingSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type ReviewDecision = 'PENDING' | 'ACCEPTED' | 'DISPUTED' | 'ESCALATED';

export interface MarkerCoordinate {
  x: number; // percentage (0-100) on preview image
  y: number; // percentage (0-100) on preview image
  width?: number;
  height?: number;
  pinNumber: number;
}

export interface AuditFinding {
  id: string;
  pinNumber: number;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  flaggedText: string;
  explanation: string;
  approvedSource: {
    title: string;
    version: string;
    referenceId?: string;
    validityNote?: string;
  };
  suggestedFix: string;
  suggestedFixExplanation: string;
  ruleType: 'Price' | 'Claim' | 'Terminology' | 'Logo' | 'Tone' | 'Disclaimer' | 'Date';
  coordinate?: MarkerCoordinate;
  decision: ReviewDecision;
  decisionNote?: string;
  decisionBy?: string;
  decisionTimestamp?: string;
}

export interface AuditReport {
  id: string;
  assetTitle: string;
  assetType: 'image' | 'pdf' | 'text';
  assetUrl?: string;
  rawText: string;
  extractedVia: 'Tesseract OCR' | 'PDF Parser' | 'Direct Input';
  ocrConfidence?: number;
  auditTimestamp: string;
  overallScore: number; // 0-100
  brandVersionAudited: string;
  findings: AuditFinding[];
  summary: {
    totalFindings: number;
    ruleViolations: number;
    unverifiedClaims: number;
    inconsistencies: number;
    falseClaims: number;
    resolvedCount: number;
  };
}

export interface AuditLedgerRecord {
  id: string;
  findingId: string;
  assetTitle: string;
  flaggedText: string;
  findingCategory: FindingCategory;
  decision: ReviewDecision;
  decisionNote: string;
  decidedBy: string; // e.g., "Meera (Compliance Reviewer)"
  brandVersion: string;
  timestamp: string;
}
