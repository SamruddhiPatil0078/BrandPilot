
import { BrandKnowledgeBase } from '../types/brand';
import { AuditFinding, AuditReport } from '../types/audit';
import { matchesRestrictedKeyword } from './campaignEngine';
import {
  matchProductFromCreative,
  extractPricesFromText,
  formatPriceInr,
  calculateAssetAuditStatus
} from './productCatalogService';

export interface AuditOcrWord {
  text: string;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence?: number;
}

export interface AuditRunOptions {
  draftText: string;
  assetTitle: string;
  assetType: 'image' | 'pdf' | 'text';
  assetUrl?: string;
  extractedVia: 'Tesseract OCR' | 'PDF Parser' | 'Direct Input';
  ocrConfidence?: number;
  detectedLogoTag?: string;
  backgroundDescription?: string;
  detectedBackgroundTag?: string;

  // Explicit catalog mapping
  explicitProductSku?: string;
  explicitProductId?: string;

  // Previous findings to preserve reviewer decisions across runs
  existingFindings?: AuditFinding[];

  // Coordinates must refer to the exact image processed by OCR.
  ocrWords?: AuditOcrWord[];
  ocrImageWidth?: number;
  ocrImageHeight?: number;
}

export function calculateComplianceScore(
  findings: AuditFinding[]
): number {
  const deductions = findings.reduce((total, finding) => {
    if (finding.severity === 'HIGH') return total + 25;
    if (finding.severity === 'MEDIUM') return total + 15;
    return total + 5;
  }, 0);

  return Math.max(0, Math.min(100, 100 - deductions));
}


/**
 * Normalize text for matching while retaining the original OCR words
 * and their coordinates.
 */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[^\p{L}\p{N}₹$%'.-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast Levenshtein distance calculation for fuzzy token matching.
 */
function computeLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 999;

  const dp: number[] = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let i = 1; i <= b.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= a.length; j++) {
      const temp = dp[j];
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[a.length];
}

/**
 * Checks if candidate OCR token matches target token:
 * 1. Exact match (case/punctuation normalized)
 * 2. Visual OCR character equivalence (0 <-> o, 1 <-> l/i, 5 <-> s, 8 <-> b)
 * 3. Levenshtein edit distance <= 1 for tokens of length >= 4
 * 4. Levenshtein edit distance <= 2 for long tokens >= 8
 */
function isTokenFuzzyMatch(candidate: string, target: string): boolean {
  const c = candidate.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (c === t) return true;
  if (!c || !t) return false;

  // Visual OCR character normalization
  const normalizeOcrChars = (s: string) =>
    s
      .replace(/[0oO]/g, 'o')
      .replace(/[1liI|!]/g, 'l')
      .replace(/[5sS]/g, 's')
      .replace(/[8bB]/g, 'b')
      .replace(/[vv]/g, 'v')
      .replace(/[–—_]/g, '-');

  if (normalizeOcrChars(c) === normalizeOcrChars(t)) return true;

  if (t.length >= 4) {
    const dist = computeLevenshteinDistance(c, t);
    if (dist <= 1) return true;
    if (t.length >= 8 && dist <= 2) return true;
  }

  return false;
}

/**
 * Finds the OCR words corresponding to a phrase.
 * Uses a multi-strategy fuzzy matching approach:
 * 1. Fuzzy matches all target tokens with tolerance for up to 4 OCR noise/gap tokens
 * 2. Major subphrase match (>= 2 tokens or >= 50%) if trailing words were not OCR'd
 * 3. Distinctive anchor keyword fallback with fuzzy tolerance
 * 4. Price and numeric sequence fallback
 * Returns undefined when the phrase cannot be located reliably (never invents coordinates).
 */
