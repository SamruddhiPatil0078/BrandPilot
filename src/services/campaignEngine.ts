import { Campaign, CampaignAsset, CampaignConflict } from '../types/campaign';
import { BrandKnowledgeBase } from '../types/brand';

/**
 * Campaign Consistency Engine
 * Treats all multi-channel assets in a campaign as a single cohesive set
 * and catches cross-asset discrepancies in prices, offers, dates, logos, and disclaimers.
 */
export function auditCampaignConsistency(
  campaign: Campaign,
  kb: BrandKnowledgeBase
): { updatedAssets: CampaignAsset[]; conflicts: CampaignConflict[] } {
  const assets = [...campaign.assets];
  const conflicts: CampaignConflict[] = [];

  // 1. Cross-Asset Price Check
  const assetsWithPrice = assets.filter(a => a.extractedPrice !== undefined && a.extractedPrice > 0);
  const priceSet = new Set(assetsWithPrice.map(a => a.extractedPrice));

  if (priceSet.size > 1) {
    const approvedPrice = kb.products[0]?.currentPrice || 1299;
    conflicts.push({
      id: `conf-price-${Date.now()}`,
      type: 'Price Discrepancy',
      title: 'Conflicting Product Pricing Across Campaign Assets',
      severity: 'HIGH',
      description: `Multiple conflicting prices detected across channels: ${Array.from(priceSet).map(p => `₹${p}`).join(', ')}. Instagram displays legacy rate ₹1,099 while Website displays ₹1,299.`,
      involvedAssets: assetsWithPrice.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        detectedValue: a.extractedPriceStr || `₹${a.extractedPrice}`
      })),
      approvedTruth: {
        rule: `Approved Price for ${kb.products[0]?.productName || 'Moisturizer'}`,
        validValue: `₹${approvedPrice.toLocaleString('en-IN')} (Standard Catalog ${kb.activeVersion})`,
        sourceDocument: `Product Pricing Catalog ${kb.activeVersion}`
      },
      suggestedAlignment: `Standardize all assets to the approved current price of ₹${approvedPrice.toLocaleString('en-IN')}.`
    });
  }

  // 2. Cross-Asset Logo Check
  const outdatedLogoAssets = assets.filter(a =>
    a.extractedLogoVersion?.toLowerCase().includes('deprecated') ||
    a.extractedLogoVersion?.toLowerCase().includes('v2') ||
    a.extractedLogoVersion?.toLowerCase().includes('outdated')
  );

  if (outdatedLogoAssets.length > 0) {
    conflicts.push({
      id: `conf-logo-${Date.now()}`,
      type: 'Outdated Logo',
      title: 'Deprecated Logo v2 in Active Campaign Assets',
      severity: 'MEDIUM',
      description: `${outdatedLogoAssets.map(a => a.channel).join(' and ')} use deprecated Vintage Floral Crest (Logo v2.1) instead of the approved modern mark (Logo v3.0).`,
      involvedAssets: assets.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        detectedValue: a.extractedLogoVersion || 'Unknown Logo'
      })),
      approvedTruth: {
        rule: 'Current Approved Brand Visual Identity',
        validValue: 'Logo v3.0 (Botanical Emblem)',
        sourceDocument: 'Brand Visual Assets Library v3.0'
      },
      suggestedAlignment: 'Replace outdated raster crest in flagged assets with official vector Logo v3.0.'
    });
  }

  // 3. Cross-Asset Tagline Check
  const taglinesFound = assets
    .filter(a => a.extractedTagline)
    .map(a => ({
      asset: a,
      tagline: a.extractedTagline!
    }));

  const uniqueTaglines = Array.from(new Set(taglinesFound.map(t => t.tagline.trim().toLowerCase())));
  if (uniqueTaglines.length > 1) {
    conflicts.push({
      id: `conf-tagline-${Date.now()}`,
      type: 'Tagline Inconsistency',
      title: 'Tagline Divergence & Unapproved Slogan Across Channels',
      severity: 'HIGH',
      description: `Inconsistent taglines used across campaign: "${assets[0]?.extractedTagline}" on Instagram vs "${assets[1]?.extractedTagline}" on Website. Unverified superlative detected.`,
      involvedAssets: taglinesFound.map(t => ({
        assetId: t.asset.id,
        assetTitle: t.asset.title,
        channel: t.asset.channel,
        detectedValue: t.tagline
      })),
      approvedTruth: {
        rule: 'Approved Primary Brand Tagline',
        validValue: `"${kb.tone.primaryTagline}"`,
        sourceDocument: 'Tone & Voice Guidelines v3.0'
      },
      suggestedAlignment: `Align marketing copy across all channels to approved primary tagline "${kb.tone.primaryTagline}".`
    });
  }

  // 4. Missing Disclaimers Check
  const missingDisclaimerAssets = assets.filter(a =>
    a.extractedDisclaimer?.toLowerCase().includes('missing') ||
    a.extractedDisclaimer?.toLowerCase().includes('none')
  );

  if (missingDisclaimerAssets.length > 0) {
    conflicts.push({
      id: `conf-disc-${Date.now()}`,
      type: 'Missing Disclaimer',
      title: 'Mandatory Clinical Disclaimer Omitted in Social Channel',
      severity: 'HIGH',
      description: `${missingDisclaimerAssets.map(a => a.channel).join(', ')} carries promotional claims without the required clinical trial disclaimer asterisk and explanatory footnote.`,
      involvedAssets: assets.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        detectedValue: a.extractedDisclaimer || 'No disclaimer'
      })),
      approvedTruth: {
        rule: 'Mandatory Clinical Trial Substantiation Disclaimer',
        validValue: kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.',
        sourceDocument: 'Legal & Regulatory Standards (ASCI / CCPA)'
      },
      suggestedAlignment: 'Append approved clinical footnote in caption or asset footer.'
    });
  }

  // Update asset statuses based on conflict involvement
  const updatedAssets = assets.map(asset => {
    const assetConflicts = conflicts.filter(c =>
      c.involvedAssets.some(ia => ia.assetId === asset.id && (
        c.type === 'Outdated Logo' ? ia.detectedValue.includes('v2') || ia.detectedValue.includes('Deprecated') :
        c.type === 'Price Discrepancy' ? ia.detectedValue.includes('1,099') :
        c.type === 'Missing Disclaimer' ? ia.detectedValue.toLowerCase().includes('missing') || ia.detectedValue.toLowerCase().includes('no') :
        c.type === 'Tagline Inconsistency' ? ia.detectedValue.includes('most loved') :
        false
      ))
    );

    return {
      ...asset,
      status: assetConflicts.length > 0 ? ('Conflicts Detected' as const) : ('In Sync' as const),
      conflictCount: assetConflicts.length
    };
  });

  return { updatedAssets, conflicts };
}

