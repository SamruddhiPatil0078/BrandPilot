/**
 * Campaign Launch Readiness Engine
 *
 * A pure, deterministic scoring module derived entirely from the output of
 * `auditCampaignConsistency()`. It never invents findings or hardcodes
 * campaign-specific scores.
 *
 * Scoring model:
 *   Category         Weight
 *   ─────────────────────────
 *   Price               25
 *   Discount/Promo      20
 *   Brand Compliance    20
 *   Legal/Disclaimer    20
 *   Date & CTA          15
 *   ─────────────────────────
 *   Total              100
 *
 * Severity deductions (fraction of that category's weight):
 *   HIGH   → 100 % of weight  (entire category zeroed once triggered)
 *   MEDIUM →  50 % of weight
 *   LOW    →  10 % of weight
 *
 * Each unique conflict (by id) is counted once — multiple assets involved
 * in the same conflict do not multiply the deduction.
 *
 * Each category score is clamped to [0, weight].
 *
 * Safety rule: any unresolved HIGH conflict prevents READY status.
 */

import { Campaign } from '../types/campaign';
import { BrandKnowledgeBase } from '../types/brand';
import { CampaignConflict, ConflictType } from '../types/campaign';
import {
  ReadinessCategory,
  LaunchStatus,
  CategoryScore,
  CategoryStatus,
  PriorityAction,
  ReadinessScore,
  SeverityBreakdown,
} from '../types/readiness';
import { auditCampaignConsistency } from './campaignEngine';

// ─── Category Weights ────────────────────────────────────────────────────────

const CATEGORY_WEIGHTS: Record<ReadinessCategory, number> = {
  'Price Consistency': 25,
  'Discount & Promo Code Consistency': 20,
  'Brand Compliance': 20,
  'Legal & Disclaimer Compliance': 20,
  'Campaign Date & CTA Consistency': 15,
};

// ─── Conflict → Category Mapping ─────────────────────────────────────────────

const CONFLICT_CATEGORY_MAP: Record<ConflictType, ReadinessCategory> = {
  'Price Discrepancy': 'Price Consistency',
  'Discount Percentage Mismatch': 'Discount & Promo Code Consistency',
  'Promo Code Inconsistency': 'Discount & Promo Code Consistency',
  'Commercial / Policy Violation': 'Brand Compliance',
  'Outdated Logo': 'Brand Compliance',
  'Tagline Inconsistency': 'Brand Compliance',
  'Tone Divergence': 'Brand Compliance',
  'Missing Disclaimer': 'Legal & Disclaimer Compliance',
  'Background Scene Warning': 'Legal & Disclaimer Compliance',
  'Date Expiry Conflict': 'Campaign Date & CTA Consistency',
  'CTA Divergence': 'Campaign Date & CTA Consistency',
};

// ─── Severity Deduction Fractions ─────────────────────────────────────────────

const SEVERITY_FRACTION: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = {
  HIGH: 1.0,   // 100% of category weight
  MEDIUM: 0.5, //  50% of category weight
  LOW: 0.1,    //  10% of category weight
};

// ─── Launch Status Thresholds ─────────────────────────────────────────────────

const THRESHOLD_READY = 90;
const THRESHOLD_NEEDS_REVIEW = 70;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyBreakdown(): SeverityBreakdown {
  return { HIGH: 0, MEDIUM: 0, LOW: 0 };
}

function determineLaunchStatus(
  score: number,
  hasCriticalViolation: boolean,
  hasInsufficientEvidence: boolean
): LaunchStatus {
  if (hasCriticalViolation) {
    // Critical override: a HIGH violation blocks READY regardless of score
    if (score >= THRESHOLD_READY) return 'NEEDS REVIEW';
    if (score >= THRESHOLD_NEEDS_REVIEW) return 'NEEDS REVIEW';
    return 'NOT READY';
  }
  if (hasInsufficientEvidence) {
    // Unknown evidence must not be treated as confirmed compliant
    return score >= THRESHOLD_READY ? 'NEEDS REVIEW' : score >= THRESHOLD_NEEDS_REVIEW ? 'NEEDS REVIEW' : 'NOT READY';
  }
  if (score >= THRESHOLD_READY) return 'READY';
  if (score >= THRESHOLD_NEEDS_REVIEW) return 'NEEDS REVIEW';
  return 'NOT READY';
}

