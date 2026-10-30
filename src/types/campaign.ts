import { AuditReport, AuditFinding } from './audit';

export type AssetChannel =
  | 'Instagram'
  | 'Website'
  | 'Print Brochure'
  | 'Email'
  | 'Billboard'
  | 'LinkedIn'
  | 'Facebook'
  | 'SMS'
  | 'WhatsApp'
  | 'Mobile App';

export interface CampaignAsset {
  id: string;
  title: string;
  channel: AssetChannel;
  format: 'Image' | 'PDF' | 'Copy';
  teamName?: string; // e.g. "Creative Pulse Agency", "Metro Print Studio", "Growth CRM"
  previewUrl: string;
  uploadedAt: string;
  productId?: string;
  productSku?: string;
  extractedPrice?: number;
  extractedPriceStr?: string;
  extractedDiscountPercent?: number; // e.g. 20, 25, 35
  extractedPromoCode?: string; // e.g. "DIWALI25", "WINTERFEST", "AUTUMN20"
  extractedCta?: string; // e.g. "Shop Festive Glow", "Register as Donor", "Claim 25% Off"
  extractedVenue?: string; // e.g. "City Campus Clinic"
  extractedOffer?: string;
  extractedDate?: string;
  extractedTagline?: string;
  extractedLogoVersion?: string;
  extractedDisclaimer?: string;
  extractedTone?: string;
  extractedBackground?: string;
  backgroundStatus?: 'Approved' | 'Warning' | 'Clean';
  backgroundFindings?: string[];
  fullText: string;
  status: 'In Sync' | 'Conflicts Detected' | 'Needs Recheck';
  conflictCount: number;
  auditStatus?: 'Approved' | 'Needs Review' | 'Blocked';
  lastAuditReport?: AuditReport;
  auditFindings?: AuditFinding[];
}

export type ConflictType =
  | 'Price Discrepancy'
  | 'Discount Percentage Mismatch'
  | 'Promo Code Inconsistency'
  | 'Date Expiry Conflict'
  | 'Tagline Inconsistency'
  | 'CTA Divergence'
  | 'Outdated Logo'
  | 'Missing Disclaimer'
  | 'Tone Divergence'
  | 'Commercial / Policy Violation'
  | 'Background Scene Warning';

export interface CampaignConflict {
  id: string;
  type: ConflictType;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  involvedAssets: {
    assetId: string;
    assetTitle: string;
    channel: AssetChannel;
    teamName?: string;
    detectedValue: string;
  }[];
  approvedTruth: {
    rule: string;
    validValue: string;
    sourceDocument: string;
  };
  suggestedAlignment: string;
}

export interface TeamCampaignBatch {
  id: string;
  teamName: string;
  role: string;
  assets: CampaignAsset[];
  status: 'Conflicts Detected' | 'Under Review' | 'In Sync';
  faultCount: number;
}

export type CampaignCategory =
  | 'Festive'
  | 'CSR & Public Health'
  | 'Winter / Seasonal'
  | 'Core Commercial';

export interface Campaign {
  id: string;
  name: string;
  code: string;
  category?: CampaignCategory;
  themeColor?: string;
  status: 'Active' | 'Under Review' | 'Flagged' | 'Approved';
  targetAudience: string;
  startDate: string;
  endDate: string;
  campaignGoal?: string;
  // Approved master campaign benchmark targets
  approvedDiscountPercent?: number;
  approvedPromoCode?: string;
  approvedCta?: string;
  approvedVenue?: string;
  approvedDate?: string;
  approvedPrice?: number;
  assets: CampaignAsset[];
  teamBatches?: TeamCampaignBatch[];
  conflicts: CampaignConflict[];
  lastRecheckedAt: string;
  brandVersionSynced: string;
}
