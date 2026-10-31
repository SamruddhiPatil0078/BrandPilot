/**
 * Campaign Launch Readiness Score — Type Definitions
 *
 * These types describe the output of the readiness scoring engine.
 * They are derived from existing CampaignConflict data and never introduce
 * new data sources or fabricated values.
 */

export type ReadinessCategory =
  | 'Price Consistency'
  | 'Discount & Promo Code Consistency'
  | 'Brand Compliance'
  | 'Legal & Disclaimer Compliance'
  | 'Campaign Date & CTA Consistency';

export type LaunchStatus = 'READY' | 'NEEDS REVIEW' | 'NOT READY';

export type CategoryStatus = 'OK' | 'ISSUE' | 'CRITICAL' | 'INSUFFICIENT_EVIDENCE';

export interface SeverityBreakdown {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

export interface CategoryScore {
  /** Display name of the scoring category */
  category: ReadinessCategory;
  /** Maximum points this category can contribute (sum of all = 100) */
  weight: number;
  /** Earned points after deductions; clamped to [0, weight] */
  score: number;
  /** Total raw deduction before clamping */
  deductions: number;
  /** Number of unique, unresolved CampaignConflicts in this category */
  findingCount: number;
  /** Breakdown of conflict severities in this category */
  sevBreakdown: SeverityBreakdown;
  /** Short human-readable explanation of the category result */
  explanation: string;
  /** IDs of CampaignConflicts that belong to this category (deduplicated) */
  conflictIds: string[];
  /** Rolled-up health status for display */
  status: CategoryStatus;
}

export interface PriorityAction {
  conflictId: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: ReadinessCategory;
  /** Number of campaign assets directly involved in this conflict */
  assetCount: number;
  /** First involved asset ID (for deep-link to auditor) */
  primaryAssetId?: string;
}

export interface ReadinessScore {
  campaignId: string;
  campaignName: string;
  /** Overall score 0–100 */
  overallScore: number;
  /** Thresholded launch status with critical-override applied */
  launchStatus: LaunchStatus;
  /** Human-readable one-sentence reason for the current status */
  statusReason: string;
  /** Total campaign assets evaluated */
  assetsAudited: number;
  /** Number of distinct unresolved conflicts returned by the engine */
  unresolvedCount: number;
  /** Conflicts that were present in original campaign.conflicts but not in
   *  the latest engine re-run (i.e., resolved by Auto-Harmonize or manual fix) */
  resolvedCount: number;
  /** True if at least one HIGH-severity conflict exists in the latest engine run */
  hasCriticalViolation: boolean;
  categoryScores: CategoryScore[];
  priorityActions: PriorityAction[];
  /** ISO timestamp of when this score was computed */
  calculatedAt: string;
}