function buildStatusReason(
  launchStatus: LaunchStatus,
  priorityActions: PriorityAction[],
  hasCriticalViolation: boolean,
  campaignName: string,
  unresolvedCount: number
): string {
  if (unresolvedCount === 0) {
    return `${campaignName} has no active conflicts detected. All audited assets are in sync with approved brand standards.`;
  }

  const topAction = priorityActions[0];
  if (!topAction) {
    return `${campaignName} requires review before launch.`;
  }

  if (launchStatus === 'READY') {
    return `${campaignName} meets all readiness thresholds. Minor ${topAction.severity.toLowerCase()}-severity findings exist in ${topAction.category} but do not block launch.`;
  }

  if (hasCriticalViolation && launchStatus === 'NEEDS REVIEW') {
    return `Your campaign needs review because an unresolved HIGH severity issue — "${topAction.title}" — prevents automatic readiness clearance even though the numerical score may appear high.`;
  }

  if (launchStatus === 'NEEDS REVIEW') {
    return `Your campaign needs review. The most important finding is "${topAction.title}" in ${topAction.category} (${topAction.severity} severity). Resolve this before launch.`;
  }

  // NOT READY
  return `Campaign is not ready to launch. ${unresolvedCount} active conflict${unresolvedCount > 1 ? 's' : ''} detected, including a critical issue: "${topAction.title}". This must be resolved before any channel goes live.`;
}

