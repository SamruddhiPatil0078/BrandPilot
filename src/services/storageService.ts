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
      aliases: ['Aurelia Deep Hydrating Moisturizer', 'Deep Hydrating Moisturizer', 'Hydrating Moisturizer', 'Moisturizer 50g'],
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
      aliases: ['Aurelia Radiant Vitamin C Serum', 'Radiant Vitamin C Serum', 'Vitamin C Glow Serum', 'Vitamin C Serum', 'Glow Serum 30ml'],
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
      aliases: ['Aurelia Soothing Barrier Cleanser', 'Soothing Barrier Cleanser', 'Barrier Cleanser', 'Cleanser 150ml'],
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
  ],
  backgroundGuidelines: {
    overview: 'All campaign and creative visual backdrops must reinforce Aurelia’s 100% Vegan, cruelty-free, clinical, and secular brand governance standards. Backgrounds must be calm, elegant, and free from sensitive, conflicting, or non-vegan elements.',
    approvedBackdrops: [
      'Pearl Cream (#F7F5F0) matte surface with gentle diffused sunlight',
      'Minimalist cosmetic laboratory glassware & sterile glass stands',
      'Fresh botanical leaves (e.g., Centella Asiatica, Green Tea flora)',
      'Clean bathroom marble counter / spa stone aesthetic',
      'Subtle Aurelia Emerald (#00473E) and gold tint studio backdrops'
    ],
    restrictedElements: [
      {
        id: 'bg-meat',
        category: 'Meat / Non-Veg',
        elementName: 'Meat / Non-Vegetarian Food Items',
        keywords: ['meat', 'chicken', 'pork', 'beef', 'steak', 'barbecue', 'bbq', 'seafood', 'bacon', 'poultry', 'non-veg', 'grill meat', 'fish', 'mutton', 'lamb', 'ham', 'sausage'],
        severity: 'WARNING',
        policyReason: 'Aurelia is certified 100% Vegan & Cruelty-Free (PETA PV-2024). Any meat or animal-based food products in background scenes violate ethical vegan identity and cause brand confusion.',
        suggestedFix: 'Replace background with neutral marble, clean ceramic, or botanical leaf styling.',
        isActive: true
      },
      {
        id: 'bg-animals',
        category: 'Animals',
        elementName: 'Live Animals / Pets in Frame',
        keywords: ['animal', 'animals', 'dog', 'puppy', 'cat', 'kitten', 'pet', 'pets', 'wildlife', 'bird', 'fur', 'canine', 'feline'],
        severity: 'WARNING',
        policyReason: 'Cruelty-free dermatological brand compliance. Domestic pets or animals in product application settings create consumer allergen concerns and detract from clinical dermatological credibility.',
        suggestedFix: 'Remove animal from background composition. Use clinical, serene lifestyle environment.',
        isActive: true
      },
      {
        id: 'bg-religion',
        category: 'Religion / Religious Symbols',
        elementName: 'Religious Iconography, Symbols & Places of Worship',
        keywords: ['religion', 'religious', 'temple', 'shrine', 'altar', 'idol', 'church', 'mosque', 'prayer', 'deity', 'sacred', 'cross symbol', 'om symbol', 'religious artifact', 'god', 'goddess', 'worship'],
        severity: 'WARNING',
        policyReason: 'Secular brand governance & statutory advertising ethics. In compliance with ASCI Chapter III sensitivity standards, commercial skincare advertising must not invoke religious faith, deities, or places of worship.',
        suggestedFix: 'Maintain a secular, neutral aesthetic without religious or devotional artifacts in backdrop.',
        isActive: true
      },
      {
        id: 'bg-serum',
        category: 'Raw Serum Elements',
        elementName: 'Exposed Raw Chemical Elements / Unapproved Ingredient Graphics in Serum',
        keywords: [
          'element in serum',
          'chemical element',
          'serum element',
          'raw chemical',
          'chemical formula',
          'raw acid',
          'floating chemical',
          'acid formula',
          'chemical molecule',
          'unapproved element',
          'serum element showed',
          'element showed',
          'pipette direct skin',
          'h2so4',
          'pure acid graphic'
        ],
        severity: 'WARNING',
        policyReason: 'Cosmetic safety standards prohibit depicting raw hazardous chemical elements, floating reactive molecular equations, or unbuffered acids in serum imagery, which causes consumer chemical anxiety.',
        suggestedFix: 'Depict serum with approved golden botanical droplet texture or clean dermatological dropper without exposed reactive chemical elements.',
        isActive: true
      }
    ]
  }
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
      id: 'asset-cp-1',
      title: 'Instagram Story Ad - Autumn Launch',
      channel: 'Instagram',
      format: 'Image',
      teamName: 'Team Creative Pulse',
      previewUrl: 'instagram-aurelia-creative',
      uploadedAt: '2026-10-24T16:20:00Z',
      extractedPrice: 1099,
      extractedPriceStr: '₹1,099',
      extractedOffer: 'Monsoon Sale legacy offer',
      extractedDate: '30 Sept 2026',
      extractedTagline: "India's most loved moisturizer!",
      extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
      extractedDisclaimer: 'Missing mandatory disclaimer',
      extractedTone: 'Urgent / Hyperbolic',
      extractedBackground: '✓ Pearl Cream (#F7F5F0) matte studio surface with subtle botanical shadow',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "India's most loved moisturizer! Results guaranteed in 7 days. Just ₹1,099! Aurelia Hydrating Moisturizer 50g.",
      status: 'Conflicts Detected',
      conflictCount: 3
    },
    {
      id: 'asset-cp-2',
      title: 'Instagram Reel Promo Banner',
      channel: 'Instagram',
      format: 'Image',
      teamName: 'Team Creative Pulse',
      previewUrl: 'instagram-reel-creative',
      uploadedAt: '2026-10-24T18:00:00Z',
      extractedPrice: 1099,
      extractedPriceStr: '₹1,099',
      extractedOffer: 'Social flash deal',
      extractedDate: '30 Sept 2026',
      extractedTagline: 'Miracle radiance glow',
      extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
      extractedDisclaimer: 'Missing mandatory disclaimer',
      extractedTone: 'Hype / FOMO',
      extractedBackground: '✓ Minimalist cosmetic laboratory glassware stand with botanical leaf',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Special social price ₹1,099! Erase barrier dryness with miracle botanicals.",
      status: 'Conflicts Detected',
      conflictCount: 3
    },
    {
      id: 'asset-cp-3',
      title: 'Influencer Collaboration Copy Brief',
      channel: 'Instagram',
      format: 'Copy',
      teamName: 'Team Creative Pulse',
      previewUrl: 'compliant-preview',
      uploadedAt: '2026-10-25T09:30:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Creator affiliate discount',
      extractedDate: '30 Nov 2026',
      extractedTagline: 'Discover your daily skincare ritual.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
      extractedTone: 'Calm / Clinical',
      extractedBackground: '✓ Pearl Cream (#F7F5F0) minimalist laboratory backdrop with fresh botanical leaf',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Aurelia Deep Hydrating Moisturizer (₹1,299). 72h cellular hydration backed by clinical trial HT-402.",
      status: 'In Sync',
      conflictCount: 0
    },
    {
      id: 'asset-mp-1',
      title: 'Clinic Reception Tri-Fold Brochure',
      channel: 'Print Brochure',
      format: 'PDF',
      teamName: 'Team Metro Print & Retail',
      previewUrl: 'clinic-brochure',
      uploadedAt: '2026-10-25T11:15:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Standard catalog',
      extractedDate: '30 Nov 2026',
      extractedTagline: 'Pure care, real results.',
      extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
      extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
      extractedTone: 'Clinical',
      extractedBackground: '✓ Clean sterile clinic glass tray & marble counter',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Aurelia Clinical Guide. Pure care, real results. Price: ₹1,299. Features Logo v2.1 vintage crest on cover.",
      status: 'Conflicts Detected',
      conflictCount: 1
    },
    {
      id: 'asset-mp-2',
      title: 'Metro Station Outdoor Billboard',
      channel: 'Billboard',
      format: 'Image',
      teamName: 'Team Metro Print & Retail',
      previewUrl: 'billboard-creative',
      uploadedAt: '2026-10-25T14:40:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Standard MRP catalog',
      extractedDate: '30 Nov 2026',
      extractedTagline: 'Discover your daily skincare ritual.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
      extractedTone: 'Calm / Premium',
      extractedBackground: '✓ Pearl cream textured studio wall with soft botanical shadow',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Aurelia Skincare. Discover your daily skincare ritual. 50g at ₹1,299.",
      status: 'In Sync',
      conflictCount: 0
    },
    {
      id: 'asset-mp-3',
      title: 'In-Clinic Shelf-Talker Display Stand',
      channel: 'Print Brochure',
      format: 'Image',
      teamName: 'Team Metro Print & Retail',
      previewUrl: 'shelftalker-creative',
      uploadedAt: '2026-10-25T17:10:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Clinic retail partner pack',
      extractedDate: '30 Nov 2026',
      extractedTagline: 'Pure care, real results.',
      extractedLogoVersion: 'Logo v2.1 (Vintage Crest)',
      extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
      extractedTone: 'Clinical',
      extractedBackground: '✓ Minimalist cosmetic laboratory glassware stand with botanical leaf',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Dermatologist Recommended. Pure care, real results. Standard price ₹1,299. Note: utilizes Logo v2 crest.",
      status: 'Conflicts Detected',
      conflictCount: 1
    },
    {
      id: 'asset-gc-1',
      title: 'VIP Autumn Newsletter Blast',
      channel: 'Email',
      format: 'Copy',
      teamName: 'Team Growth & CRM Pod',
      previewUrl: 'email-blast',
      uploadedAt: '2026-10-26T09:15:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Autumn VIP 20% off with AUTUMN20',
      extractedDate: '15 Nov 2026',
      extractedTagline: 'Discover your daily skincare ritual.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*Prices inclusive of all taxes.',
      extractedTone: 'Warm / Educational',
      extractedBackground: '✓ Pearl cream neutral email card layout',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Subject: Your Autumn Skincare Ritual Begins Here. Dear Aurelia VIP, restore barrier health with Aurelia Deep Hydrating Moisturizer (₹1,299). Enjoy 20% off with code AUTUMN20 through Nov 15. *Prices inclusive of all taxes.",
      status: 'In Sync',
      conflictCount: 0
    },
    {
      id: 'asset-gc-2',
      title: 'Abandoned Cart Recovery SMS',
      channel: 'SMS',
      format: 'Copy',
      teamName: 'Team Growth & CRM Pod',
      previewUrl: 'sms-preview',
      uploadedAt: '2026-10-26T10:45:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'Complimentary travel cleanser',
      extractedDate: '30 Nov 2026',
      extractedTagline: 'Pure care, real results.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*T&C apply.',
      extractedTone: 'Calm',
      extractedBackground: '✓ Text format clean card',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Hi! Complete your Aurelia daily skincare ritual. Your Deep Hydrating Moisturizer (₹1,299) is saved. Pure care, real results.",
      status: 'In Sync',
      conflictCount: 0
    },
    {
      id: 'asset-gc-3',
      title: 'Mobile App Push Notification',
      channel: 'Mobile App',
      format: 'Copy',
      teamName: 'Team Growth & CRM Pod',
      previewUrl: 'push-preview',
      uploadedAt: '2026-10-26T11:20:00Z',
      extractedPrice: 1299,
      extractedPriceStr: '₹1,299',
      extractedOffer: 'In-app hydration perk',
      extractedDate: '30 Nov 2026',
      extractedTagline: 'Discover your daily skincare ritual.',
      extractedLogoVersion: 'Logo v3 (Approved)',
      extractedDisclaimer: '*Valid in-app only.',
      extractedTone: 'Direct / Helpful',
      extractedBackground: '✓ Mobile App system layout',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: "Hydration check: Discover your daily skincare ritual with Aurelia 50g (₹1,299). Clinically proven barrier restoration.",
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
      const parsed = JSON.parse(raw);
      if (!parsed.backgroundGuidelines) {
        parsed.backgroundGuidelines = INITIAL_BRAND_KNOWLEDGE_BASE.backgroundGuidelines;
      }
      if (Array.isArray(parsed.products)) {
        parsed.products = parsed.products.map((p: any) => {
          if (!p.aliases || p.aliases.length === 0) {
            const initP = INITIAL_BRAND_KNOWLEDGE_BASE.products.find(ip => ip.id === p.id || ip.sku === p.sku);
            return { ...p, aliases: initP?.aliases || [] };
          }
          return p;
        });
      }
      return parsed;
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
      const parsed = JSON.parse(raw);
      if (parsed.assets && parsed.assets.length > 0 && parsed.assets[0].teamName) {
        return parsed;
      }
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

export function rollbackBrandKnowledgeBase(targetVersion: string, currentKb: BrandKnowledgeBase): BrandKnowledgeBase {
  const historyItem = currentKb.versionHistory?.find(v => v.version === targetVersion);
  if (historyItem?.snapshotData) {
    const restored = { ...historyItem.snapshotData };
    restored.versionHistory = [
      {
        version: `${targetVersion}-restored`,
        timestamp: new Date().toISOString(),
        updatedBy: 'Arjun (Brand Manager)',
        changesSummary: `Rolled back knowledge base to ${targetVersion} snapshot.`,
        snapshotDescription: `Restored snapshot of ${targetVersion}`
      },
      ...currentKb.versionHistory
    ];
    restored.activeVersion = targetVersion;
    saveBrandKnowledgeBase(restored);
    return restored;
  }

  // Fallback reconstructed state for standard version checkpoints
  const restored: BrandKnowledgeBase = JSON.parse(JSON.stringify(currentKb));
  restored.activeVersion = targetVersion;
  restored.lastUpdated = new Date().toISOString();

  if (targetVersion === 'v3.1') {
    restored.products = restored.products.map(p =>
      p.id === 'p1' ? { ...p, currentPrice: 1099 } : p
    );
  } else if (targetVersion === 'v3.0') {
    restored.products = restored.products.map(p =>
      p.id === 'p1' ? { ...p, currentPrice: 1099 } : p
    );
    restored.logos = restored.logos.map(l =>
      l.version === 'v2.1' ? { ...l, status: 'Approved Current' } : l
    );
  }

  restored.versionHistory = [
    {
      version: `${targetVersion}-restored`,
      timestamp: new Date().toISOString(),
      updatedBy: 'Arjun (Brand Manager)',
      changesSummary: `Rolled back knowledge base to ${targetVersion}.`,
      snapshotDescription: `Restored state for ${targetVersion}`
    },
    ...(currentKb.versionHistory || [])
  ];

  saveBrandKnowledgeBase(restored);
  return restored;
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
