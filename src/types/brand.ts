export interface ColorToken {
  id: string;
  name: string;
  hex: string;
  usage: string;
  isPrimary?: boolean;
}

export interface TypographyToken {
  id: string;
  role: string;
  family: string;
  weight: string;
  size: string;
  lineHeight: string;
}

export interface PriceRecord {
  id: string;
  price: number;
  currency: string;
  campaignName?: string;
  validFrom: string;
  validUntil: string;
  isCurrent: boolean;
  notes?: string;
}

export interface ProductFact {
  id: string;
  productName: string;
  sku: string;
  category: string;
  volume: string;
  currentPrice: number;
  currency: string;
  validFrom: string;
  validUntil: string;
  approvalStatus: 'Approved' | 'Pending' | 'Deprecated';
  priceHistory: PriceRecord[];
  ingredientsSummary?: string;
  aliases?: string[];
}

export interface ApprovedClaim {
  id: string;
  claimText: string;
  category: 'Efficacy' | 'Safety' | 'Clinical' | 'Sustainability' | 'Ingredients';
  supportingEvidence: string;
  studyReference: string;
  validFrom: string;
  validUntil: string;
  approvalStatus: 'Approved' | 'Requires Evidence' | 'Expired';
  regulatoryTag: string; // e.g. "ASCI Compliant", "CCPA Validated"
}

export interface TerminologyRule {
  id: string;
  term: string;
  type: 'Approved' | 'Banned' | 'Restricted';
  category: string;
  suggestedAlternative?: string;
  reason: string;
  approvalStatus: 'Approved' | 'Enforced';
}

export interface MandatoryDisclaimer {
  id: string;
  title: string;
  disclaimerText: string;
  requiredOnChannels: string[]; // e.g. ["Instagram", "Print", "Website", "TV"]
  triggerRule: string; // e.g. "Triggered when efficacy or timeframe claims appear"
  validUntil: string;
  isActive: boolean;
}

export interface BrandLogoAsset {
  id: string;
  name: string;
  version: string;
  imageUrl: string;
  status: 'Approved Current' | 'Outdated Deprecated' | 'Legacy';
  clearZone: string;
  allowedOnDark: boolean;
  allowedOnLight: boolean;
  deprecatedDate?: string;
  notes?: string;
}

export interface BrandToneProfile {
  primaryTagline: string;
  secondaryTaglines: string[];
  pastTaglines: { tagline: string; validUntil: string; reason: string }[];
  approvedToneKeywords: string[];
  bannedToneKeywords: string[];
  voiceDescription: string;
  complianceGuidelines: string;
}

export interface BrandVersionHistoryItem {
  version: string;
  timestamp: string;
  updatedBy: string;
  changesSummary: string;
  snapshotDescription: string;
  snapshotData?: BrandKnowledgeBase;
}

export interface BackgroundRule {
  id: string;
  category: 'Meat / Non-Veg' | 'Animals' | 'Religion / Religious Symbols' | 'Raw Serum Elements' | 'Custom';
  elementName: string;
  keywords: string[];
  severity: 'WARNING' | 'VIOLATION';
  policyReason: string;
  suggestedFix: string;
  isActive: boolean;
}

export interface BackgroundImageGuidelines {
  overview: string;
  approvedBackdrops: string[];
  restrictedElements: BackgroundRule[];
}

export interface BrandKnowledgeBase {
  id: string;
  brandName: string;
  industry: string;
  activeVersion: string;
  lastUpdated: string;
  updatedBy: string;
  tone: BrandToneProfile;
  colors: ColorToken[];
  typography: TypographyToken[];
  products: ProductFact[];
  claims: ApprovedClaim[];
  terminology: TerminologyRule[];
  disclaimers: MandatoryDisclaimer[];
  logos: BrandLogoAsset[];
  versionHistory: BrandVersionHistoryItem[];
  backgroundGuidelines?: BackgroundImageGuidelines;
}

