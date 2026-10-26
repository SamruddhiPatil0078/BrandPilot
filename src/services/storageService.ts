import { BrandKnowledgeBase, BrandVersionHistoryItem } from '../types/brand';
import { AuditLedgerRecord } from '../types/audit';
import { Campaign } from '../types/campaign';

const STORAGE_KEY_KB = 'brandpilot_knowledge_base_v1';
const STORAGE_KEY_LEDGER = 'brandpilot_audit_ledger_v1';
const STORAGE_KEY_CAMPAIGNS = 'brandpilot_campaigns_v1';

export const INITIAL_BRAND_KNOWLEDGE_BASE: BrandKnowledgeBase = {
  id: 'aurelia-skincare-corp',
  brandName: 'Aurelia Skincare',
  industry: 'Dermatological Skincare & Beauty',
  activeVersion: 'v3.2',
  lastUpdated: '2026-10-01T09:00:00Z',
  updatedBy: 'Arjun (Brand Manager)',
  tone: {
    primaryTagline: 'Discover your daily skincare ritual.',
    secondaryTaglines: [
      'Pure care, real results.',
      'Dermatologist inspired, science backed.',
      'Deep hydration for naturally glowing skin.'
    ],
    pastTaglines: [
      {
        tagline: 'Glow naturally, your promise.',
        validUntil: '2026-09-30',
        reason: 'Retired after Monsoon Sale brand revamp'
      },
      {
        tagline: 'Your skin, our secret.',
        validUntil: '2025-12-31',
        reason: 'Replaced with clinical focus tagline'
      }
    ],
    approvedToneKeywords: ['Calm', 'Factual', 'Clinical', 'Empathetic', 'Dermatologist-backed', 'Transparent'],
    bannedToneKeywords: ['Hype', 'Aggressive FOMO', 'Unscientific Superlatives', 'Miracle Promises', 'Exaggerated Urgency'],
    voiceDescription: 'Aurelia speaks with the quiet authority of a clinical dermatologist who cares deeply about real skin health. We communicate factual benefits rather than dramatic hype. We never guarantee absolute cosmetic miracles, and every assertion must be anchored in lab and clinical testing.',
    complianceGuidelines: 'Follow ASCI Guidelines 2024 and CCPA 2022 Misleading Advertisement provisions. Claims of superiority ("most loved", "No. 1") must cite independent audited market studies. Timeframe guarantees ("in 7 days") are strictly forbidden.'
  },
  colors: [
    { id: 'c1', name: 'Aurelia Emerald', hex: '#00473E', usage: 'Primary brand mark, headline emphasis', isPrimary: true },
    { id: 'c2', name: 'Refined Gold', hex: '#C89B3C', usage: 'Secondary accents, badge highlights, premium seals' },
    { id: 'c3', name: 'Pearl Cream', hex: '#F7F5F0', usage: 'Surface backgrounds, clean card containers' },
    { id: 'c4', name: 'Deep Charcoal', hex: '#1A202C', usage: 'Primary body text, headers' },
    { id: 'c5', name: 'Muted Slate', hex: '#718096', usage: 'Captions, borders, disclaimers' },
    { id: 'c6', name: 'Hydration Rose', hex: '#FBD38D', usage: 'Product packaging accent, social tint' }
  ],
  typography: [
    { id: 't1', role: 'Display / Headings', family: 'Arial, sans-serif', weight: '700 (Bold)', size: '22px - 32px', lineHeight: '1.2' },
    { id: 't2', role: 'Subheadings', family: 'Arial, sans-serif', weight: '600 (Semi-bold)', size: '16px - 18px', lineHeight: '1.4' },
    { id: 't3', role: 'Body Text', family: 'Arial, sans-serif', weight: '400 (Regular)', size: '13px - 14px', lineHeight: '1.5' },
    { id: 't4', role: 'Legal & Disclaimers', family: 'Arial, sans-serif', weight: '400 (Regular)', size: '11px - 12px', lineHeight: '1.4' }
  ],
  products: [
    {
      id: 'p1',
      productName: 'Aurelia Deep Hydrating Moisturizer',
      sku: 'AUR-HM-50',
      category: 'Moisturizers & Creams',
      volume: '50g',
      currentPrice: 1299,
      currency: 'INR (₹)',
      validFrom: '2026-10-01',
      validUntil: '2027-12-31',
      approvalStatus: 'Approved',
      ingredientsSummary: '2% Multi-molecular Hyaluronic Acid, 5 Essential Ceramides, Squalane, Niacinamide',
      priceHistory: [
        {
          id: 'ph1',
          price: 1299,
          currency: 'INR (₹)',
          campaignName: 'Standard Brand Pricing v3.2',
          validFrom: '2026-10-01',
          validUntil: '2027-12-31',
          isCurrent: true,
          notes: 'Standard approved price post Monsoon Sale'
        },
        {
          id: 'ph2',
          price: 1099,
          currency: 'INR (₹)',
          campaignName: 'Monsoon Sale 2026',
          validFrom: '2026-07-01',
          validUntil: '2026-09-30',
          isCurrent: false,
          notes: 'Monsoon Sale promotional price. Expired on 30 Sept 2026.'
        },
        {
          id: 'ph3',
          price: 999,
          currency: 'INR (₹)',
          campaignName: 'Brand Launch 2025',
          validFrom: '2025-01-01',
          validUntil: '2025-06-30',
          isCurrent: false,
          notes: 'Introductory promotional price. Expired.'
        }
      ]
    },
    {
      id: 'p2',
      productName: 'Aurelia Radiant Vitamin C Serum',
      sku: 'AUR-VTC-30',
      category: 'Serums & Treatments',
      volume: '30ml',
      currentPrice: 899,
      currency: 'INR (₹)',
      validFrom: '2026-01-01',
      validUntil: '2027-06-30',
      approvalStatus: 'Approved',
      ingredientsSummary: '10% Ethyl Ascorbic Acid, Ferulic Acid, Centella Asiatica',
      priceHistory: [
        {
          id: 'ph4',
          price: 899,
          currency: 'INR (₹)',
          campaignName: 'Standard Portfolio 2026',
          validFrom: '2026-01-01',
          validUntil: '2027-06-30',
          isCurrent: true,
          notes: 'Current active pricing'
        },
        {
          id: 'ph5',
          price: 749,
          currency: 'INR (₹)',
          campaignName: 'Summer Glow Fest',
          validFrom: '2025-04-01',
          validUntil: '2025-09-30',
          isCurrent: false,
          notes: 'Expired 2025 campaign'
        }
      ]
    },
    {
      id: 'p3',
      productName: 'Aurelia Soothing Barrier Cleanser',
      sku: 'AUR-SBC-150',
      category: 'Cleansers',
      volume: '150ml',
      currentPrice: 599,
      currency: 'INR (₹)',
      validFrom: '2026-01-01',
      validUntil: '2027-12-31',
      approvalStatus: 'Approved',
      ingredientsSummary: 'Oat Kernel Extract, Panthenol, Amino Acid Surfactants',
      priceHistory: [
        {
          id: 'ph6',
          price: 599,
          currency: 'INR (₹)',
          campaignName: 'Standard Portfolio 2026',
          validFrom: '2026-01-01',
          validUntil: '2027-12-31',
          isCurrent: true,
          notes: 'Current active pricing'
        }
      ]
    }
  ],
  claims: [
    {
      id: 'cl1',
      claimText: 'Formulated with 2% Multi-Weight Hyaluronic Acid and 5 Essential Ceramides',
      category: 'Ingredients',
      supportingEvidence: 'Lab Formulation Analytical Report #CR-2025-088 certified by Aurelia Research Labs.',
      studyReference: 'Cert #CR-2025-088',
      validFrom: '2025-01-01',
      validUntil: '2027-12-31',
      approvalStatus: 'Approved',
      regulatoryTag: 'ASCI Compliant'
    },
    {
      id: 'cl2',
      claimText: 'Provides up to 72 hours of clinically verified deep skin hydration',
      category: 'Efficacy',
      supportingEvidence: 'Double-blind, placebo-controlled clinical trial HT-402 on 30 female participants over 28 days showing corneometer hydration score increase of 64%.',
      studyReference: 'Clinical Trial #HT-402',
      validFrom: '2026-01-01',
      validUntil: '2027-09-30',
      approvalStatus: 'Approved',
      regulatoryTag: 'ASCI Rule 1.4 Validated'
    },
    {
      id: 'cl3',
      claimText: 'Dermatologist tested and approved for sensitive and barrier-compromised skin',
      category: 'Safety',
      supportingEvidence: 'HRIPT (Human Repeat Insult Patch Test) safety certification #DS-991 conducted by independent certified dermatologist panel.',
      studyReference: 'Safety Cert #DS-991',
      validFrom: '2025-06-01',
      validUntil: '2027-12-31',
      approvalStatus: 'Approved',
      regulatoryTag: 'CCPA Validated'
    },
    {
      id: 'cl4',
      claimText: '100% Vegan, Cruelty-Free and formulated without synthetic fragrance',
      category: 'Sustainability',
      supportingEvidence: 'PETA Global Cruelty-Free & Vegan certification registry audit #PV-2024.',
      studyReference: 'PETA Registry #PV-2024',
      validFrom: '2024-01-01',
      validUntil: '2028-01-01',
      approvalStatus: 'Approved',
      regulatoryTag: 'International Verification'
    }
  ],
  terminology: [
    {
      id: 'term1',
      term: 'most loved',
      type: 'Banned',
      category: 'Superlatives',
      suggestedAlternative: 'Discover your daily skincare ritual / Loved by our skincare community',
      reason: 'Unsubstantiated superlative. ASCI Rule 1.4 requires an independent, third-party audited market survey before claiming "most loved" or "No. 1".',
      approvalStatus: 'Enforced'
    },
    {
      id: 'term2',
      term: 'guaranteed in 7 days',
      type: 'Banned',
      category: 'Guarantees',
      suggestedAlternative: 'Clinically formulated for visible hydration improvement within 4 weeks*',
      reason: 'Violates CCPA 2022 Guidelines and ASCI cosmetics standards. Skincare products cannot guarantee rapid medical results.',
      approvalStatus: 'Enforced'
    },
    {
      id: 'term3',
      term: 'cures acne permanently',
      type: 'Banned',
      category: 'Medical Claims',
      suggestedAlternative: 'Helps clarify and calm acne-prone skin',
      reason: 'Prohibited under Drugs and Magic Remedies (Objectionable Advertisements) Act.',
      approvalStatus: 'Enforced'
    },
    {
      id: 'term4',
      term: 'miracle',
      type: 'Banned',
      category: 'Hyperbole',
      suggestedAlternative: 'Clinically tested restorative formula',
      reason: 'Off-brand sensationalism. Violates Aurelia calm and factual voice policy.',
      approvalStatus: 'Enforced'
    },
    {
      id: 'term5',
      term: 'supports barrier hydration',
      type: 'Approved',
      category: 'Efficacy',
      suggestedAlternative: '',
      reason: 'Standard approved clinical phrasing supported by trial HT-402.',
      approvalStatus: 'Approved'
    },
    {
      id: 'term6',
      term: 'dermatologist inspired',
      type: 'Approved',
      category: 'Brand Credibility',
      suggestedAlternative: '',
      reason: 'Approved brand descriptor backed by Medical Advisory Board.',
      approvalStatus: 'Approved'
    }
  ],
  disclaimers: [
    {
      id: 'disc1',
      title: 'Clinical Efficacy & Results Disclaimer',
      disclaimerText: '*Based on clinical trial of 30 women over 4 weeks using Aurelia Deep Hydrating Moisturizer. Individual results may vary depending on skin condition and daily regimen.',
      requiredOnChannels: ['Instagram', 'Print Brochure', 'Website', 'Billboard'],
      triggerRule: 'Required on all assets mentioning hydration duration, results timeframe, or clinical trials.',
      validUntil: '2027-12-31',
      isActive: true
    },
    {
      id: 'disc2',
      title: 'Pricing & Promotional Availability Notice',
      disclaimerText: '*Maximum Retail Price inclusive of all applicable taxes. Offers valid while supplies last at authorized Aurelia retailers and website.',
      requiredOnChannels: ['Instagram', 'Website', 'Email', 'Print Brochure'],
      triggerRule: 'Required on all commercial assets displaying price or discount offers.',
      validUntil: '2027-12-31',
      isActive: true
    }
  ],
  logos: [
    {
      id: 'logo1',
      name: 'Aurelia Primary Wordmark & Emblem v3',
      version: 'v3.0',
      imageUrl: 'logo-v3-approved',
      status: 'Approved Current',
      clearZone: '24px padding around botanical emblem',
      allowedOnDark: true,
      allowedOnLight: true,
      notes: 'Current approved corporate logo introduced in October 2026 revamp. Must be used on all active creative assets.'
    },
    {
      id: 'logo2',
      name: 'Aurelia Vintage Floral Crest v2',
      version: 'v2.1',
      imageUrl: 'logo-v2-deprecated',
      status: 'Outdated Deprecated',
      clearZone: '16px',
      allowedOnDark: false,
      allowedOnLight: true,
      deprecatedDate: '2026-08-31',
      notes: 'Retired logo from 2025/early 2026. Do NOT use in current campaigns. Designer must replace with Logo v3.'
    }
  ],
  versionHistory: [
    {
      version: 'v3.2',
      timestamp: '2026-10-01T09:00:00Z',
      updatedBy: 'Arjun (Brand Manager)',
      changesSummary: 'Reinstated standard moisturizer price of ₹1,299 post Monsoon Sale. Archived ₹1,099 promotional rate with valid-until 30 Sept 2026.',
      snapshotDescription: 'Price adjustment for Q4 standard catalog.'
    },
    {
      version: 'v3.1',
      timestamp: '2026-07-01T08:30:00Z',
      updatedBy: 'Arjun (Brand Manager)',
      changesSummary: 'Approved promotional Monsoon Sale price of ₹1,099 valid through 30 Sept 2026.',
      snapshotDescription: 'Temporary Monsoon campaign pricing tier.'
    },
    {
      version: 'v3.0',
      timestamp: '2026-06-15T11:00:00Z',
      updatedBy: 'Arjun (Brand Manager)',
      changesSummary: 'Official launch of Logo v3. Deprecated Logo v2. Added ASCI 2024 claim substantiation rules.',
      snapshotDescription: 'Major brand identity & governance upgrade.'
    }
  ]
};

