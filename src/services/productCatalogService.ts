import { ProductFact } from '../types/brand';
import { AuditFinding } from '../types/audit';

/**
 * Normalizes price values into a clean integer number.
 * Handles: ₹1,299, 1299, ₹ 1,299, "Only ₹1,299", "Rs. 1,299", "INR 899".
 */
export function normalizePriceValue(val: string | number | undefined | null): number | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') {
    return isNaN(val) || val <= 0 ? undefined : Math.round(val);
  }
  if (typeof val !== 'string') return undefined;

  // Extract digits after removing commas and whitespace
  const cleaned = val.replace(/,/g, '');
  const match = cleaned.match(/(?:₹|rs\.?|inr|only|just|price[:\s]*)?\s*([0-9]{2,6})/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) || num <= 0 ? undefined : num;
  }

  const fallbackDigits = cleaned.replace(/[^0-9]/g, '');
  if (!fallbackDigits) return undefined;
  const num = parseInt(fallbackDigits, 10);
  return isNaN(num) || num <= 0 ? undefined : num;
}

/**
 * Formats a numeric price into INR currency format.
 * Example: 1299 -> "₹1,299"
 */
export function formatPriceInr(val: number): string {
  return `₹${val.toLocaleString('en-IN')}`;
}

export interface ExtractedPriceToken {
  rawText: string;
  value: number;
  index: number;
}

/**
 * Extracts all commercial price mentions from text while strictly excluding
 * false positives like years (2025, 2026, 2027), percentages (100%),
 * package volumes (50g, 30ml, 150ml), and study counts (30 women, 48 hours).
 */
export function extractPricesFromText(text: string): ExtractedPriceToken[] {
  if (!text || typeof text !== 'string') return [];

  const results: ExtractedPriceToken[] = [];
  const seenIndices = new Set<number>();

  // Regex targeting:
  // 1. Explicit currency symbols: ₹1,299, ₹ 1299, Rs. 899, INR 599
  // 2. Commercial qualifiers: Only ₹1,299, Just ₹1,099, Price: ₹1,299
  // 3. Formatted thousands with commas: 1,299, 1,099
  const priceRegex = /(?:(only|just|price[:\s]*|mrp[:\s]*)?\s*(₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,5})|(only|just)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,5})|([0-9]{1,3},[0-9]{3}))(?![0-9%a-zA-Z])/gi;

  let match: RegExpExecArray | null;
  while ((match = priceRegex.exec(text)) !== null) {
    const rawMatch = match[0].trim();
    const index = match.index;

    // Check context after the number to avoid units like "30 ml", "50g", "48 hours", "30 women", "4 weeks"
    const afterMatch = text.slice(index + match[0].length, index + match[0].length + 15).toLowerCase();
    if (/^\s*(ml|g|kg|oz|%|hours|hrs|days|weeks|women|participants|subjects|trial)\b/.test(afterMatch)) {
      continue;
    }

    const value = normalizePriceValue(rawMatch);
    if (!value) continue;

    // Reject year numbers unless explicitly preceded by currency
    const isYearNumber = value >= 2020 && value <= 2035;
    const hasExplicitCurrency = /₹|rs|inr/i.test(rawMatch);
    if (isYearNumber && !hasExplicitCurrency) {
      continue;
    }

    if (!seenIndices.has(index)) {
      seenIndices.add(index);
      results.push({
        rawText: rawMatch,
        value,
        index
      });
    }
  }

  // Fallback: If no explicit currency pattern matched, look for standalone 3-4 digit numbers adjacent to product terms
  if (results.length === 0) {
    const standaloneRegex = /\b([1-9][0-9]{2,3})\b/g;
    while ((match = standaloneRegex.exec(text)) !== null) {
      const numStr = match[1];
      const val = parseInt(numStr, 10);
      const idx = match.index;

      // Filter out years and common non-price quantities
      if (val >= 2020 && val <= 2035) continue;
      if ([30, 50, 100, 150, 200, 250, 500].includes(val)) {
        const after = text.slice(idx + numStr.length, idx + numStr.length + 10).toLowerCase();
        if (/^\s*(ml|g|kg|women|days|hrs|hours|%)\b/.test(after)) continue;
      }

      // Check if preceded by commercial words within 20 chars
      const before = text.slice(Math.max(0, idx - 20), idx).toLowerCase();
      if (/price|cost|special|offer|rate|save|only|just|for|at/i.test(before)) {
        results.push({
          rawText: numStr,
          value: val,
          index: idx
        });
        break;
      }
    }
  }

  return results;
}