function buildCategoryExplanation(
  category: ReadinessCategory,
  score: number,
  weight: number,
  findingCount: number,
  sevBreakdown: SeverityBreakdown,
  status: CategoryStatus
): string {
  if (status === 'INSUFFICIENT_EVIDENCE') {
    return `No assets with ${category.toLowerCase()} data were available to evaluate. Manual review recommended before launch.`;
  }
  if (findingCount === 0) {
    return `All ${category.toLowerCase()} checks passed. No conflicts detected across campaign assets.`;
  }
  const parts: string[] = [];
  if (sevBreakdown.HIGH > 0) parts.push(`${sevBreakdown.HIGH} critical`);
  if (sevBreakdown.MEDIUM > 0) parts.push(`${sevBreakdown.MEDIUM} medium`);
  if (sevBreakdown.LOW > 0) parts.push(`${sevBreakdown.LOW} low`);
  const pct = Math.round((score / weight) * 100);
  return `${findingCount} conflict${findingCount > 1 ? 's' : ''} found (${parts.join(', ')}). Category health is ${pct}%. Resolve flagged issues to improve this score.`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Calculates the Campaign Launch Readiness Score from the latest audit results.
 *
 * This function calls auditCampaignConsistency() internally so the score is
 * always based on the current campaign state, not stale stored conflicts.
 *
 * @param campaign  The active Campaign object (with assets)
 * @param kb        The active Brand Knowledge Base
 * @returns         A fully hydrated ReadinessScore object
 */
export function calculateReadinessScore(
  campaign: Campaign,
  kb: BrandKnowledgeBase
): ReadinessScore {
  // Guard: empty campaign
  if (!campaign.assets || campaign.assets.length === 0) {
    const categories: ReadinessCategory[] = [
      'Price Consistency',
      'Discount & Promo Code Consistency',
      'Brand Compliance',
      'Legal & Disclaimer Compliance',
      'Campaign Date & CTA Consistency',
    ];

    const emptyCategoryScores: CategoryScore[] = categories.map(cat => ({
      category: cat,
      weight: CATEGORY_WEIGHTS[cat],
      score: CATEGORY_WEIGHTS[cat], // No evidence means no deduction — but status marked
      deductions: 0,
      findingCount: 0,
      sevBreakdown: emptyBreakdown(),
      explanation: 'No assets uploaded for this campaign. Add assets to enable readiness scoring.',
      conflictIds: [],
      status: 'INSUFFICIENT_EVIDENCE' as CategoryStatus,
    }));

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      overallScore: 0,
      launchStatus: 'NEEDS REVIEW',
      statusReason: 'No campaign assets have been uploaded. Add assets and run the Campaign Consistency audit to calculate readiness.',
      assetsAudited: 0,
      unresolvedCount: 0,
      resolvedCount: 0,
      hasCriticalViolation: false,
      categoryScores: emptyCategoryScores,
      priorityActions: [],
      calculatedAt: new Date().toISOString(),
    };
  }

  // Run the authoritative campaign audit to get latest conflicts
  const { conflicts: liveConflicts } = auditCampaignConsistency(campaign, kb);

  // Count resolved = conflicts stored in campaign.conflicts that no longer appear
  const liveConflictIds = new Set(liveConflicts.map(c => c.id));
  const storedConflicts = campaign.conflicts || [];
  const resolvedCount = storedConflicts.filter(c => !liveConflictIds.has(c.id)).length;

  // Deduplicate conflicts by id (defensive — engine should already deduplicate)
  const uniqueConflictsMap = new Map<string, CampaignConflict>();
  for (const conflict of liveConflicts) {
    if (!uniqueConflictsMap.has(conflict.id)) {
      uniqueConflictsMap.set(conflict.id, conflict);
    }
  }
  const uniqueConflicts = Array.from(uniqueConflictsMap.values());

  const hasCriticalViolation = uniqueConflicts.some(c => c.severity === 'HIGH');

  // ── Build per-category accumulators ──────────────────────────────────────

  type CategoryAccum = {
    conflictsById: Map<string, CampaignConflict>;
    sevBreakdown: SeverityBreakdown;
  };

  const categoryMap: Record<ReadinessCategory, CategoryAccum> = {
    'Price Consistency': { conflictsById: new Map(), sevBreakdown: emptyBreakdown() },
    'Discount & Promo Code Consistency': { conflictsById: new Map(), sevBreakdown: emptyBreakdown() },
    'Brand Compliance': { conflictsById: new Map(), sevBreakdown: emptyBreakdown() },
    'Legal & Disclaimer Compliance': { conflictsById: new Map(), sevBreakdown: emptyBreakdown() },
    'Campaign Date & CTA Consistency': { conflictsById: new Map(), sevBreakdown: emptyBreakdown() },
  };

  for (const conflict of uniqueConflicts) {
    const cat = CONFLICT_CATEGORY_MAP[conflict.type];
    if (!cat) continue; // unknown type — skip safely

    const accum = categoryMap[cat];
    if (!accum.conflictsById.has(conflict.id)) {
      accum.conflictsById.set(conflict.id, conflict);
      accum.sevBreakdown[conflict.severity]++;
    }
  }

  // ── Compute category scores ───────────────────────────────────────────────

  const categoryScores: CategoryScore[] = (
    Object.entries(categoryMap) as [ReadinessCategory, CategoryAccum][]
  ).map(([category, accum]) => {
    const weight = CATEGORY_WEIGHTS[category];
    const conflicts = Array.from(accum.conflictsById.values());
    const findingCount = conflicts.length;

    if (findingCount === 0) {
      return {
        category,
        weight,
        score: weight,
        deductions: 0,
        findingCount: 0,
        sevBreakdown: emptyBreakdown(),
        explanation: buildCategoryExplanation(category, weight, weight, 0, emptyBreakdown(), 'OK'),
        conflictIds: [],
        status: 'OK' as CategoryStatus,
      };
    }

    // Compute raw deductions (summed across all unique conflicts in this category)
    let rawDeductions = 0;
    for (const conflict of conflicts) {
      rawDeductions += SEVERITY_FRACTION[conflict.severity] * weight;
    }

    // Clamp: category score never goes below 0
    const clampedDeductions = Math.min(rawDeductions, weight);
    const score = Math.max(0, weight - clampedDeductions);

    const hasHigh = accum.sevBreakdown.HIGH > 0;
    const status: CategoryStatus = hasHigh ? 'CRITICAL' : 'ISSUE';

    return {
      category,
      weight,
      score,
      deductions: clampedDeductions,
      findingCount,
      sevBreakdown: { ...accum.sevBreakdown },
      explanation: buildCategoryExplanation(category, score, weight, findingCount, accum.sevBreakdown, status),
      conflictIds: conflicts.map(c => c.id),
      status,
    };
  });

  // ── Overall score ─────────────────────────────────────────────────────────

  const overallScore = Math.max(
    0,
    Math.min(100, Math.round(categoryScores.reduce((sum, cs) => sum + cs.score, 0)))
  );

  // ── Priority actions (sorted HIGH → MEDIUM → LOW) ─────────────────────────

  const severityOrder: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  const priorityActions: PriorityAction[] = uniqueConflicts
    .slice()
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .map(conflict => ({
      conflictId: conflict.id,
      title: conflict.title,
      severity: conflict.severity,
      category: CONFLICT_CATEGORY_MAP[conflict.type] ?? 'Brand Compliance',
      assetCount: conflict.involvedAssets.length,
      primaryAssetId: conflict.involvedAssets[0]?.assetId,
    }));

  // ── Insufficient evidence check ───────────────────────────────────────────

  const hasInsufficientEvidence = categoryScores.some(
    cs => cs.status === 'INSUFFICIENT_EVIDENCE'
  );

  // ── Launch status ─────────────────────────────────────────────────────────

  const launchStatus: LaunchStatus = determineLaunchStatus(
    overallScore,
    hasCriticalViolation,
    hasInsufficientEvidence
  );

  // ── Status reason sentence ────────────────────────────────────────────────

  const statusReason = buildStatusReason(
    launchStatus,
    priorityActions,
    hasCriticalViolation,
    campaign.name,
    uniqueConflicts.length
  );

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    overallScore,
    launchStatus,
    statusReason,
    assetsAudited: campaign.assets.length,
    unresolvedCount: uniqueConflicts.length,
    resolvedCount,
    hasCriticalViolation,
    categoryScores,
    priorityActions,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Exported for use in unit tests to validate individual pieces of the
 * scoring logic without instantiating the full function.
 */
export {
  CATEGORY_WEIGHTS,
  CONFLICT_CATEGORY_MAP,
  SEVERITY_FRACTION,
  THRESHOLD_READY,
  THRESHOLD_NEEDS_REVIEW,
};