export const INITIAL_AUDIT_LEDGER: AuditLedgerRecord[] = [
  {
    id: 'led-1',
    findingId: 'f-101',
    assetTitle: 'Instagram Story Ad - Monsoon Teaser',
    flaggedText: '₹1,099 price display',
    findingCategory: 'Verified rule violation',
    decision: 'ACCEPTED',
    decisionNote: 'Creator confirmed ₹1,099 was correct for Monsoon period; now that it is October, updated price to ₹1,299.',
    decidedBy: 'Riya (Content Creator)',
    brandVersion: 'v3.2',
    timestamp: '2026-10-02T14:22:00Z'
  },
  {
    id: 'led-2',
    findingId: 'f-102',
    assetTitle: 'Website Hero Banner - Autumn Refresh',
    flaggedText: 'Outdated Logo v2 in corner',
    findingCategory: 'Potential inconsistency',
    decision: 'ACCEPTED',
    decisionNote: 'Replaced SVG asset on website CDN with approved Logo v3.',
    decidedBy: 'Meera (Compliance Reviewer)',
    brandVersion: 'v3.2',
    timestamp: '2026-10-03T10:15:00Z'
  }
];

export const INITIAL_CAMPAIGN: Campaign = {
  id: 'camp-autumn-2026',
  name: 'Aurelia Autumn Hydration Campaign',
  code: 'AUR-AUT-26',
  status: 'Under Review',
  targetAudience: 'Skincare enthusiasts seeking barrier restoration for changing seasons',
  startDate: '2026-10-01',
  endDate: '2026-11-30',
  lastRecheckedAt: '2026-10-26T13:45:00Z',
  brandVersionSynced: 'v3.2',
  assets: [
    {
      id: 'asset-ig-1',
      title: 'Instagram Creative v2 (Social Ad)',
      channel: 'Instagram',
      format: 'Image',
      previewUrl: 'instagram-creative',
      uploadedAt: '2026-10-24T16:20:00Z',
      extractedPrice: 1099,
      extractedPriceStr: '₹1,099',
      extractedOffer: 'Monsoon Sale legacy offer',
      extractedDate: '30 Sept 2026',
      extractedTagline: "India's most loved moisturizer!",
      extractedLogoVersion: 'Logo v2 (Deprecated)',
      extractedDisclaimer: 'Missing mandatory disclaimer',
      extractedTone: 'Urgent / Hyperbolic',
      fullText: "Aurelia Skincare - Sponsored. India's most loved moisturizer! Results guaranteed in 7 days. Just ₹1,099! Aurelia Hydrating Moisturizer 50g. Deep Hydration. Glowing Skin. Dermatologist Inspired. #AureliaSkincare #GlowingSkin",
      status: 'Conflicts Detected',
      conflictCount: 4
    },
    {
      id: 'asset-web-1',
      title: 'Official Website Hero Landing Page',
      channel: 'Website',
      format: 'Copy',
      previewUrl: 'website-hero',
      uploadedAt: '2026-10-25T11:00:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Complimentary mini cleanser with order',
      extractedDate: '31 Oct 2026',
      extractedTagline: 'Discover your daily skincare ritual.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
      extractedTone: 'Calm / Clinical',
      fullText: "Aurelia Skincare. Discover your daily skincare ritual. Clinically verified barrier hydration for 72 hours. Available now at ₹1,299. Complimentary mini cleanser with every order through 31 Oct. *Based on clinical trial of 30 women over 4 weeks.",
      status: 'In Sync',
      conflictCount: 0
    },
    {
      id: 'asset-print-1',
      title: 'In-Store Dermatologist Clinic Brochure',
      channel: 'Print Brochure',
      format: 'PDF',
      previewUrl: 'clinic-brochure',
      uploadedAt: '2026-10-25T15:30:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Clinic partner pricing',
      extractedDate: 'Valid till 30 Nov 2026',
      extractedTagline: 'Pure care, real results.',
      extractedLogoVersion: 'Logo v2 (Deprecated)',
      extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
      extractedTone: 'Clinical / Educational',
      fullText: "Aurelia Skincare Clinic Guide. Pure care, real results. Aurelia Deep Hydrating Moisturizer 50g. Price: ₹1,299 inclusive of all taxes. Valid till 30 Nov 2026. Contains 2% Hyaluronic Acid. *Based on clinical trial of 30 women over 4 weeks.",
      status: 'Conflicts Detected',
      conflictCount: 1
    },
    {
      id: 'asset-email-1',
      title: 'VIP Autumn Newsletter Blast',
      channel: 'Email',
      format: 'Copy',
      previewUrl: 'email-blast',
      uploadedAt: '2026-10-26T09:15:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299 (20% off code AUTUMN20)',
      extractedOffer: '20% off with coupon',
      extractedDate: 'Ends 15 Nov 2026',
      extractedTagline: 'Discover your daily skincare ritual.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*Prices inclusive of all taxes.',
      extractedTone: 'Warm / Educational',
      fullText: "Subject: Your Autumn Skincare Ritual Begins Here. Dear Aurelia VIP, transition smoothly into cooler weather. Restore your barrier with Aurelia Deep Hydrating Moisturizer (₹1,299). Enjoy 20% off with code AUTUMN20 through Nov 15. *Prices inclusive of all taxes.",
      status: 'In Sync',
      conflictCount: 0
    }
  ],
  conflicts: [
    {
      id: 'conf-1',
      type: 'Price Discrepancy',
      title: 'Conflicting Product Price across Campaign Assets',
      severity: 'HIGH',
      description: 'Instagram Ad shows legacy Monsoon Sale price ₹1,099, whereas Website Landing Page and Clinic Brochure display approved current price ₹1,299.',
      involvedAssets: [
        { assetId: 'asset-ig-1', assetTitle: 'Instagram Creative v2', channel: 'Instagram', detectedValue: '₹1,099' },
        { assetId: 'asset-web-1', assetTitle: 'Official Website Hero', channel: 'Website', detectedValue: '₹1,299' },
        { assetId: 'asset-print-1', assetTitle: 'Clinic Brochure', channel: 'Print Brochure', detectedValue: '₹1,299' }
      ],
      approvedTruth: {
        rule: 'Approved Price for Aurelia Deep Hydrating Moisturizer (50g)',
        validValue: '₹1,299 (Monsoon promo ₹1,099 expired 30 Sept 2026)',
        sourceDocument: 'Product Pricing Catalog v3.2'
      },
      suggestedAlignment: 'Update Instagram Creative price copy from ₹1,099 to ₹1,299 immediately.'
    },
    {
      id: 'conf-2',
      type: 'Outdated Logo',
      title: 'Deprecated Logo v2 used in Print Brochure and Instagram Creative',
      severity: 'MEDIUM',
      description: 'Clinic Brochure and Instagram Creative are using the deprecated vintage floral crest (Logo v2.1), while the Website uses the approved modern mark (Logo v3.0).',
      involvedAssets: [
        { assetId: 'asset-ig-1', assetTitle: 'Instagram Creative v2', channel: 'Instagram', detectedValue: 'Logo v2 (Vintage Crest)' },
        { assetId: 'asset-print-1', assetTitle: 'Clinic Brochure', channel: 'Print Brochure', detectedValue: 'Logo v2 (Vintage Crest)' },
        { assetId: 'asset-web-1', assetTitle: 'Official Website Hero', channel: 'Website', detectedValue: 'Logo v3 (Botanical Emblem)' }
      ],
      approvedTruth: {
        rule: 'Brand Visual Assets Standard',
        validValue: 'Logo v3.0 (Approved October 2026)',
        sourceDocument: 'Brand Visual Identity Guide v3.0'
      },
      suggestedAlignment: 'Replace asset artwork with official high-resolution Logo v3 asset before sending to print or ad networks.'
    },
    {
      id: 'conf-3',
      type: 'Tagline Inconsistency',
      title: 'Tagline Drift & Unapproved Superlative',
      severity: 'HIGH',
      description: 'Instagram Creative displays unapproved "India\'s most loved moisturizer!", whereas Website and Email blast use approved tagline "Discover your daily skincare ritual."',
      involvedAssets: [
        { assetId: 'asset-ig-1', assetTitle: 'Instagram Creative v2', channel: 'Instagram', detectedValue: "India's most loved moisturizer!" },
        { assetId: 'asset-web-1', assetTitle: 'Official Website Hero', channel: 'Website', detectedValue: 'Discover your daily skincare ritual.' },
        { assetId: 'asset-print-1', assetTitle: 'Clinic Brochure', channel: 'Print Brochure', detectedValue: 'Pure care, real results.' }
      ],
      approvedTruth: {
        rule: 'Approved Brand Voice & Taglines',
        validValue: 'Primary: "Discover your daily skincare ritual." | Secondary: "Pure care, real results."',
        sourceDocument: 'Tone & Voice Standards v3.0'
      },
      suggestedAlignment: 'Substitute unverified superlative on Instagram with approved tagline "Discover your daily skincare ritual."'
    },
    {
      id: 'conf-4',
      type: 'Missing Disclaimer',
      title: 'Mandatory Clinical Trial Disclaimer Omitted in Instagram Ad',
      severity: 'HIGH',
      description: 'Instagram Ad mentions efficacy and guarantee claims without displaying the required clinical study disclaimer asterisk and note.',
      involvedAssets: [
        { assetId: 'asset-ig-1', assetTitle: 'Instagram Creative v2', channel: 'Instagram', detectedValue: 'No disclaimer found' },
        { assetId: 'asset-web-1', assetTitle: 'Official Website Hero', channel: 'Website', detectedValue: '*Based on clinical trial of 30 women over 4 weeks.' },
        { assetId: 'asset-print-1', assetTitle: 'Clinic Brochure', channel: 'Print Brochure', detectedValue: '*Based on clinical trial of 30 women over 4 weeks.' }
      ],
      approvedTruth: {
        rule: 'Mandatory Clinical Efficacy Disclaimer',
        validValue: '*Based on clinical trial of 30 women over 4 weeks.',
        sourceDocument: 'Regulatory Compliance Standard ASCI Rule 1.4'
      },
      suggestedAlignment: 'Include mandatory asterisk and fine-print disclaimer text in Instagram caption or lower third.'
    }
  ]
};

