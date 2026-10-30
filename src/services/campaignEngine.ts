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

export function extractDiscountPercent(asset: CampaignAsset): number | undefined {
  if (asset.extractedDiscountPercent !== undefined && asset.extractedDiscountPercent > 0) {
    return asset.extractedDiscountPercent;
  }
  const match = asset.fullText.match(/(\d{1,2})\s*%\s*(?:off|discount)\b/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

export function extractPromoCode(asset: CampaignAsset): string | undefined {
  if (asset.extractedPromoCode) {
    return asset.extractedPromoCode.trim().toUpperCase();
  }
  const match = asset.fullText.match(/\bcode\s*:?\s*([A-Z0-9_-]{4,15})\b/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return undefined;
}

export function isCsrCampaign(campaign: Campaign): boolean {
  return (
    campaign.category === 'CSR & Public Health' ||
    /blood\s*donation|wellness\s*drive|csr/i.test(campaign.name) ||
    /blood\s*donation/i.test(campaign.code)
  );
}

/**
 * Campaign Consistency Engine
 * Treats all multi-channel assets in a campaign as a single cohesive set
 * and catches cross-asset discrepancies in prices, offers, dates, logos, disclaimers,
 * promotional discount percentages, promo codes, and campaign-specific policies.
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

      const targetPrice = campaign.approvedPrice ?? match.product?.currentPrice ?? 1299;
      if (match.isEstablished && match.product) {
        if (asset.extractedPrice !== targetPrice) {
          conflicts.push({
            id: `conf-catalog-price-${asset.id}`,
            type: 'Price Discrepancy',
            title: `Price Discrepancy for ${asset.title} (${match.product.sku})`,
            severity: 'HIGH',
            description: `${asset.title} (${asset.channel}) displays price ${asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)}, which conflicts with the approved campaign price ${formatPriceInr(targetPrice)} for ${match.product.productName} (SKU: ${match.product.sku}).`,
            involvedAssets: [{
              assetId: asset.id,
              assetTitle: asset.title,
              channel: asset.channel,
              teamName: asset.teamName,
              detectedValue: asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)
            }],
            approvedTruth: {
              rule: `Approved Price for ${match.product.productName} (${match.product.sku})`,
              validValue: `${formatPriceInr(targetPrice)} (${campaign.name})`,
              sourceDocument: `${campaign.name} Approved Pricing Standard`
            },
            suggestedAlignment: `Update ${asset.title} price copy from ${asset.extractedPriceStr || formatPriceInr(asset.extractedPrice)} to ${formatPriceInr(targetPrice)}.`
          });
          conflictingCatalogAssets.push({
            asset,
            approvedPrice: targetPrice,
            sku: match.product.sku,
            prodName: match.product.productName
          });
        }
      } else if (!match.isEstablished && match.product && asset.extractedPrice !== targetPrice) {
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
    const approvedPrice = campaign.approvedPrice || defaultProduct?.currentPrice || 1299;
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
        teamName: a.teamName,
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

  // 1c. Cross-Asset Discount Percentage Check
  const assetsWithDiscount = assets
    .map(a => ({ asset: a, discount: extractDiscountPercent(a) }))
    .filter((item): item is { asset: CampaignAsset; discount: number } => item.discount !== undefined && item.discount > 0);

  const discountSet = new Set(assetsWithDiscount.map(d => d.discount));
  const targetDiscount = campaign.approvedDiscountPercent;

  if (discountSet.size > 1 || (targetDiscount !== undefined && assetsWithDiscount.some(d => d.discount !== targetDiscount))) {
    const approvedVal = targetDiscount !== undefined ? `${targetDiscount}% OFF` : `${Array.from(discountSet)[0]}% OFF (Standard)`;
    conflicts.push({
      id: 'conf-discount-cross-assets',
      type: 'Discount Percentage Mismatch',
      title: 'Conflicting Promotional Discount Percentages Across Channels',
      severity: 'HIGH',
      description: `Discrepancy in advertised discount rates: ${assetsWithDiscount.map(d => `${d.asset.channel} (${d.discount}% OFF)`).join(' vs ')}. Consumers see conflicting promotional savings across touchpoints.`,
      involvedAssets: assetsWithDiscount.map(d => ({
        assetId: d.asset.id,
        assetTitle: d.asset.title,
        channel: d.asset.channel,
        teamName: d.asset.teamName,
        detectedValue: `${d.discount}% OFF`
      })),
      approvedTruth: {
        rule: `Authorized Promotional Discount Rate`,
        validValue: approvedVal,
        sourceDocument: `${campaign.name} Brief`
      },
      suggestedAlignment: `Harmonize promotional discount percentage to ${approvedVal} across all marketing copy.`
    });
  }

  // 1d. Cross-Asset Promo Code Check
  const assetsWithCode = assets
    .map(a => ({ asset: a, code: extractPromoCode(a) }))
    .filter((item): item is { asset: CampaignAsset; code: string } => Boolean(item.code));

  const codeSet = new Set(assetsWithCode.map(c => c.code));
  const targetCode = campaign.approvedPromoCode?.toUpperCase();

  if (codeSet.size > 1 || (targetCode && assetsWithCode.some(c => c.code !== targetCode))) {
    const validCode = targetCode || Array.from(codeSet)[0];
    conflicts.push({
      id: 'conf-promo-code-mismatch',
      type: 'Promo Code Inconsistency',
      title: 'Conflicting Checkout Promo Codes Across Campaign Channels',
      severity: 'HIGH',
      description: `Inconsistent promotional checkout codes detected: ${assetsWithCode.map(c => `${c.asset.channel} uses "${c.code}"`).join(', ')}. May cause checkout bounce or failed redemption.`,
      involvedAssets: assetsWithCode.map(c => ({
        assetId: c.asset.id,
        assetTitle: c.asset.title,
        channel: c.asset.channel,
        teamName: c.asset.teamName,
        detectedValue: `Code: ${c.code}`
      })),
      approvedTruth: {
        rule: 'Approved Campaign Checkout Voucher Code',
        validValue: validCode,
        sourceDocument: `${campaign.name} Promo Schedule`
      },
      suggestedAlignment: `Standardize all digital banners and social posts to active code "${validCode}".`
    });
  }

  // 1e. CSR Non-Commercial Policy Enforcement (e.g. Blood Donation Drives)
  if (isCsrCampaign(campaign)) {
    const commercialIncentiveKeywords = [
      'gift voucher',
      'vouchers',
      '₹500',
      'free skincare gift',
      'reward card'
    ];

    const commercialAssets = assets.filter(a =>
      commercialIncentiveKeywords.some(kw => a.fullText.toLowerCase().includes(kw)) ||
      (a.extractedCta && /voucher|buy|cashback/i.test(a.extractedCta))
    );

    if (commercialAssets.length > 0) {
      conflicts.push({
        id: 'conf-csr-commercial-violation',
        type: 'Commercial / Policy Violation',
        title: 'Prohibited Commercial Incentive in Voluntary Blood Donation Campaign',
        severity: 'HIGH',
        description: `${commercialAssets.map(a => a.channel).join(', ')} advertises commercial gifts/vouchers for blood donors. Under NBTC and CCPA ethical standards, voluntary blood donation must remain non-remunerated and cannot be incentivized with commercial sales perks.`,
        involvedAssets: commercialAssets.map(a => ({
          assetId: a.id,
          assetTitle: a.title,
          channel: a.channel,
          teamName: a.teamName,
          detectedValue: a.extractedCta || 'Commercial gift voucher copy'
        })),
        approvedTruth: {
          rule: 'NBTC & CCPA Voluntary Blood Donation Ethical Standards',
          validValue: 'Strictly non-remunerated voluntary donation. Approved perk: Complimentary health checkup & donor certificate only.',
          sourceDocument: 'National Blood Transfusion Council (NBTC) Ethical Guidelines'
        },
        suggestedAlignment: 'Remove all gift voucher/discount copy. Replace with "Complimentary Blood Donor Health Checkup & Refreshments".'
      });
    }

    // Event date drift for CSR drive
    const dateAssets = assets.filter(a => Boolean(a.extractedDate));
    const datesDetected = Array.from(new Set(dateAssets.map(a => a.extractedDate)));
    if (datesDetected.length > 1) {
      conflicts.push({
        id: 'conf-event-date-drift',
        type: 'Date Expiry Conflict',
        title: 'Event Date Discrepancy Across Blood Donation Creatives',
        severity: 'HIGH',
        description: `Conflicting drive dates detected across channels (${datesDetected.join(' vs ')}). Critical public health confusion risk.`,
        involvedAssets: dateAssets.map(a => ({
          assetId: a.id,
          assetTitle: a.title,
          channel: a.channel,
          teamName: a.teamName,
          detectedValue: a.extractedDate || 'Date mismatch'
        })),
        approvedTruth: {
          rule: 'Approved Blood Donation Camp Schedule',
          validValue: campaign.approvedVenue ? `14 November 2026 at ${campaign.approvedVenue}` : '14 November 2026 (9:00 AM – 5:00 PM)',
          sourceDocument: 'CSR Program Master Schedule'
        },
        suggestedAlignment: 'Standardize event date to 14 November 2026 across all print standees and social creatives.'
      });
    }
  }

  // 1f. Call to Action (CTA) Divergence Check
  const assetsWithCta = assets.filter(a => Boolean(a.extractedCta));
  const targetCta = campaign.approvedCta;

  if (targetCta && assetsWithCta.some(a => a.extractedCta && a.extractedCta !== targetCta)) {
    conflicts.push({
      id: 'conf-cta-divergence',
      type: 'CTA Divergence',
      title: 'Call-to-Action (CTA) Inconsistency Across Campaign Touchpoints',
      severity: 'MEDIUM',
      description: `Inconsistent calls to action: ${assetsWithCta.map(a => `${a.channel} uses "${a.extractedCta}"`).join(', ')}. All assets should guide users through a unified conversion path.`,
      involvedAssets: assetsWithCta.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        teamName: a.teamName,
        detectedValue: a.extractedCta || 'Unspecified CTA'
      })),
      approvedTruth: {
        rule: 'Approved Primary Campaign Call to Action',
        validValue: targetCta,
        sourceDocument: `${campaign.name} Campaign Brief`
      },
      suggestedAlignment: `Align all hero action buttons to approved CTA "${targetCta}".`
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
        teamName: a.teamName,
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
        teamName: t.asset.teamName,
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
    !a.extractedDisclaimer ||
    a.extractedDisclaimer.toLowerCase().includes('missing') ||
    a.extractedDisclaimer.toLowerCase().includes('none')
  );

  if (missingDisclaimerAssets.length > 0) {
    const defaultDisc = isCsrCampaign(campaign)
      ? '*Voluntary non-remunerated blood donation organized under NBTC ethical guidelines.'
      : kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

    conflicts.push({
      id: 'conf-disc-omitted',
      type: 'Missing Disclaimer',
      title: isCsrCampaign(campaign)
        ? 'Mandatory Statutory Blood Donation Disclaimer Omitted'
        : 'Mandatory Clinical Disclaimer Omitted in Social Channel',
      severity: 'HIGH',
      description: `${missingDisclaimerAssets.map(a => a.channel).join(', ')} carries promotional claims without the required statutory disclaimer footnote.`,
      involvedAssets: assets.map(a => ({
        assetId: a.id,
        assetTitle: a.title,
        channel: a.channel,
        teamName: a.teamName,
        detectedValue: a.extractedDisclaimer || 'No disclaimer'
      })),
      approvedTruth: {
        rule: isCsrCampaign(campaign) ? 'NBTC Statutory Public Health Notice' : 'Mandatory Clinical Trial Substantiation Disclaimer',
        validValue: defaultDisc,
        sourceDocument: 'Legal & Regulatory Standards (ASCI / CCPA / NBTC)'
      },
      suggestedAlignment: 'Append approved statutory footnote in caption or asset footer.'
    });
  }

  // 5. Cross-Asset Expiry Date Check (for non-CSR campaigns)
  if (!isCsrCampaign(campaign)) {
    const expiredDateAssets = assets.filter(a =>
      a.extractedDate?.toLowerCase().includes('expired') ||
      a.extractedDate?.toLowerCase().includes('30 sept') ||
      a.extractedDate?.toLowerCase().includes('31 oct') ||
      a.extractedDate?.toLowerCase().includes('25 dec')
    );

    if (expiredDateAssets.length > 0) {
      conflicts.push({
        id: 'conf-date-expiry',
        type: 'Date Expiry Conflict',
        title: 'Campaign Expiration Date Drift Across Channels',
        severity: 'MEDIUM',
        description: 'Multiple assets broadcast expired or diverging campaign validity periods. Standee lists expired date whereas active campaign runs through master schedule.',
        involvedAssets: assets.map(a => ({
          assetId: a.id,
          assetTitle: a.title,
          channel: a.channel,
          teamName: a.teamName,
          detectedValue: a.extractedDate || 'Standard Term'
        })),
        approvedTruth: {
          rule: 'Approved Campaign Term',
          validValue: campaign.endDate ? `Valid through ${campaign.endDate}` : '01 October 2026 through 30 November 2026',
          sourceDocument: 'Master Campaign Brief'
        },
        suggestedAlignment: `Standardize campaign validity end-date to ${campaign.endDate || '30 November 2026'} across all assets.`
      });
    }
  }

  // 6. Cross-Asset Background Visual Scene Check
  const backgroundRules = kb.backgroundGuidelines?.restrictedElements || [];
  const assetsWithBgWarnings = assets.filter(a => {
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
      c.involvedAssets.some(ia => {
        if (ia.assetId !== asset.id) return false;
        switch (c.type) {
          case 'Outdated Logo':
            return ia.detectedValue.includes('v2') || ia.detectedValue.includes('Deprecated') || ia.detectedValue.includes('Vintage');
          case 'Price Discrepancy': {
            const match = matchProductFromCreative(`${asset.title} ${asset.fullText}`, kb.products, {
              explicitSku: asset.productSku,
              explicitProductId: asset.productId,
              assetTitle: asset.title
            });
            const target = campaign.approvedPrice ?? match.product?.currentPrice ?? kb.products[0]?.currentPrice ?? 1299;
            return asset.extractedPrice !== undefined && asset.extractedPrice > 0 && asset.extractedPrice !== target;
          }
          case 'Discount Percentage Mismatch':
            return campaign.approvedDiscountPercent !== undefined
              ? (extractDiscountPercent(asset) ?? 0) !== campaign.approvedDiscountPercent
              : true;
          case 'Promo Code Inconsistency':
            return campaign.approvedPromoCode
              ? (extractPromoCode(asset) ?? '') !== campaign.approvedPromoCode.toUpperCase()
              : true;
          case 'CTA Divergence':
            return campaign.approvedCta ? asset.extractedCta !== campaign.approvedCta : true;
          case 'Commercial / Policy Violation':
            return /voucher|₹500|cashback|buy now/i.test(asset.fullText) || (asset.extractedCta && /voucher|buy|cashback/i.test(asset.extractedCta));
          case 'Missing Disclaimer':
            return !ia.detectedValue || ia.detectedValue.toLowerCase().includes('missing') || ia.detectedValue.toLowerCase().includes('no');
          case 'Tagline Inconsistency':
            return ia.detectedValue.includes('most loved') || ia.detectedValue.includes('miracle') || ia.detectedValue.includes('care') || ia.detectedValue.includes('24 Hours');
          case 'Date Expiry Conflict':
            return ia.detectedValue.toLowerCase().includes('expired') || ia.detectedValue.toLowerCase().includes('30 sept') || ia.detectedValue.toLowerCase().includes('12 nov') || ia.detectedValue.toLowerCase().includes('31 oct') || ia.detectedValue.toLowerCase().includes('25 dec');
          case 'Background Scene Warning':
            return ia.detectedValue.toLowerCase().includes('warning') || ia.detectedValue.toLowerCase().includes('animal') || ia.detectedValue.toLowerCase().includes('meat') || ia.detectedValue.toLowerCase().includes('religion') || ia.detectedValue.toLowerCase().includes('serum') || ia.detectedValue.toLowerCase().includes('restricted');
          default:
            return false;
        }
      })
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
 * - Standardizes prices to approved campaign/catalog rate
 * - Harmonizes discount percentages (e.g. 25% OFF)
 * - Harmonizes checkout promo codes (e.g. DIWALI25, WINTERFEST)
 * - Upgrades deprecated Logo v2 to approved Logo v3.0
 * - Unifies taglines to approved primary tagline
 * - Appends mandatory statutory/clinical trial footnotes
 * - Extends validity to approved term
 * - Enforces CSR ethical rules (replaces commercial gift vouchers with health checkups)
 * - Re-audits the campaign to verify zero conflicts remain
 */
export function autoAlignCampaignAssets(
  campaign: Campaign,
  kb: BrandKnowledgeBase
): { updatedCampaign: Campaign; alignedCount: number } {
  const currentLogoVersion = kb.logos.find(l => l.status === 'Approved Current')?.version || 'Logo v3 (Approved)';
  const approvedTagline =
    campaign.category === 'Festive'
      ? 'Celebrate Your Natural Radiance.'
      : campaign.category === 'CSR & Public Health'
      ? 'Aurelia Community Care & Wellness.'
      : campaign.category === 'Winter / Seasonal'
      ? 'Deep Winter Barrier Protection.'
      : kb.tone.primaryTagline;

  const approvedDisclaimer = isCsrCampaign(campaign)
    ? '*Voluntary non-remunerated blood donation conducted in strict partnership with Armed Forces Transfusion Centre under NBTC guidelines. Zero commercial compensation provided.'
    : kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

  let alignedCount = 0;

  const alignedAssets = campaign.assets.map(asset => {
    let wasModified = false;
    let newPrice = asset.extractedPrice;
    let newPriceStr = asset.extractedPriceStr;
    let newDiscount = asset.extractedDiscountPercent;
    let newPromoCode = asset.extractedPromoCode;
    let newCta = asset.extractedCta;
    let newLogoVersion = asset.extractedLogoVersion;
    let newTagline = asset.extractedTagline;
    let newDisclaimer = asset.extractedDisclaimer;
    let newDate = asset.extractedDate;
    let newVenue = asset.extractedVenue;
    let newBackground = asset.extractedBackground;
    let newBackgroundStatus = asset.backgroundStatus;
    let newFullText = asset.fullText;

    // 1. Align Price
    if (campaign.category !== 'CSR & Public Health') {
      const match = matchProductFromCreative(`${asset.title} ${asset.fullText}`, kb.products, {
        explicitSku: asset.productSku,
        explicitProductId: asset.productId,
        assetTitle: asset.title
      });
      const assetTargetPrice = campaign.approvedPrice ?? match.product?.currentPrice ?? kb.products[0]?.currentPrice ?? 1299;

      if (asset.extractedPrice !== undefined && asset.extractedPrice !== assetTargetPrice) {
        newPrice = assetTargetPrice;
        newPriceStr = `₹${assetTargetPrice.toLocaleString('en-IN')}`;
        if (asset.extractedPrice) {
          newFullText = newFullText.replace(new RegExp(`₹\\s?${asset.extractedPrice}|\\b${asset.extractedPrice}\\b`, 'g'), `₹${assetTargetPrice.toLocaleString('en-IN')}`);
        }
        newFullText = newFullText.replace(/₹\s?1[,.]?099/g, `₹${assetTargetPrice.toLocaleString('en-IN')}`);
        newFullText = newFullText.replace(/₹\s?1[,.]?399/g, `₹${assetTargetPrice.toLocaleString('en-IN')}`);
        wasModified = true;
      }
    }

    // 2. Align Discount Percentage
    if (campaign.approvedDiscountPercent !== undefined) {
      if (asset.extractedDiscountPercent !== campaign.approvedDiscountPercent) {
        newDiscount = campaign.approvedDiscountPercent;
        newFullText = newFullText.replace(/\b\d{1,2}\s*%\s*(?:off|discount)\b/gi, `${campaign.approvedDiscountPercent}% OFF`);
        wasModified = true;
      }
    }

    // 3. Align Promo Code
    if (campaign.approvedPromoCode) {
      if (asset.extractedPromoCode !== campaign.approvedPromoCode) {
        newPromoCode = campaign.approvedPromoCode;
        newFullText = newFullText.replace(/\bcode\s*:?\s*[A-Z0-9_-]+\b/gi, `code ${campaign.approvedPromoCode}`);
        wasModified = true;
      }
    }

    // 4. Align CTA
    if (campaign.approvedCta) {
      if (asset.extractedCta !== campaign.approvedCta) {
        newCta = campaign.approvedCta;
        wasModified = true;
      }
    }

    // 5. CSR Ethical Rule Alignment (Remove commercial perks)
    if (isCsrCampaign(campaign)) {
      if (/voucher|₹500|cashback/i.test(newFullText)) {
        newFullText = newFullText.replace(
          /Free\s*₹?500\s*(?:Skincare\s*)?Gift\s*Vouchers?\s*(?:for\s*(?:every\s*)?blood\s*donors?)?/gi,
          'Complimentary Blood Donor Health Checkup & Refreshments'
        );
        newFullText = newFullText.replace(/vouchers/gi, 'donor recognition certificate');
        wasModified = true;
      }
      if (newVenue && newVenue.includes('Ward B')) {
        newVenue = campaign.approvedVenue || 'Aurelia Health Center, City Campus, Pune';
        newFullText = newFullText.replace(/City Hospital Ward B/gi, newVenue);
        wasModified = true;
      }
      if (newDate && (newDate.includes('12 Nov') || newDate.includes('12 November'))) {
        newDate = '14 November 2026';
        newFullText = newFullText.replace(/12 November 2026/gi, '14 November 2026');
        wasModified = true;
      }
    }

    // 6. Align Logo
    if (asset.extractedLogoVersion && (
      asset.extractedLogoVersion.toLowerCase().includes('v2') ||
      asset.extractedLogoVersion.toLowerCase().includes('deprecated') ||
      asset.extractedLogoVersion.toLowerCase().includes('vintage') ||
      asset.extractedLogoVersion.toLowerCase().includes('no logo')
    )) {
      newLogoVersion = currentLogoVersion;
      wasModified = true;
    }

    // 7. Align Tagline
    if (asset.extractedTagline && asset.extractedTagline !== approvedTagline) {
      newTagline = approvedTagline;
      newFullText = newFullText.replace(/India's most loved moisturizer!/gi, approvedTagline);
      newFullText = newFullText.replace(/Miracle Festive Glow in 24 Hours/gi, approvedTagline);
      newFullText = newFullText.replace(/100% cure for winter eczema in 24 hours!/gi, approvedTagline);
      newFullText = newFullText.replace(/Pure care, real results\.?/gi, approvedTagline);
      wasModified = true;
    }

    // 8. Align Disclaimer
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

    // 9. Align Expiry Date
    if (asset.extractedDate && (
      asset.extractedDate.toLowerCase().includes('expired') ||
      asset.extractedDate.toLowerCase().includes('30 sept') ||
      asset.extractedDate.toLowerCase().includes('31 oct') ||
      asset.extractedDate.toLowerCase().includes('25 dec')
    )) {
      newDate = campaign.endDate ? `Valid till ${campaign.endDate}` : 'Valid till 30 Nov 2026';
      wasModified = true;
    }

    // 10. Align Background if warning
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
      extractedDiscountPercent: newDiscount,
      extractedPromoCode: newPromoCode,
      extractedCta: newCta,
      extractedVenue: newVenue,
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
