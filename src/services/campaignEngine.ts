import { Campaign, CampaignAsset, CampaignConflict } from '../types/campaign';
import { BrandKnowledgeBase } from '../types/brand';
import { matchProductFromCreative, formatPriceInr } from './productCatalogService';

export function matchesRestrictedKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const trimmedKw = keyword.trim();
  if (!trimmedKw) return false;
  const escaped = trimmedKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word boundary regex: ensures keyword is matched as a distinct token, preventing
  // false positives such as "pet" in "competitors", "cat" in "application" or "delicate",
  // and "fur" in "further".
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
  return regex.test(text);
}

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

  // 1. Per-Asset Catalog Price Check
  const conflictingCatalogAssets: { asset: CampaignAsset; approvedPrice: number; sku: string; prodName: string }[] = [];
  assets.forEach(asset => {
    if (asset.extractedPrice !== undefined && asset.extractedPrice > 0) {
      const match = matchProductFromCreative(
        `${asset.title} ${asset.fullText}`,
        kb.products,
        {
          explicitSku: asset.productSku,
          explicitProductId: asset.productId,
          assetTitle: asset.title
        }
      );

      if (match.isEstablished && match.product) {
        if (asset.extractedPrice !== match.product.currentPrice) {
          conflicts.push({
            id: `conf-catalog-price-${asset.id}`,
            type: 'Price Discrepancy',
            title: `Price Discrepancy for ${asset.title} (${match.product.sku})`,
            severity: 'HIGH',
            description: `${asset.title} (${asset.channel}) displays price ${asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)}, which conflicts with the approved catalog price ${formatPriceInr(match.product.currentPrice)} for ${match.product.productName} (SKU: ${match.product.sku}).`,
            involvedAssets: [{
              assetId: asset.id,
              assetTitle: asset.title,
              channel: asset.channel,
              teamName: asset.teamName,
              detectedValue: asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)
            }],
            approvedTruth: {
              rule: `Approved Price for ${match.product.productName} (${match.product.sku})`,
              validValue: `${formatPriceInr(match.product.currentPrice)} (Standard Catalog ${kb.activeVersion})`,
              sourceDocument: `Product Pricing Catalog ${kb.activeVersion}`
            },
            suggestedAlignment: `Update ${asset.title} price copy from ${asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)} to ${formatPriceInr(match.product.currentPrice)}.`
          });
          conflictingCatalogAssets.push({
            asset,
            approvedPrice: match.product.currentPrice,
            sku: match.product.sku,
            prodName: match.product.productName
          });
        }
      } else if (!match.isEstablished && match.product && asset.extractedPrice !== match.product.currentPrice) {
        // Uncertain match - flag for human review
        conflicts.push({
          id: `conf-uncertain-price-${asset.id}`,
          type: 'Price Discrepancy',
          title: `Uncertain Product Price Alignment for ${asset.title}`,
          severity: 'MEDIUM',
          description: `${asset.title} displays price ${asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)} and references "${match.product.productName}", but product identity could not be definitively confirmed. Manual review required.`,
          involvedAssets: [{
            assetId: asset.id,
            assetTitle: asset.title,
            channel: asset.channel,
            teamName: asset.teamName,
            detectedValue: asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)
          }],
          approvedTruth: {
            rule: `Catalog Reference for ${match.product.productName} (${match.product.sku})`,
            validValue: `${formatPriceInr(match.product.currentPrice)} (if confirmed)`,
            sourceDocument: `Product Pricing Catalog ${kb.activeVersion}`
          },
          suggestedAlignment: `Confirm whether this asset represents SKU ${match.product.sku} before approving commercial pricing.`
        });
      }
    }
  });

  // 1b. Cross-Asset Price Discrepancy Check
  const assetsWithPrice = assets.filter(a => a.extractedPrice !== undefined && a.extractedPrice > 0);
  const priceSet = new Set(assetsWithPrice.map(a => a.extractedPrice));

  if (priceSet.size > 1) {
    const defaultProduct = kb.products[0];
    const approvedPrice = defaultProduct?.currentPrice || 1299;
    conflicts.push({
      id: 'conf-price-cross-assets',
      type: 'Price Discrepancy',
      title: 'Conflicting Product Pricing Across Campaign Assets',
      severity: 'HIGH',
      description: `Multiple conflicting prices detected across channels: ${Array.from(priceSet).map(p => `₹${p}`).join(', ')}. Different channels display conflicting rates for active products.`,
      involvedAssets: assetsWithPrice.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        detectedValue: a.extractedPriceStr || `₹${a.extractedPrice}`
      })),
      approvedTruth: {
        rule: `Approved Catalog Pricing Standard`,
        validValue: `₹${approvedPrice.toLocaleString('en-IN')} (Standard Catalog ${kb.activeVersion})`,
        sourceDocument: `Product Pricing Catalog ${kb.activeVersion}`
      },
      suggestedAlignment: `Standardize all assets to their approved current catalog prices.`
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
      id: 'conf-logo-deprecated',
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
      id: 'conf-tagline-divergence',
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
      id: 'conf-disc-omitted',
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

  // 5. Cross-Asset Expiry Date Check
  const expiredDateAssets = assets.filter(a =>
    a.extractedDate?.toLowerCase().includes('expired') ||
    a.extractedDate?.toLowerCase().includes('30 sept')
  );

  if (expiredDateAssets.length > 0) {
    conflicts.push({
      id: 'conf-date-expiry',
      type: 'Date Expiry Conflict',
      title: 'Campaign Expiration Date Drift Across Channels',
      severity: 'MEDIUM',
      description: 'Multiple assets broadcast expired or diverging campaign validity periods. Standee lists expired September date whereas active campaign runs through 30 November 2026.',
      involvedAssets: assets.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        teamName: a.teamName,
        detectedValue: a.extractedDate || 'Standard Term'
      })),
      approvedTruth: {
        rule: 'Approved Autumn Campaign Term',
        validValue: '01 October 2026 through 30 November 2026',
        sourceDocument: 'Q4 Master Campaign Brief 2026'
      },
      suggestedAlignment: 'Standardize campaign validity end-date to 30 November 2026 across all print and digital assets.'
    });
  }

  // 6. Cross-Asset Background Visual Scene Check
  const backgroundRules = kb.backgroundGuidelines?.restrictedElements || [];
  const assetsWithBgWarnings = assets.filter(a => {
    // Only inspect visual background scene description, never marketing body copy
    const textToCheck = `${a.extractedBackground || ''}`.trim();
    if (!textToCheck) return false;
    return backgroundRules.some(rule =>
      rule.isActive && rule.keywords.some(kw => matchesRestrictedKeyword(textToCheck, kw))
    );
  });

  if (assetsWithBgWarnings.length > 0) {
    conflicts.push({
      id: 'conf-bg-warning',
      type: 'Background Scene Warning',
      title: 'Restricted Background Visual Elements in Campaign Creatives',
      severity: 'MEDIUM',
      description: `${assetsWithBgWarnings.map(a => a.channel).join(' and ')} contain restricted background elements (meat, live animals, religious symbols, or raw chemical elements in serum) triggering Warning Status under Brand Memory guidelines.`,
      involvedAssets: assets.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        teamName: a.teamName,
        detectedValue: a.extractedBackground || (a.status === 'Conflicts Detected' ? 'Restricted backdrop detected' : 'Clean Pearl Cream Backdrop')
      })),
      approvedTruth: {
        rule: 'Approved Background Visual Scene Standards',
        validValue: 'Pearl Cream, clinical laboratory glassware, or fresh botanical leaves. Prohibited: meat, live animals, religious iconography, raw serum elements.',
        sourceDocument: `Brand Visual Scene Guidelines ${kb.activeVersion}`
      },
      suggestedAlignment: 'Replace background with neutral pearl cream, clinical studio glass, or calm botanical foliage.'
    });
  }

  // Update asset statuses based on conflict involvement
  const updatedAssets = assets.map(asset => {
    const assetConflicts = conflicts.filter(c =>
      c.involvedAssets.some(ia => ia.assetId === asset.id && (
        c.type === 'Outdated Logo' ? ia.detectedValue.includes('v2') || ia.detectedValue.includes('Deprecated') :
        c.type === 'Price Discrepancy' ? (() => {
          const match = matchProductFromCreative(`${asset.title} ${asset.fullText}`, kb.products, {
            explicitSku: asset.productSku,
            explicitProductId: asset.productId,
            assetTitle: asset.title
          });
          const target = match.product?.currentPrice ?? kb.products[0]?.currentPrice ?? 1299;
          return asset.extractedPrice !== undefined && asset.extractedPrice > 0 && asset.extractedPrice !== target;
        })() :
        c.type === 'Missing Disclaimer' ? ia.detectedValue.toLowerCase().includes('missing') || ia.detectedValue.toLowerCase().includes('no') :
        c.type === 'Tagline Inconsistency' ? ia.detectedValue.includes('most loved') || ia.detectedValue.includes('miracle') || ia.detectedValue.includes('care') :
        c.type === 'Date Expiry Conflict' ? ia.detectedValue.toLowerCase().includes('expired') || ia.detectedValue.toLowerCase().includes('30 sept') :
        c.type === 'Background Scene Warning' ? ia.detectedValue.toLowerCase().includes('warning') || ia.detectedValue.toLowerCase().includes('animal') || ia.detectedValue.toLowerCase().includes('meat') || ia.detectedValue.toLowerCase().includes('religion') || ia.detectedValue.toLowerCase().includes('serum') || ia.detectedValue.toLowerCase().includes('restricted') :
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
 * Batch-updates all conflicting assets in a campaign:
 * - Standardizes price to approved catalog price (₹1,299)
 * - Upgrades deprecated Logo v2 to approved Logo v3.0
 * - Unifies taglines to approved primary tagline
 * - Appends mandatory clinical trial footnotes
 * - Extends validity to approved term (30 Nov 2026)
 * - Re-audits the campaign to verify zero conflicts remain
 */
export function autoAlignCampaignAssets(
  campaign: Campaign,
  kb: BrandKnowledgeBase
): { updatedCampaign: Campaign; alignedCount: number } {
  const currentPrice = kb.products[0]?.currentPrice ?? 1299;
  const currentLogoVersion = kb.logos.find(l => l.status === 'Approved Current')?.version || 'Logo v3 (Approved)';
  const approvedTagline = kb.tone.primaryTagline;
  const approvedDisclaimer = kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

  let alignedCount = 0;

  const alignedAssets = campaign.assets.map(asset => {
    let wasModified = false;
    let newPrice = asset.extractedPrice;
    let newPriceStr = asset.extractedPriceStr;
    let newLogoVersion = asset.extractedLogoVersion;
    let newTagline = asset.extractedTagline;
    let newDisclaimer = asset.extractedDisclaimer;
    let newDate = asset.extractedDate;
    let newBackground = asset.extractedBackground;
    let newBackgroundStatus = asset.backgroundStatus;
    let newFullText = asset.fullText;

    // 1. Align Price
    const match = matchProductFromCreative(`${asset.title} ${asset.fullText}`, kb.products, {
      explicitSku: asset.productSku,
      explicitProductId: asset.productId,
      assetTitle: asset.title
    });
    const assetTargetPrice = match.product?.currentPrice ?? kb.products[0]?.currentPrice ?? 1299;

    if (asset.extractedPrice !== undefined && asset.extractedPrice !== assetTargetPrice) {
      newPrice = assetTargetPrice;
      newPriceStr = `₹${assetTargetPrice.toLocaleString('en-IN')}`;
      if (asset.extractedPrice) {
        newFullText = newFullText.replace(new RegExp(`₹\\s?${asset.extractedPrice}|\\b${asset.extractedPrice}\\b`, 'g'), `₹${assetTargetPrice.toLocaleString('en-IN')}`);
      }
      newFullText = newFullText.replace(/₹\s?1[,.]?099/g, `₹${assetTargetPrice.toLocaleString('en-IN')}`);
      wasModified = true;
    }

    // 2. Align Logo
    if (asset.extractedLogoVersion && (
      asset.extractedLogoVersion.toLowerCase().includes('v2') ||
      asset.extractedLogoVersion.toLowerCase().includes('deprecated') ||
      asset.extractedLogoVersion.toLowerCase().includes('vintage') ||
      asset.extractedLogoVersion.toLowerCase().includes('no logo')
    )) {
      newLogoVersion = currentLogoVersion;
      wasModified = true;
    }

    // 3. Align Tagline
    if (asset.extractedTagline && (
      asset.extractedTagline.toLowerCase().includes('most loved') ||
      asset.extractedTagline.toLowerCase().includes('miracle') ||
      asset.extractedTagline.toLowerCase().includes('care')
    )) {
      newTagline = approvedTagline;
      newFullText = newFullText.replace(/India's most loved moisturizer!/gi, approvedTagline);
      wasModified = true;
    }

    // 4. Align Disclaimer
    if (!asset.extractedDisclaimer ||
      asset.extractedDisclaimer.toLowerCase().includes('missing') ||
      asset.extractedDisclaimer.toLowerCase().includes('no disclaimer')
    ) {
      newDisclaimer = approvedDisclaimer;
      if (!newFullText.includes('*')) {
        newFullText = `${newFullText} ${approvedDisclaimer}`;
      }
      wasModified = true;
    }

    // 5. Align Expiry Date
    if (asset.extractedDate && (
      asset.extractedDate.toLowerCase().includes('expired') ||
      asset.extractedDate.toLowerCase().includes('30 sept') ||
      asset.extractedDate.toLowerCase().includes('31 oct')
    )) {
      newDate = 'Valid till 30 Nov 2026';
      wasModified = true;
    }

    // 6. Align Background if warning
    if (asset.backgroundStatus === 'Warning' || asset.extractedBackground?.includes('⚠️')) {
      newBackground = '✓ Pearl Cream (#F7F5F0) minimalist laboratory backdrop with fresh botanical leaf';
      newBackgroundStatus = 'Clean';
      wasModified = true;
    }

    if (wasModified) {
      alignedCount++;
    }

    return {
      ...asset,
      extractedPrice: newPrice,
      extractedPriceStr: newPriceStr,
      extractedLogoVersion: newLogoVersion,
      extractedTagline: newTagline,
      extractedDisclaimer: newDisclaimer,
      extractedDate: newDate,
      extractedBackground: newBackground || '✓ Pearl Cream (#F7F5F0) clean approved laboratory backdrop',
      backgroundStatus: (newBackgroundStatus === 'Warning' ? 'Clean' : newBackgroundStatus) || 'Clean',
      backgroundFindings: [],
      fullText: newFullText,
      status: 'In Sync' as const,
      conflictCount: 0
    };
  });

  const provisionalCampaign: Campaign = {
    ...campaign,
    assets: alignedAssets,
    lastRecheckedAt: new Date().toISOString(),
    brandVersionSynced: kb.activeVersion
  };

  const reAudited = auditCampaignConsistency(provisionalCampaign, kb);

  const updatedCampaign: Campaign = {
    ...provisionalCampaign,
    assets: reAudited.updatedAssets,
    conflicts: reAudited.conflicts,
    status: reAudited.conflicts.length === 0 ? 'Approved' : 'Under Review'
  };

  return { updatedCampaign, alignedCount };
}

export interface BackgroundScanResult {
  hasWarning: boolean;
  findings: {
    category: string;
    matchedElement: string;
    warningMessage: string;
    ruleId: string;
    policyReason: string;
    suggestedFix: string;
  }[];
  detectedSummary: string;
}

/**
 * Scan background scene description or detected tags against Brand Memory rules
 */
export function scanBackgroundScene(
  description: string,
  kb: BrandKnowledgeBase
): BackgroundScanResult {
  const rules = kb.backgroundGuidelines?.restrictedElements || [];
  const findings: BackgroundScanResult['findings'] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;
    for (const kw of rule.keywords) {
      if (matchesRestrictedKeyword(description, kw)) {
        findings.push({
          category: rule.category,
          matchedElement: kw,
          warningMessage: `⚠️ Warning: ${rule.elementName} detected in background scene`,
          ruleId: rule.id,
          policyReason: rule.policyReason,
          suggestedFix: rule.suggestedFix
        });
        break; // One finding per rule category
      }
    }
  }

  return {
    hasWarning: findings.length > 0,
    findings,
    detectedSummary: findings.length > 0
      ? `⚠️ Warning: ${findings.map(f => f.category).join(', ')} detected in background`
      : '✓ Clean / Approved Backdrop (Pearl Cream & Botanical)'
  };
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