// Storage Helpers
export function loadBrandKnowledgeBase(): BrandKnowledgeBase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KB);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading Brand KB:', e);
  }
  return INITIAL_BRAND_KNOWLEDGE_BASE;
}

export function saveBrandKnowledgeBase(kb: BrandKnowledgeBase): void {
  try {
    localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(kb));
  } catch (e) {
    console.error('Error saving Brand KB:', e);
  }
}

export function loadAuditLedger(): AuditLedgerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEDGER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading ledger:', e);
  }
  return INITIAL_AUDIT_LEDGER;
}

export function saveAuditLedgerRecord(record: AuditLedgerRecord): void {
  try {
    const ledger = loadAuditLedger();
    const updated = [record, ...ledger];
    localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving ledger record:', e);
  }
}

export function loadCampaign(): Campaign {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading Campaign:', e);
  }
  return INITIAL_CAMPAIGN;
}

export function saveCampaign(campaign: Campaign): void {
  try {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaign));
  } catch (e) {
    console.error('Error saving Campaign:', e);
  }
}

export function resetAllStorageToDefaults(): { kb: BrandKnowledgeBase; campaign: Campaign; ledger: AuditLedgerRecord[] } {
  localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(INITIAL_BRAND_KNOWLEDGE_BASE));
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGN));
  localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(INITIAL_AUDIT_LEDGER));
  return {
    kb: INITIAL_BRAND_KNOWLEDGE_BASE,
    campaign: INITIAL_CAMPAIGN,
    ledger: INITIAL_AUDIT_LEDGER
  };
}