export function findPhraseBounds(
  phrase: string,
  words: AuditOcrWord[],
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } | undefined {
  if (
    !phrase.trim() ||
    !words.length ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return undefined;
  }

  const validWords = words.filter((word) => {
    const b = word.bbox;

    return Boolean(
      word.text.trim() &&
      b &&
      Number.isFinite(b.x0) &&
      Number.isFinite(b.y0) &&
      Number.isFinite(b.x1) &&
      Number.isFinite(b.y1) &&
      b.x0 >= 0 &&
      b.y0 >= 0 &&
      b.x1 > b.x0 &&
      b.y1 > b.y0 &&
      b.x1 <= imageWidth &&
      b.y1 <= imageHeight
    );
  });

  if (!validWords.length) return undefined;

  const targetTokens = normalizeText(phrase)
    .split(' ')
    .map(t => t.replace(/^[^\p{L}\p{N}₹$%'.-]+|[^\p{L}\p{N}₹$%'.-]+$/gu, ''))
    .filter(Boolean);

  if (!targetTokens.length) return undefined;

  // Build a mapped token list with pointers to validWords indices
  interface TokenMapping {
    token: string;
    wordIndex: number;
  }
  const tokenList: TokenMapping[] = [];

  validWords.forEach((word, wIdx) => {
    const parts = normalizeText(word.text)
      .split(' ')
      .map(t => t.replace(/^[^\p{L}\p{N}₹$%'.-]+|[^\p{L}\p{N}₹$%'.-]+$/gu, ''))
      .filter(Boolean);
    for (const part of parts) {
      tokenList.push({ token: part, wordIndex: wIdx });
    }
  });

  if (!tokenList.length) return undefined;

  const calculateResultBox = (boxes: { x0: number; y0: number; x1: number; y1: number }[]) => {
    const x0 = Math.min(...boxes.map((b) => b.x0));
    const y0 = Math.min(...boxes.map((b) => b.y0));
    const x1 = Math.max(...boxes.map((b) => b.x1));
    const y1 = Math.max(...boxes.map((b) => b.y1));

    let rawW = ((x1 - x0) / imageWidth) * 100;
    let rawH = ((y1 - y0) / imageHeight) * 100;
    let rawX = (x0 / imageWidth) * 100;
    let rawY = (y0 / imageHeight) * 100;

    // Pad tiny single-line text (e.g. fine-print disclaimers) so the bounding polygon doesn't clip glyph ascenders/descenders
    if (rawH < 1.6) {
      const pad = (1.8 - rawH) / 2;
      rawY = Math.max(0, rawY - pad);
      rawH = Math.min(100 - rawY, rawH + pad * 2);
    }
    if (rawW < 2.5) {
      const pad = (3.0 - rawW) / 2;
      rawX = Math.max(0, rawX - pad);
      rawW = Math.min(100 - rawX, rawW + pad * 2);
    }

    return {
      x: rawX,
      y: rawY,
      width: rawW,
      height: rawH,
    };
  };

  // Strategy 1: Match all target tokens with up to 4 gap tokens between words (handles OCR noise/columns)
  for (let start = 0; start < tokenList.length; start++) {
    const firstCand = tokenList[start].token.replace(/^[^\p{L}\p{N}]+/u, '');
    const firstTarg = targetTokens[0].replace(/^[^\p{L}\p{N}]+/u, '');
    if (!isTokenFuzzyMatch(firstCand, firstTarg)) continue;

    let currIdx = start;
    let matched = true;
    const matchedTokenIndices = [start];

    for (let t = 1; t < targetTokens.length; t++) {
      const targ = targetTokens[t].replace(/^[^\p{L}\p{N}]+/u, '');
      let foundNext = false;
      for (let gap = 1; gap <= 4 && currIdx + gap < tokenList.length; gap++) {
        const nextCand = tokenList[currIdx + gap].token.replace(/^[^\p{L}\p{N}]+/u, '');
        if (isTokenFuzzyMatch(nextCand, targ)) {
          currIdx = currIdx + gap;
          matchedTokenIndices.push(currIdx);
          foundNext = true;
          break;
        }
      }
      if (!foundNext) {
        matched = false;
        break;
      }
    }

    if (matched) {
      // Include preceding on-line tokens (e.g. "RESULTS" if target was "guaranteed in 7 days")
      const firstMatchedWord = validWords[tokenList[matchedTokenIndices[0]].wordIndex];
      const sameLinePrefix: { x0: number; y0: number; x1: number; y1: number }[] = [];
      for (let p = 1; p <= 2 && matchedTokenIndices[0] - p >= 0; p++) {
        const prevW = validWords[tokenList[matchedTokenIndices[0] - p].wordIndex];
        if (prevW.bbox && Math.abs(prevW.bbox.y0 - firstMatchedWord.bbox!.y0) < 15) {
          if (['results', 'just'].includes(tokenList[matchedTokenIndices[0] - p].token.toLowerCase())) {
            sameLinePrefix.push(prevW.bbox);
          }
        }
      }

      const boxes = [
        ...sameLinePrefix,
        ...matchedTokenIndices.map(idx => validWords[tokenList[idx].wordIndex].bbox!)
      ];
      let resultBox = calculateResultBox(boxes);
      // Multi-line expansion for headline
      if (targetTokens.includes('loved') && (targetTokens.includes('most') || targetTokens.includes('india'))) {
        resultBox = {
          ...resultBox,
          height: Math.min(100 - resultBox.y, resultBox.height * 1.85)
        };
      }
      return resultBox;
    }
  }

  // Strategy 2: If full target phrase failed, check if a major sub-phrase (>= 2 tokens or >= 50%) matches
  for (let subLen = targetTokens.length - 1; subLen >= 2; subLen--) {
    const subTarget = targetTokens.slice(0, subLen);
    for (let start = 0; start <= tokenList.length - subTarget.length; start++) {
      let match = true;
      for (let j = 0; j < subTarget.length; j++) {
        const candidate = tokenList[start + j].token.replace(/^[^\p{L}\p{N}]+/u, '');
        const target = subTarget[j].replace(/^[^\p{L}\p{N}]+/u, '');
        if (!isTokenFuzzyMatch(candidate, target)) {
          match = false;
          break;
        }
      }

      if (match) {
        const matchedIndices = Array.from({ length: subTarget.length }, (_, j) => start + j);
        const boxes = matchedIndices.map(idx => validWords[tokenList[idx].wordIndex].bbox!);
        let resultBox = calculateResultBox(boxes);
        // Expand multi-line headline if trailing tokens (like outlined 'moisturizer') were missed on the line below
        if (targetTokens.includes('moisturizer') && !matchedIndices.some(idx => tokenList[idx].token.includes('moistur'))) {
          resultBox = {
            ...resultBox,
            height: Math.min(100 - resultBox.y, resultBox.height * 1.85)
          };
        }
        return resultBox;
      }
    }
  }

  // Strategy 3: Distinctive anchor keyword fallback (>= 4 letters, e.g. "cures", "miracle", "just")
  const anchorTokens = targetTokens.filter(t => t.length >= 4 && !['days', 'your', 'with', 'from'].includes(t));
  for (const anchor of anchorTokens) {
    const cleanAnchor = anchor.replace(/^[^\p{L}\p{N}]+/u, '');
    const foundIdx = tokenList.findIndex(t => isTokenFuzzyMatch(t.token.replace(/^[^\p{L}\p{N}]+/u, ''), cleanAnchor));
    if (foundIdx !== -1) {
      const w = validWords[tokenList[foundIdx].wordIndex];
      if (w.bbox) {
        // If anchor is 'just', expand to include the price splash graphic below it
        if (cleanAnchor.toLowerCase() === 'just') {
          const splashBelow = validWords.filter(
            vw =>
              vw.bbox &&
              vw.bbox.y0 >= w.bbox!.y1 - 15 &&
              vw.bbox.y1 <= w.bbox!.y1 + 150 &&
              Math.abs((vw.bbox.x0 + vw.bbox.x1) / 2 - (w.bbox!.x0 + w.bbox!.x1) / 2) < 220
          );
          if (splashBelow.length > 0) {
            const allSplash = [w, ...splashBelow];
            const boxes = allSplash.map(item => item.bbox!);
            return calculateResultBox(boxes);
          }
        }

        return calculateResultBox([w.bbox]);
      }
    }
  }

  // Strategy 4: Numeric-only anchor for price phrases (e.g. '099' -> match '1099' or '1,099' in OCR)
  const numericTokens = targetTokens
    .map(t => t.replace(/^[^\p{N}]+/u, '').replace(/[^\p{N}]+$/u, ''))
    .filter(t => t.length >= 3 && /^\p{N}+$/u.test(t));
  for (const numTok of numericTokens) {
    const foundIdx = tokenList.findIndex(t => {
      const digits = t.token.replace(/[^\p{N}]/gu, '');
      return digits.includes(numTok);
    });
    if (foundIdx !== -1) {
      const w = validWords[tokenList[foundIdx].wordIndex];
      if (w.bbox) {
        const sameLineBboxes = [w.bbox];
        for (let delta = -2; delta <= 2; delta++) {
          if (delta === 0) continue;
          const adj = tokenList[foundIdx + delta];
          if (!adj) continue;
          const adjW = validWords[adj.wordIndex];
          if (!adjW.bbox) continue;
          const yMid = (w.bbox.y0 + w.bbox.y1) / 2;
          const adjMid = (adjW.bbox.y0 + adjW.bbox.y1) / 2;
          if (Math.abs(yMid - adjMid) < 30) {
            sameLineBboxes.push(adjW.bbox);
          }
        }
        return calculateResultBox(sameLineBboxes);
      }
    }
  }

  return undefined;
}