export interface ProductMatchResult {
  product?: ProductFact;
  sku?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  isEstablished: boolean;
  matchReason: string;
  candidateProducts?: ProductFact[];
}

/**
 * Matches a creative draft or campaign asset to an approved catalog product.
 * Evaluates:
 * 1. Explicit SKU or Product ID (highest confidence).
 * 2. SKU codes found in creative text.
 * 3. Exact Product Name or Registered Aliases in text.
 * 4. Partial / ambiguous similarities (flags for human review).
 */
export function matchProductFromCreative(
  text: string,
  products: ProductFact[],
  options?: {
    explicitSku?: string;
    explicitProductId?: string;
    assetTitle?: string;
  }
): ProductMatchResult {
  if (!products || products.length === 0) {
    return {
      confidence: 'NONE',
      isEstablished: false,
      matchReason: 'Product catalog is empty.'
    };
  }

  const combinedText = `${options?.assetTitle || ''} ${text || ''}`.trim();
  const lowerText = combinedText.toLowerCase();

  // 1. Explicit SKU or Product ID passed via asset metadata
  if (options?.explicitSku) {
    const explicitSkuLower = options.explicitSku.trim().toLowerCase();
    const found = products.find(p => p.sku.toLowerCase() === explicitSkuLower);
    if (found) {
      return {
        product: found,
        sku: found.sku,
        confidence: 'HIGH',
        isEstablished: true,
        matchReason: `Explicit SKU identifier "${found.sku}" specified for asset.`
      };
    }
  }

  if (options?.explicitProductId) {
    const found = products.find(p => p.id === options.explicitProductId);
    if (found) {
      return {
        product: found,
        sku: found.sku,
        confidence: 'HIGH',
        isEstablished: true,
        matchReason: `Explicit product reference "${found.productName}" (${found.sku}) mapped.`
      };
    }
  }

  // 2. Direct SKU code in creative text (e.g. AUR-VTC-30, AUR-HM-50, AUR-SBC-150)
  for (const product of products) {
    const skuPattern = new RegExp(`(^|[^a-zA-Z0-9-])${product.sku}([^a-zA-Z0-9-]|$)`, 'i');
    if (skuPattern.test(combinedText)) {
      return {
        product,
        sku: product.sku,
        confidence: 'HIGH',
        isEstablished: true,
        matchReason: `SKU code "${product.sku}" detected directly in creative copy.`
      };
    }
  }

  // 3. Exact Product Name or Registered Alias Match
  for (const product of products) {
    // Check full product name
    const cleanProductName = product.productName.toLowerCase().replace(/^(aurelia\s+)/i, '').trim();
    if (lowerText.includes(product.productName.toLowerCase()) || lowerText.includes(cleanProductName)) {
      return {
        product,
        sku: product.sku,
        confidence: 'HIGH',
        isEstablished: true,
        matchReason: `Matched approved product name "${product.productName}" (${product.sku}).`
      };
    }

    // Check registered aliases
    const aliases = product.aliases || [];
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/^(aurelia\s+)/i, '').trim();
      if (lowerText.includes(alias.toLowerCase()) || (cleanAlias.length >= 6 && lowerText.includes(cleanAlias))) {
        return {
          product,
          sku: product.sku,
          confidence: 'HIGH',
          isEstablished: true,
          matchReason: `Matched registered catalog alias "${alias}" for SKU ${product.sku}.`
        };
      }
    }
  }

  // 4. Multi-token entity matching (e.g. "Vitamin C" + "Serum" + "30ml" or "Moisturizer" + "50g")
  const serumCandidate = products.find(p => p.sku === 'AUR-VTC-30' || p.category.toLowerCase().includes('serum'));
  const moisturizerCandidate = products.find(p => p.sku === 'AUR-HM-50' || p.category.toLowerCase().includes('moisturizer'));
  const cleanserCandidate = products.find(p => p.sku === 'AUR-SBC-150' || p.category.toLowerCase().includes('cleanser'));

  const hasVitaminC = /\bvitamin\s*c\b/i.test(combinedText);
  const hasSerum = /\bserum\b/i.test(combinedText);
  const hasMoisturizer = /\bmoisturizer|cream|hydrating\b/i.test(combinedText);
  const hasCleanser = /\bcleanser|wash|barrier cleanser\b/i.test(combinedText);

  // High confidence if both distinctive tokens present (e.g. "Vitamin C" AND "Serum")
  if (hasVitaminC && hasSerum && serumCandidate) {
    return {
      product: serumCandidate,
      sku: serumCandidate.sku,
      confidence: 'HIGH',
      isEstablished: true,
      matchReason: `Distinctive product tokens ("Vitamin C" + "Serum") match SKU ${serumCandidate.sku}.`
    };
  }

  if (hasMoisturizer && !hasVitaminC && moisturizerCandidate) {
    return {
      product: moisturizerCandidate,
      sku: moisturizerCandidate.sku,
      confidence: 'HIGH',
      isEstablished: true,
      matchReason: `Distinctive product category ("Moisturizer") matches SKU ${moisturizerCandidate.sku}.`
    };
  }

  if (hasCleanser && cleanserCandidate) {
    return {
      product: cleanserCandidate,
      sku: cleanserCandidate.sku,
      confidence: 'HIGH',
      isEstablished: true,
      matchReason: `Distinctive product category ("Cleanser") matches SKU ${cleanserCandidate.sku}.`
    };
  }

  // 5. Partial / Ambiguous token presence -> UNCERTAIN MATCH (Human Review Needed)
  if (hasVitaminC && !hasSerum && serumCandidate) {
    return {
      product: serumCandidate,
      sku: serumCandidate.sku,
      confidence: 'MEDIUM',
      isEstablished: false,
      matchReason: `Creative mentions "Vitamin C" but does not explicitly name serum or SKU ${serumCandidate.sku}. Identity is uncertain.`,
      candidateProducts: [serumCandidate]
    };
  }

  if (hasSerum && !hasVitaminC && serumCandidate) {
    return {
      product: serumCandidate,
      sku: serumCandidate.sku,
      confidence: 'LOW',
      isEstablished: false,
      matchReason: `Creative mentions generic term "Serum" without specific formulation. Identity is uncertain.`,
      candidateProducts: [serumCandidate]
    };
  }

  return {
    confidence: 'NONE',
    isEstablished: false,
    matchReason: 'No product identifiers or recognized catalog aliases were detected in creative copy.'
  };
}

/**
 * Calculates the overall approval status for an asset based on its findings:
 * - 'Blocked': An unresolved HIGH severity violation exists (e.g. confirmed price mismatch).
 * - 'Needs Review': Uncertain product match, unverified price, or pending warning exists.
 * - 'Approved': All checks passed, or all findings have been accepted by reviewer.
 */
export function calculateAssetAuditStatus(
  findings: AuditFinding[]
): 'Approved' | 'Needs Review' | 'Blocked' {
  const unresolved = findings.filter(f => f.decision !== 'ACCEPTED');
  if (unresolved.length === 0) {
    return 'Approved';
  }

  const hasBlocking = unresolved.some(f => f.severity === 'HIGH');
  if (hasBlocking) {
    return 'Blocked';
  }

  return 'Needs Review';
}
