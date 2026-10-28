export type AssetChannel = 'Instagram' | 'Website' | 'Print Brochure' | 'Email' | 'Billboard' | 'LinkedIn' | 'Facebook' | 'SMS' | 'Mobile App';

export interface CampaignAsset {
  id: string;
  title: string;
  channel: AssetChannel;
  format: 'Image' | 'PDF' | 'Copy';
  teamName?: string; // e.g. "Creative Pulse Agency", "Metro Print Studio", "Growth CRM"
  previewUrl: string;
  uploadedAt: string;
  extractedPrice?: number;
  extractedPriceStr?: string;
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
}

export type ConflictType =
  | 'Price Discrepancy'
  | 'Offer Mismatch'
  | 'Date Expiry Conflict'
  | 'Tagline Inconsistency'
  | 'Outdated Logo'
  | 'Missing Disclaimer'
  | 'Tone Divergence'
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

export interface Campaign {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Under Review' | 'Flagged' | 'Approved';
  targetAudience: string;
  startDate: string;
  endDate: string;
  assets: CampaignAsset[];
  teamBatches?: TeamCampaignBatch[];
  conflicts: CampaignConflict[];
  lastRecheckedAt: string;
  brandVersionSynced: string;
}