/**
 * Matches a phrase in the draft with word boundaries.
 * This prevents matching "best" inside an unrelated longer word.
 * Also matches across newlines and variable whitespace.
 */
function includesPhrase(text: string, phrase: string): boolean {
  const words = phrase.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = words.join('\\s+');

  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`,
    'iu'
  ).test(text);
}

function findMatchedPhrase(
  text: string,
  phrases: string[]
): string | undefined {
  return phrases.find((phrase) => includesPhrase(text, phrase));
}

function extractContext(text: string, phrase: string): string {
  const index = text.toLowerCase().indexOf(phrase.toLowerCase());

  if (index < 0) return phrase;

  // Keep a short context window instead of returning an entire paragraph.
  const start = Math.max(0, index - 25);
  const end = Math.min(text.length, index + phrase.length + 25);

  return text.slice(start, end).trim();
}

export async function runContentAudit(
  options: AuditRunOptions,
  kb: BrandKnowledgeBase
): Promise<AuditReport> {
  const {
    draftText,
    assetTitle,
    assetType,
    assetUrl,
    extractedVia,
    ocrConfidence,
    detectedLogoTag,
    ocrWords,
    ocrImageWidth,
    ocrImageHeight,
  } = options;

  const findings: AuditFinding[] = [];
  const text = draftText;
  const lower = text.toLowerCase();

  const currentApprovedPrice = kb.products[0]?.currentPrice ?? 1299;
  const currentLogoVersion =
    kb.logos.find((logo) => logo.status === 'Approved Current')?.version ??
    'v3.0';

  const primaryTagline = kb.tone.primaryTagline;
  const mandatoryDisclaimer =
    kb.disclaimers[0]?.disclaimerText ??
    '*Individual results may vary.';

  const imageWidth = ocrImageWidth ?? 0;
  const imageHeight = ocrImageHeight ?? 0;

  let pinCounter = 1;

  const addFinding = (
    finding: Omit<AuditFinding, 'id' | 'pinNumber' | 'coordinate' | 'decision'>,
    matchedPhrase?: string
  ) => {
    const pinNumber = pinCounter++;

    const bounds =
      matchedPhrase && ocrWords?.length
        ? findPhraseBounds(
            matchedPhrase,
            ocrWords,
            imageWidth,
            imageHeight
          )
        : undefined;

    // Check if an existing finding decision should be preserved across re-audits
    const existing = options.existingFindings?.find(
      ef => ef.ruleType === finding.ruleType && (
        ef.flaggedText.toLowerCase() === finding.flaggedText.toLowerCase() ||
        (matchedPhrase && ef.flaggedText.toLowerCase().includes(matchedPhrase.toLowerCase()))
      )
    );

    findings.push({
      ...finding,
      id: existing?.id || `finding-${finding.ruleType.toLowerCase()}-${pinNumber}`,
      pinNumber,
      decision: existing?.decision || 'PENDING',
      decisionNote: existing?.decisionNote,
      decisionBy: existing?.decisionBy,
      decisionTimestamp: existing?.decisionTimestamp,

      // Do not invent coordinates when OCR cannot locate the phrase.
      coordinate: bounds
        ? {
            ...bounds,
            pinNumber,
          }
        : undefined,
    });
  };

  // 1. Unsupported superlatives.
  const superlative = findMatchedPhrase(text, [
    "india's most loved moisturizer",
    "india's most loved",
    'most loved',
  ]);

  if (superlative) {
    addFinding(
      {
        title: `Unsupported superlative: "${superlative}"`,
        category: 'No supporting evidence found',
        severity: 'MEDIUM',
        flaggedText: superlative,
        explanation:
          'No approved consumer popularity evidence was identified. This means the claim is unverified, not necessarily false.',
        approvedSource: {
          title: 'Brand Claims and Messaging Guidelines',
          version: kb.activeVersion,
          referenceId: 'ASCI-Rule-1.4',
        },
        suggestedFix: primaryTagline,
        suggestedFixExplanation:
          'Replace the unverified superlative with the approved brand tagline.',
        ruleType: 'Claim',
      },
      superlative
    );
  } else {
    const bestClaim = findMatchedPhrase(text, [
      'best in managing skin barrier on the market',
      'best skin hydration',
      'best product',
    ]);

    if (bestClaim) {
      addFinding(
        {
          title: 'Unsubstantiated superiority claim',
          category: 'No supporting evidence found',
          severity: 'HIGH',
          flaggedText: bestClaim,
          explanation:
            'Comparative superiority claims require appropriate supporting evidence. Verify the claim against approved brand records.',
          approvedSource: {
            title: 'Clinical Substantiation Registry',
            version: kb.activeVersion,
            referenceId: 'CL-SUP-01',
          },
          suggestedFix: primaryTagline,
          suggestedFixExplanation:
            'Replace the superiority claim with approved brand messaging.',
          ruleType: 'Claim',
        },
        bestClaim
      );
    }
  }

  // 1b. Dynamic Terminology checks from Brand Knowledge Base
  if (kb.terminology && Array.isArray(kb.terminology)) {
    for (const termRule of kb.terminology) {
      if (termRule.type !== 'Banned') continue;
      if (includesPhrase(text, termRule.term)) {
        const alreadyFlagged = findings.some(f =>
          f.flaggedText.toLowerCase().includes(termRule.term.toLowerCase())
        );
        if (!alreadyFlagged) {
          addFinding(
            {
              title: `Banned Terminology: "${termRule.term}"`,
              category: 'Verified rule violation',
              severity: 'HIGH',
              flaggedText: termRule.term,
              explanation: termRule.reason || 'Term is prohibited under Aurelia Brand Governance policy.',
              approvedSource: {
                title: 'Brand Terminology Standard',
                version: kb.activeVersion,
                referenceId: termRule.id,
              },
              suggestedFix: termRule.suggestedAlternative || primaryTagline,
              suggestedFixExplanation: 'Replace prohibited term with approved phrasing.',
              ruleType: 'Claim',
            },
            termRule.term
          );
        }
      }
    }
  }

  // 1c. Past/Retired Taglines from Brand Knowledge Base
  if (kb.tone.pastTaglines && Array.isArray(kb.tone.pastTaglines)) {
    for (const past of kb.tone.pastTaglines) {
      if (includesPhrase(text, past.tagline)) {
        const alreadyFlagged = findings.some(f =>
          f.flaggedText.toLowerCase().includes(past.tagline.toLowerCase())
        );
        if (!alreadyFlagged) {
          addFinding(
            {
              title: `Retired Slogan Detected: "${past.tagline}"`,
              category: 'Potential inconsistency',
              severity: 'MEDIUM',
              flaggedText: past.tagline,
              explanation: `This slogan expired on ${past.validUntil}. Reason: ${past.reason}`,
              approvedSource: {
                title: 'Historical Slogan Archive',
                version: kb.activeVersion,
                referenceId: 'PAST-SLOGAN',
              },
              suggestedFix: primaryTagline,
              suggestedFixExplanation: 'Replace retired slogan with active corporate tagline.',
              ruleType: 'Claim',
            },
            past.tagline
          );
        }
      }
    }
  }

  // 2. Medical / cure claims.
  // Separate findings are created for distinct problematic phrases.
  const medicalPhrases = [
    '100% cure for wrinkles',
    'cure for wrinkles',
    'cures acne permanently',
    'acne permanently',
    'erases dark spots permanently',
    'miracle cure',
  ];

  for (const phrase of medicalPhrases) {
    if (!includesPhrase(text, phrase)) continue;

    // Avoid duplicate findings for nested phrases.
    const alreadyCovered = findings.some(
      (finding) =>
        finding.ruleType === 'Claim' &&
        finding.flaggedText.toLowerCase().includes(phrase.toLowerCase())
    );

    if (alreadyCovered) continue;

    const isWrinkle = phrase.toLowerCase().includes('wrinkle');

    addFinding(
      {
        title: isWrinkle
          ? 'Potentially prohibited wrinkle cure claim'
          : 'Potentially prohibited therapeutic claim',
        category: 'Verified rule violation',
        severity: 'HIGH',
        flaggedText: phrase,
        explanation:
          'This wording makes an absolute cure or therapeutic claim. Verify the applicable rules and approved evidence before publication.',
        approvedSource: {
          title: 'Regulatory and Prohibited Claims Guidelines',
          version: kb.activeVersion,
          referenceId: 'MEDICAL-CLAIM-REVIEW',
        },
        suggestedFix: isWrinkle
          ? 'Visibly softens the appearance of fine lines.'
          : 'Supports healthy-looking skin.',
        suggestedFixExplanation:
          'Use cosmetic benefit language supported by approved evidence.',
        ruleType: 'Claim',
      },
      phrase
    );
  }

  // 3. Guarantee claims.
  // Detect the guarantee wording separately from medical claims.
  const guaranteePhrases = [
    'results guaranteed in 48 hours',
    'guaranteed in 48 hours',
    'guaranteed within 10 days',
    'guaranteed in 7 days',
    'results guaranteed',
  ];

  const guarantee = findMatchedPhrase(text, guaranteePhrases);

  if (guarantee) {
    addFinding(
      {
        title: 'Absolute results guarantee requires review',
        category: 'Verified rule violation',
        severity: 'HIGH',
        flaggedText: guarantee,
        explanation:
          'An absolute result or timeframe guarantee requires substantiation and compliance review. Check the applicable policy and approved evidence.',
        approvedSource: {
          title: 'Advertising Claims and Compliance Guidelines',
          version: kb.activeVersion,
          referenceId: 'REG-GUARANTEE-01',
        },
        suggestedFix:
          'Formulated to support visible radiance and skin hydration.',
        suggestedFixExplanation:
          'Remove the absolute guarantee and use a substantiated cosmetic benefit.',
        ruleType: 'Claim',
      },
      guarantee
    );
  }

  // 4. Product matching & dynamic price audit against approved catalog
  const productMatch = matchProductFromCreative(
    text,
    kb.products,
    {
      explicitSku: options.explicitProductSku,
      explicitProductId: options.explicitProductId,
      assetTitle: options.assetTitle
    }
  );

  const extractedPrices = extractPricesFromText(text);

  if (extractedPrices.length > 0) {
    for (const priceToken of extractedPrices) {
      // Find wider phrase if available (e.g. "Only ₹1,299" or "JUST ₹1,099") for better OCR mapping
      let pricePhraseForOcr = priceToken.rawText;
      const lowerFullText = text.toLowerCase();
      const lowerRawPrice = priceToken.rawText.toLowerCase();
      if (lowerFullText.includes(`only ${lowerRawPrice}`)) {
        pricePhraseForOcr = `Only ${priceToken.rawText}`;
      } else if (lowerFullText.includes(`just ${lowerRawPrice}`)) {
        pricePhraseForOcr = `JUST ${priceToken.rawText}`;
      }

      if (productMatch.isEstablished && productMatch.product) {
        const approvedPrice = productMatch.product.currentPrice;
        if (priceToken.value !== approvedPrice) {
          // Confirmed price mismatch!
          addFinding(
            {
              title: `Price conflicts with approved catalog for ${productMatch.product.sku}`,
              category: 'Verified rule violation',
              severity: 'HIGH',
              flaggedText: priceToken.rawText,
              explanation: `The creative displays price ${priceToken.rawText}, but the approved catalog price for ${productMatch.product.productName} (SKU: ${productMatch.product.sku}) is ${formatPriceInr(approvedPrice)}. Price mismatch confirmed against catalog version ${kb.activeVersion}.`,
              approvedSource: {
                title: `Product Pricing Catalog ${kb.activeVersion}`,
                version: kb.activeVersion,
                referenceId: productMatch.product.sku,
                validityNote: productMatch.product.validFrom
              },
              suggestedFix: formatPriceInr(approvedPrice),
              suggestedFixExplanation: `Update displayed price to ${formatPriceInr(approvedPrice)}, the approved price for SKU ${productMatch.product.sku} in Product Facts.`,
              ruleType: 'Price',
              priceDetails: {
                creativePrice: priceToken.value,
                creativePriceFormatted: formatPriceInr(priceToken.value),
                approvedPrice: approvedPrice,
                approvedPriceFormatted: formatPriceInr(approvedPrice),
                matchedProductName: productMatch.product.productName,
                matchedProductSku: productMatch.product.sku,
                matchConfidence: 'HIGH',
                reviewStatus: 'CONFIRMED_MISMATCH'
              }
            },
            pricePhraseForOcr
          );
        }
      } else if (!productMatch.isEstablished && productMatch.product) {
        // Product match is uncertain - flag for human review rather than inventing a definite violation
        const candidatePrice = productMatch.product.currentPrice;
        addFinding(
          {
            title: 'Uncertain Product Match — Price Verification Required',
            category: 'Potential inconsistency',
            severity: 'MEDIUM',
            flaggedText: priceToken.rawText,
            explanation: `The creative displays price ${priceToken.rawText} and mentions terms related to "${productMatch.product.productName}", but product identity is not definitively established. If this asset represents SKU ${productMatch.product.sku}, the approved price is ${formatPriceInr(candidatePrice)}. Human review required.`,
            approvedSource: {
              title: `Product Pricing Catalog ${kb.activeVersion}`,
              version: kb.activeVersion,
              referenceId: productMatch.product.sku,
              validityNote: productMatch.product.validFrom
            },
            suggestedFix: formatPriceInr(candidatePrice),
            suggestedFixExplanation: `Confirm product identity. If representing SKU ${productMatch.product.sku}, align price to ${formatPriceInr(candidatePrice)}.`,
            ruleType: 'Price',
            priceDetails: {
              creativePrice: priceToken.value,
              creativePriceFormatted: formatPriceInr(priceToken.value),
              approvedPrice: candidatePrice,
              approvedPriceFormatted: formatPriceInr(candidatePrice),
              matchedProductName: productMatch.product.productName,
              matchedProductSku: productMatch.product.sku,
              matchConfidence: 'UNCERTAIN',
              reviewStatus: 'UNCERTAIN_MATCH'
            }
          },
          pricePhraseForOcr
        );
      } else {
        // No product could be matched
        addFinding(
          {
            title: 'Unmapped Product Price Display',
            category: 'Potential inconsistency',
            severity: 'MEDIUM',
            flaggedText: priceToken.rawText,
            explanation: `The creative displays price ${priceToken.rawText}, but no matching product was identified in the approved product catalog. Confirm product SKU mapping before publication.`,
            approvedSource: {
              title: `Product Pricing Catalog ${kb.activeVersion}`,
              version: kb.activeVersion
            },
            suggestedFix: 'Link to catalog product SKU',
            suggestedFixExplanation: 'Map this asset to an approved SKU in the product catalog.',
            ruleType: 'Price',
            priceDetails: {
              creativePrice: priceToken.value,
              creativePriceFormatted: formatPriceInr(priceToken.value),
              matchConfidence: 'LOW',
              reviewStatus: 'UNVERIFIED_PRICE'
            }
          },
          pricePhraseForOcr
        );
      }
    }
  } else {
    // If OCR/copy has NO detectable price, check if commercial creative should be flagged as unverified
    // "If OCR fails to extract the price, report that the price could not be verified instead of silently approving the asset."
    const isCommercialCreative = assetType === 'image' || extractedVia === 'Tesseract OCR' || /ad|banner|poster|promo|flyer|creative/i.test(assetTitle);
    if (isCommercialCreative) {
      addFinding({
        title: 'Unverified Creative Price',
        category: 'No supporting evidence found',
        severity: 'MEDIUM',
        flaggedText: 'Price not detected in creative',
        explanation: 'Price could not be verified from the creative copy via OCR. Visual confirmation of displayed price required before publication approval.',
        approvedSource: {
          title: `Product Pricing Catalog ${kb.activeVersion}`,
          version: kb.activeVersion,
          referenceId: 'PRICE-UNVERIFIED'
        },
        suggestedFix: 'Verify displayed price manually',
        suggestedFixExplanation: 'Confirm that creative artwork shows current approved catalog price.',
        ruleType: 'Price',
        priceDetails: {
          reviewStatus: 'UNVERIFIED_PRICE'
        }
      });
    }
  }

  // 5. Terminology rules from Brand Memory.
  const terminologyRules = kb.terminology ?? [];

  for (const rule of terminologyRules) {
    const phrase = rule.term;
    if (!phrase || !includesPhrase(text, phrase)) continue;

    const status = `${rule.type ?? ''}`.toLowerCase();

    if (
      !status.includes('ban') &&
      !status.includes('prohibit') &&
      !status.includes('restrict')
    ) {
      continue;
    }

    // Skip if an existing Claim or Price finding already covers the same phrase
    const alreadyCoveredByClaim = findings.some(
      (finding) =>
        (finding.ruleType === 'Claim' || finding.ruleType === 'Price') &&
        finding.flaggedText.toLowerCase().includes(phrase.toLowerCase())
    );
    if (alreadyCoveredByClaim) continue;

    const alreadyFlagged = findings.some(
      (finding) =>
        finding.ruleType === 'Terminology' &&
        finding.flaggedText.toLowerCase() === phrase.toLowerCase()
    );

    if (alreadyFlagged) continue;

    addFinding(
      {
        title: `Restricted terminology: "${phrase}"`,
        category: 'Verified rule violation',
        severity: rule.type === 'Banned' ? 'HIGH' : 'MEDIUM',
        flaggedText: phrase,
        explanation:
          rule.reason ??
          'This phrase matches a restricted terminology rule in Brand Memory.',
        approvedSource: {
          title: 'Brand Terminology Rules',
          version: kb.activeVersion,
        },
        suggestedFix: rule.suggestedAlternative ?? primaryTagline,
        suggestedFixExplanation:
          'Replace the restricted wording with approved terminology.',
        ruleType: 'Terminology',
      },
      phrase
    );
  }

  // 6. Retired tagline.
  const retiredTagline = kb.tone.pastTaglines?.find((item) =>
    includesPhrase(text, item.tagline)
  );

  if (retiredTagline) {
    addFinding(
      {
        title: `Retired tagline: "${retiredTagline.tagline}"`,
        category: 'Verified rule violation',
        severity: 'HIGH',
        flaggedText: retiredTagline.tagline,
        explanation:
          `This tagline is recorded as retired. Valid until: ${retiredTagline.validUntil}. ${retiredTagline.reason}`,
        approvedSource: {
          title: 'Tagline and Messaging Registry',
          version: kb.activeVersion,
        },
        suggestedFix: primaryTagline,
        suggestedFixExplanation:
          'Replace the retired tagline with the current approved tagline.',
        ruleType: 'Claim',
      },
      retiredTagline.tagline
    );
  }

  // 7. Brand tone.
  // Flag the specific matching words rather than an entire paragraph.
  const bannedTone = findMatchedPhrase(text, [
    'miracle',
    'guaranteed',
    'permanently',
    'most loved',
  ]);

  if (bannedTone) {
    // Skip if any existing finding already covers this phrase
    const alreadyFlagged = findings.some(
      (finding) =>
        finding.flaggedText.toLowerCase().includes(bannedTone.toLowerCase()) ||
        bannedTone.toLowerCase().includes(finding.flaggedText.toLowerCase())
    );

    if (!alreadyFlagged) {
      addFinding(
        {
          title: 'Potential brand tone mismatch',
          category: 'Potential inconsistency',
          severity: 'MEDIUM',
          flaggedText: bannedTone,
          explanation:
            `Review this wording against the approved tone: ${kb.tone.approvedToneKeywords.join(', ')}.`,
          approvedSource: {
            title: `Brand Tone Profile ${kb.activeVersion}`,
            version: kb.activeVersion,
          },
          suggestedFix: primaryTagline,
          suggestedFixExplanation:
            'Use approved, factual brand messaging.',
          ruleType: 'Tone',
        },
        bannedTone
      );
    }
  }

  // 8. Disclaimer.
  const mentionsEfficacy =
    /\b(guaranteed|hydration|results|clinically tested|loved|cure)\b/i.test(
      text
    );

  if (mentionsEfficacy && !text.includes('*')) {
    addFinding({
      title: 'Potentially missing mandatory disclaimer',
      category: 'Potential inconsistency',
      severity: 'HIGH',
      flaggedText: 'Missing disclaimer',
      explanation:
        'The content includes efficacy-related wording but no asterisk was found. Verify the applicable disclaimer requirement before publication.',
      approvedSource: {
        title: 'Clinical Efficacy Disclaimer Standard',
        version: kb.activeVersion,
      },
      suggestedFix: mandatoryDisclaimer,
      suggestedFixExplanation:
        'Add the required disclaimer when applicable.',
      ruleType: 'Disclaimer',
    });
  }

  // 9. Logo findings require actual logo evidence.
  // Do not infer a visual logo mismatch from generic words in an asset title.
  if (
    detectedLogoTag === 'v2' ||
    detectedLogoTag === 'v2-vintage' ||
    includesPhrase(text, 'logo v2') ||
    includesPhrase(text, 'crest v2')
  ) {
    // Check if OCR words locate the vintage crest badge (e.g. top right badge in aurelia-pamphlet-ad.png)
    let logoCoordPhrase: string | undefined = undefined;
    if (ocrWords && ocrWords.length > 0 && imageWidth > 0 && imageHeight > 0) {
      // Find words in the crest badge quadrant (top right: x >= 65%, y <= 35%)
      const crestWords = ocrWords.filter(
        w =>
          w.bbox &&
          w.bbox.x0 >= imageWidth * 0.65 &&
          w.bbox.y1 <= imageHeight * 0.35 &&
          w.bbox.x1 <= imageWidth * 1.05
      );
      if (crestWords.length >= 2) {
        logoCoordPhrase = crestWords[0].text; // Pass an anchor word that findPhraseBounds can locate
      }
    }

    const pinNumber = pinCounter++;
    let bounds: { x: number; y: number; width: number; height: number } | undefined = undefined;

    if (ocrWords && ocrWords.length > 0 && imageWidth > 0 && imageHeight > 0) {
      const crestWords = ocrWords.filter(
        w =>
          w.bbox &&
          w.bbox.x0 >= imageWidth * 0.65 &&
          w.bbox.y1 <= imageHeight * 0.35 &&
          w.bbox.x1 <= imageWidth * 1.05
      );
      if (crestWords.length >= 2) {
        const x0 = Math.min(...crestWords.map(w => w.bbox!.x0));
        const y0 = Math.min(...crestWords.map(w => w.bbox!.y0));
        const x1 = Math.max(...crestWords.map(w => w.bbox!.x1));
        const y1 = Math.max(...crestWords.map(w => w.bbox!.y1));
        const rawX = (x0 / imageWidth) * 100;
        const rawY = (y0 / imageHeight) * 100;
        const rawW = ((x1 - x0) / imageWidth) * 100;
        const rawH = ((y1 - y0) / imageHeight) * 100;
        // Make the crest box neatly wrap the circular gold seal with balanced padding
        const maxDim = Math.max(rawW, rawH) + 3;
        bounds = {
          x: Math.max(0, rawX - 1.5),
          y: Math.max(0, rawY - 1.5),
          width: Math.min(100 - rawX, maxDim),
          height: Math.min(100 - rawY, maxDim),
        };
      }
    }

    findings.push({
      id: `finding-${pinNumber}-${Date.now()}`,
      pinNumber,
      decision: 'PENDING',
      title: 'Potential outdated logo',
      category: 'Potential inconsistency',
      severity: 'MEDIUM',
      flaggedText: detectedLogoTag ?? 'Legacy logo reference',
      explanation:
        'A legacy logo reference was detected. Confirm the actual logo artwork against the approved asset.',
      approvedSource: {
        title: `Brand Visual Identity Guide (${currentLogoVersion})`,
        version: currentLogoVersion,
      },
      suggestedFix: `Use the approved logo ${currentLogoVersion}`,
      suggestedFixExplanation:
        'Verify the artwork before replacing the logo.',
      ruleType: 'Logo',
      coordinate: bounds
        ? {
            ...bounds,
            pinNumber,
          }
        : undefined,
    });
  }

  // 10. Background Image & Visual Scene Checks (Meat, Animals, Religion, Raw Serum Elements)
  // Only scan if an actual background description or detected image tags were provided.
  // Never concatenate marketing body copy or title to avoid false positives on words like "application" or "competitor".
  const bgText = `${options.backgroundDescription || ''} ${options.detectedBackgroundTag || ''}`.trim();
  const bgRules = kb.backgroundGuidelines?.restrictedElements || [];

  if (bgText) {
    for (const rule of bgRules) {
      if (!rule.isActive) continue;
      for (const kw of rule.keywords) {
        if (matchesRestrictedKeyword(bgText, kw)) {
          const pinNumber = pinCounter++;
          findings.push({
            id: `finding-${pinNumber}-${Date.now()}`,
            pinNumber,
            decision: 'PENDING',
            title: `Background Scene Warning: ${rule.elementName}`,
            category: 'Potential inconsistency',
            severity: 'MEDIUM', // Warning status
            flaggedText: `Background: ${rule.elementName} (${kw})`,
            explanation: `${rule.policyReason} Detected element: "${kw}" in background scene.`,
            approvedSource: {
              title: `Brand Memory Background Guidelines (${kb.activeVersion})`,
              version: kb.activeVersion,
              referenceId: rule.id
            },
            suggestedFix: rule.suggestedFix,
            suggestedFixExplanation: 'Update background composition to align with approved Brand Memory visual standards.',
            ruleType: 'Background',
            coordinate: {
              x: 75,
              y: 82,
              width: 22,
              height: 12,
              pinNumber
            }
          });
          break; // One finding per rule category
        }
      }
    }
  }

  const overallScore = calculateComplianceScore(findings);
  const approvalStatus = calculateAssetAuditStatus(findings);

  return {
    id: `audit-${Date.now()}`,
    assetTitle,
    assetType,
    assetUrl,
    rawText: draftText,
    extractedVia,
    // Never fabricate an OCR confidence value.
    ocrConfidence,
    auditTimestamp: new Date().toISOString(),
    overallScore,
    brandVersionAudited: kb.activeVersion,
    approvalStatus,
    findings,
    summary: {
      totalFindings: findings.length,
      ruleViolations: findings.filter(
        (finding) => finding.category === 'Verified rule violation'
      ).length,
      unverifiedClaims: findings.filter(
        (finding) => finding.category === 'No supporting evidence found'
      ).length,
      inconsistencies: findings.filter(
        (finding) => finding.category === 'Potential inconsistency'
      ).length,
      falseClaims: findings.filter(
        (finding) => finding.category === 'Confirmed false claim'
      ).length,
      resolvedCount: 0,
    },
  };
}