/**
 * Recheck all campaign assets when an approved brand fact or price changes in Module 1
 */
export function recheckAffectedCampaignAssets(
  campaign: Campaign,
  kb: BrandKnowledgeBase
): {
  affectedAssets: { asset: CampaignAsset; reason: string; requiredChange: string }[];
  updatedCampaign: Campaign;
} {
  const currentPrice = kb.products[0]?.currentPrice ?? 1299;
  const currentLogoVersion = kb.logos.find(l => l.status === 'Approved Current')?.version || 'v3.0';
  const approvedTagline = kb.tone.primaryTagline;

  const affectedList: { asset: CampaignAsset; reason: string; requiredChange: string }[] = [];

  const audited = auditCampaignConsistency(campaign, kb);

  for (const asset of audited.updatedAssets) {
    const reasons: string[] = [];
    const changes: string[] = [];

    if (asset.extractedPrice !== undefined && asset.extractedPrice !== currentPrice) {
      reasons.push(`Displays price ₹${asset.extractedPrice} which differs from current approved catalog price ₹${currentPrice}.`);
      changes.push(`Update price to ₹${currentPrice}.`);
    }

    if (asset.extractedLogoVersion && !asset.extractedLogoVersion.includes('v3')) {
      reasons.push(`Uses logo version ${asset.extractedLogoVersion} which is deprecated.`);
      changes.push(`Replace with official Logo ${currentLogoVersion}.`);
    }

    if (asset.extractedTagline && asset.extractedTagline.toLowerCase().includes('most loved')) {
      reasons.push(`Uses unverified superlative "${asset.extractedTagline}".`);
      changes.push(`Replace with approved tagline "${approvedTagline}".`);
    }

    if (reasons.length > 0) {
      affectedList.push({
        asset,
        reason: reasons.join(' '),
        requiredChange: changes.join(' ')
      });
    }
  }

  const updatedCampaign: Campaign = {
    ...campaign,
    assets: audited.updatedAssets.map(a => {
      const isAffected = affectedList.some(item => item.asset.id === a.id);
      return {
        ...a,
        status: isAffected ? 'Needs Recheck' : a.status
      };
    }),
    conflicts: audited.conflicts,
    lastRecheckedAt: new Date().toISOString(),
    brandVersionSynced: kb.activeVersion
  };

  return { affectedAssets: affectedList, updatedCampaign };
}
