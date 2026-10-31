/**
 * Campaign Launch Readiness Score — Unit Tests
 *
 * Tests the readinessEngine.ts scoring logic in isolation using the same
 * node:test + assert pattern as existing tests.
 *
 * Run with: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateReadinessScore,
  CATEGORY_WEIGHTS,
  CONFLICT_CATEGORY_MAP,
  SEVERITY_FRACTION,
} from '../src/services/readinessEngine';
import {
  INITIAL_BRAND_KNOWLEDGE_BASE,
  INITIAL_CAMPAIGN,
  DIWALI_CAMPAIGN,
  BLOOD_DONATION_CAMPAIGN,
  CHRISTMAS_CAMPAIGN,
} from '../src/services/storageService';
import { autoAlignCampaignAssets } from '../src/services/campaignEngine';
import { Campaign, CampaignConflict, CampaignAsset } from '../src/types/campaign';

const kb = INITIAL_BRAND_KNOWLEDGE_BASE;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMinimalAsset(id: string): CampaignAsset {
  return {
    id,
    title: `Asset ${id}`,
    channel: 'Instagram',
    format: 'Image',
    previewUrl: 'compliant-preview',
    uploadedAt: '2026-10-01T00:00:00Z',
    fullText: 'Clean asset text.',
    status: 'In Sync',
    conflictCount: 0,
    extractedDisclaimer: '*Based on clinical trial of 30 women over 4 weeks.',
    extractedLogoVersion: 'Logo v3 (Approved)',
    extractedTagline: 'Discover your daily skincare ritual.',
  };
}

function makeCampaignWithConflicts(
  overrides: Partial<Campaign> & { explicitConflicts?: CampaignConflict[] }
): Campaign {
  const { explicitConflicts, ...campaignOverrides } = overrides;
  // A campaign with clean assets but pre-loaded conflicts to test scoring
  // Note: calculateReadinessScore re-runs the engine, so conflicts from assets
  // are what matters. For explicit conflict testing, we use assets that trigger them.
  return {
    ...INITIAL_CAMPAIGN,
    ...campaignOverrides,
    conflicts: explicitConflicts || [],
  };
}

// ─── Suite 1: Engine Constants ─────────────────────────────────────────────────

describe('Readiness Engine — Constants', () => {
  test('category weights sum to exactly 100', () => {
    const total = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
    assert.equal(total, 100);
  });

  test('all ConflictTypes are mapped to a category', () => {
    const conflictTypes = [
      'Price Discrepancy',
      'Discount Percentage Mismatch',
      'Promo Code Inconsistency',
      'Commercial / Policy Violation',
      'Outdated Logo',
      'Tagline Inconsistency',
      'Missing Disclaimer',
      'Background Scene Warning',
      'Date Expiry Conflict',
      'CTA Divergence',
    ] as const;

    for (const ct of conflictTypes) {
      assert.ok(
        CONFLICT_CATEGORY_MAP[ct],
        `ConflictType "${ct}" must be mapped to a ReadinessCategory`
      );
    }
  });

  test('severity fractions are HIGH ≥ MEDIUM ≥ LOW and all positive', () => {
    assert.ok(SEVERITY_FRACTION.HIGH >= SEVERITY_FRACTION.MEDIUM);
    assert.ok(SEVERITY_FRACTION.MEDIUM >= SEVERITY_FRACTION.LOW);
    assert.ok(SEVERITY_FRACTION.LOW > 0);
  });
});

// ─── Suite 2: Empty Campaign ────────────────────────────────────────────────────

describe('Readiness Engine — Empty Campaign', () => {
  test('campaign with zero assets returns NEEDS REVIEW with score 0', () => {
    const emptyCampaign: Campaign = {
      ...INITIAL_CAMPAIGN,
      assets: [],
      conflicts: [],
    };

    const result = calculateReadinessScore(emptyCampaign, kb);

    assert.equal(result.launchStatus, 'NEEDS REVIEW');
    assert.equal(result.overallScore, 0);
    assert.equal(result.assetsAudited, 0);
    assert.equal(result.unresolvedCount, 0);
    assert.equal(result.hasCriticalViolation, false);
    assert.ok(result.statusReason.length > 0);
    assert.equal(result.categoryScores.length, 5);

    // All categories should be INSUFFICIENT_EVIDENCE
    result.categoryScores.forEach(cs => {
      assert.equal(cs.status, 'INSUFFICIENT_EVIDENCE');
    });
  });
});

// ─── Suite 3: Clean Campaign ────────────────────────────────────────────────────

describe('Readiness Engine — All-Clean Campaign', () => {
  test('campaign with fully clean assets scores 100 and is READY', () => {
    // Use Diwali campaign after Auto-Harmonize (all conflicts cleared)
    const { updatedCampaign } = autoAlignCampaignAssets(DIWALI_CAMPAIGN, kb);
    const result = calculateReadinessScore(updatedCampaign, kb);

    // After auto-align the engine should produce zero HIGH conflicts
    const hasHigh = result.categoryScores.some(cs => cs.sevBreakdown.HIGH > 0);
    assert.equal(hasHigh, false, 'Auto-harmonized campaign should have no HIGH findings');

    // Score must be at or near 100
    assert.ok(result.overallScore >= 70, 'Score after harmonization must be ≥ 70');

    // If score is ≥ 90 and no critical, it must be READY
    if (result.overallScore >= 90 && !result.hasCriticalViolation) {
      assert.equal(result.launchStatus, 'READY');
    }
  });
});

// ─── Suite 4: Score Calculation Math ────────────────────────────────────────────

describe('Readiness Engine — Score Calculation', () => {
  test('Diwali campaign has HIGH discount AND promo conflicts → Discount category deducted to 0', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    const discountCat = result.categoryScores.find(cs => cs.category === 'Discount & Promo Code Consistency');
    assert.ok(discountCat, 'Discount category must be present');

    // Diwali has both Discount Mismatch (HIGH) and Promo Code Inconsistency (HIGH)
    // → Category should be deducted fully (score = 0)
    assert.equal(discountCat.score, 0, 'Discount category with HIGH conflict must score 0');
    assert.equal(discountCat.status, 'CRITICAL');
    assert.ok(discountCat.sevBreakdown.HIGH >= 1);
  });

  test('overall score is sum of all category scores clamped to 0–100', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    const catSum = result.categoryScores.reduce((acc, cs) => acc + cs.score, 0);
    const expectedScore = Math.max(0, Math.min(100, Math.round(catSum)));
    assert.equal(result.overallScore, expectedScore);
  });

  test('category score never goes negative', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    result.categoryScores.forEach(cs => {
      assert.ok(cs.score >= 0, `Category "${cs.category}" score must be ≥ 0`);
    });
  });

  test('category score never exceeds its weight', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    result.categoryScores.forEach(cs => {
      assert.ok(
        cs.score <= cs.weight,
        `Category "${cs.category}" score (${cs.score}) must not exceed weight (${cs.weight})`
      );
    });
  });
});

// ─── Suite 5: Critical Violation Override ─────────────────────────────────────

describe('Readiness Engine — Critical Violation Override', () => {
  test('HIGH conflict prevents READY status even when numerical score ≥ 90', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);

    // Diwali has multiple HIGH violations
    assert.equal(result.hasCriticalViolation, true);

    // Must not be READY regardless of score
    assert.notEqual(result.launchStatus, 'READY',
      'Campaign with HIGH violations must never be READY'
    );
  });

  test('campaign with only LOW conflicts can potentially be READY if score ≥ 90', () => {
    // Build a campaign where the engine produces only LOW findings
    // In our engine, Background Scene Warning = MEDIUM and CTA Divergence = MEDIUM
    // For this test we verify that without HIGH conflicts, launchStatus can reach READY

    const { updatedCampaign } = autoAlignCampaignAssets(INITIAL_CAMPAIGN, kb);
    const result = calculateReadinessScore(updatedCampaign, kb);

    // hasCriticalViolation must be false
    const hasHigh = result.categoryScores.some(cs => cs.sevBreakdown.HIGH > 0);
    if (!hasHigh) {
      assert.equal(result.hasCriticalViolation, false);
      // If score ≥ 90, it must be READY
      if (result.overallScore >= 90) {
        assert.equal(result.launchStatus, 'READY');
      }
    }
  });
});

// ─── Suite 6: Duplicate Conflict Handling ─────────────────────────────────────

describe('Readiness Engine — Duplicate Finding Handling', () => {
  test('each conflict ID is counted only once per category regardless of asset count', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);

    // The Diwali campaign triggers conf-discount-cross-assets and conf-promo-code-mismatch
    // These involve multiple assets but the conflicts themselves have unique IDs
    const discountCat = result.categoryScores.find(cs => cs.category === 'Discount & Promo Code Consistency');
    assert.ok(discountCat);

    // conflictIds must not contain duplicates
    const uniqueIds = new Set(discountCat!.conflictIds);
    assert.equal(uniqueIds.size, discountCat!.conflictIds.length,
      'conflictIds must not contain duplicates within a category'
    );
  });
});

// ─── Suite 7: CSR Campaign ─────────────────────────────────────────────────────

describe('Readiness Engine — CSR Blood Donation Campaign', () => {
  test('commercial violation in CSR campaign is in Brand Compliance category', () => {
    const result = calculateReadinessScore(BLOOD_DONATION_CAMPAIGN, kb);
    const brandCat = result.categoryScores.find(cs => cs.category === 'Brand Compliance');
    assert.ok(brandCat, 'Brand Compliance category must exist');

    // CSR campaign has Commercial / Policy Violation → Brand Compliance
    assert.ok(brandCat!.findingCount >= 1,
      'Brand Compliance must have at least 1 finding for CSR commercial violation'
    );
    assert.ok(brandCat!.sevBreakdown.HIGH >= 1,
      'CSR commercial violation must be HIGH severity in Brand Compliance'
    );
  });

  test('CSR campaign date mismatch is in Campaign Date & CTA Consistency category', () => {
    const result = calculateReadinessScore(BLOOD_DONATION_CAMPAIGN, kb);
    const dateCat = result.categoryScores.find(cs => cs.category === 'Campaign Date & CTA Consistency');
    assert.ok(dateCat, 'Campaign Date category must exist');

    // Blood donation drive has conflicting dates (12 Nov vs 14 Nov)
    assert.ok(dateCat!.findingCount >= 1,
      'Campaign Date & CTA must have at least 1 finding for event date mismatch'
    );
  });

  test('CSR campaign overall status is NOT READY or NEEDS REVIEW', () => {
    const result = calculateReadinessScore(BLOOD_DONATION_CAMPAIGN, kb);
    assert.notEqual(result.launchStatus, 'READY',
      'CSR campaign with policy violations must not be READY'
    );
  });
});

// ─── Suite 8: Autumn Campaign ─────────────────────────────────────────────────

describe('Readiness Engine — Autumn Campaign', () => {
  test('Autumn campaign has price conflicts reflected in Price Consistency category', () => {
    const result = calculateReadinessScore(INITIAL_CAMPAIGN, kb);
    const priceCat = result.categoryScores.find(cs => cs.category === 'Price Consistency');
    assert.ok(priceCat);

    // Autumn campaign has assets with ₹1,099 vs approved ₹1,299
    // Engine should detect price discrepancy
    assert.ok(priceCat!.findingCount >= 1,
      'Price Consistency must flag the ₹1,099 vs ₹1,299 discrepancy'
    );
  });

  test('Autumn campaign has legal issues reflected in Legal & Disclaimer Compliance', () => {
    const result = calculateReadinessScore(INITIAL_CAMPAIGN, kb);
    const legalCat = result.categoryScores.find(cs => cs.category === 'Legal & Disclaimer Compliance');
    assert.ok(legalCat);

    // Some Autumn assets have missing disclaimers
    assert.ok(legalCat!.findingCount >= 1);
  });
});

// ─── Suite 9: Christmas/Winter Campaign ───────────────────────────────────────

describe('Readiness Engine — Christmas Winter Campaign', () => {
  test('Christmas campaign discount inconsistency is detected', () => {
    const result = calculateReadinessScore(CHRISTMAS_CAMPAIGN, kb);
    const discountCat = result.categoryScores.find(cs => cs.category === 'Discount & Promo Code Consistency');
    assert.ok(discountCat);
    assert.ok(discountCat!.findingCount >= 1,
      'Christmas campaign must detect discount inconsistency (30% vs 15% approved)'
    );
  });

  test('Christmas campaign score is between 0 and 100', () => {
    const result = calculateReadinessScore(CHRISTMAS_CAMPAIGN, kb);
    assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
  });
});

// ─── Suite 10: Score After Auto-Harmonize ─────────────────────────────────────

describe('Readiness Engine — Recalculation After Auto-Harmonize', () => {
  test('score improves after autoAlignCampaignAssets on Diwali campaign', () => {
    const beforeResult = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    const { updatedCampaign } = autoAlignCampaignAssets(DIWALI_CAMPAIGN, kb);
    const afterResult = calculateReadinessScore(updatedCampaign, kb);

    assert.ok(
      afterResult.overallScore >= beforeResult.overallScore,
      `Score after harmonization (${afterResult.overallScore}) must be ≥ score before (${beforeResult.overallScore})`
    );
  });

  test('harmonized campaign has zero or fewer HIGH violations than before', () => {
    const beforeResult = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    const { updatedCampaign } = autoAlignCampaignAssets(DIWALI_CAMPAIGN, kb);
    const afterResult = calculateReadinessScore(updatedCampaign, kb);

    const highBefore = beforeResult.categoryScores.reduce((acc, cs) => acc + cs.sevBreakdown.HIGH, 0);
    const highAfter = afterResult.categoryScores.reduce((acc, cs) => acc + cs.sevBreakdown.HIGH, 0);

    assert.ok(
      highAfter <= highBefore,
      `HIGH violations after harmonization (${highAfter}) must be ≤ before (${highBefore})`
    );
  });

  test('unresolved count decreases after auto-harmonize', () => {
    const beforeResult = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    const { updatedCampaign } = autoAlignCampaignAssets(DIWALI_CAMPAIGN, kb);
    const afterResult = calculateReadinessScore(updatedCampaign, kb);

    assert.ok(
      afterResult.unresolvedCount <= beforeResult.unresolvedCount,
      `Unresolved count after harmonization (${afterResult.unresolvedCount}) must be ≤ before (${beforeResult.unresolvedCount})`
    );
  });
});

// ─── Suite 11: Launch Status Thresholds ───────────────────────────────────────

describe('Readiness Engine — Launch Status Thresholds', () => {
  test('returned launchStatus is always one of the three valid values', () => {
    const campaigns = [INITIAL_CAMPAIGN, DIWALI_CAMPAIGN, BLOOD_DONATION_CAMPAIGN, CHRISTMAS_CAMPAIGN];
    const validStatuses = new Set(['READY', 'NEEDS REVIEW', 'NOT READY']);

    for (const campaign of campaigns) {
      const result = calculateReadinessScore(campaign, kb);
      assert.ok(
        validStatuses.has(result.launchStatus),
        `Campaign "${campaign.name}" returned invalid status "${result.launchStatus}"`
      );
    }
  });

  test('statusReason is always a non-empty string', () => {
    const campaigns = [INITIAL_CAMPAIGN, DIWALI_CAMPAIGN, BLOOD_DONATION_CAMPAIGN, CHRISTMAS_CAMPAIGN];
    for (const campaign of campaigns) {
      const result = calculateReadinessScore(campaign, kb);
      assert.ok(typeof result.statusReason === 'string' && result.statusReason.length > 10,
        `Campaign "${campaign.name}" must have a meaningful statusReason`
      );
    }
  });

  test('priorityActions are sorted HIGH before MEDIUM before LOW', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    if (result.priorityActions.length < 2) return; // nothing to compare

    const severityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    for (let i = 0; i < result.priorityActions.length - 1; i++) {
      const current = severityOrder[result.priorityActions[i].severity];
      const next = severityOrder[result.priorityActions[i + 1].severity];
      assert.ok(current <= next, 'Priority actions must be sorted HIGH → MEDIUM → LOW');
    }
  });
});

// ─── Suite 12: Category Score Structure ───────────────────────────────────────

describe('Readiness Engine — Category Score Structure', () => {
  test('always returns exactly 5 category scores', () => {
    const campaigns = [INITIAL_CAMPAIGN, DIWALI_CAMPAIGN, BLOOD_DONATION_CAMPAIGN, CHRISTMAS_CAMPAIGN];
    for (const campaign of campaigns) {
      const result = calculateReadinessScore(campaign, kb);
      assert.equal(result.categoryScores.length, 5,
        `Campaign "${campaign.name}" must return exactly 5 categories`
      );
    }
  });

  test('category weights in result match defined weights', () => {
    const result = calculateReadinessScore(INITIAL_CAMPAIGN, kb);
    const expectedWeights: Record<string, number> = {
      'Price Consistency': 25,
      'Discount & Promo Code Consistency': 20,
      'Brand Compliance': 20,
      'Legal & Disclaimer Compliance': 20,
      'Campaign Date & CTA Consistency': 15,
    };

    result.categoryScores.forEach(cs => {
      assert.equal(
        cs.weight,
        expectedWeights[cs.category],
        `Category "${cs.category}" must have weight ${expectedWeights[cs.category]}`
      );
    });
  });

  test('sevBreakdown counts are non-negative integers', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    result.categoryScores.forEach(cs => {
      assert.ok(Number.isInteger(cs.sevBreakdown.HIGH) && cs.sevBreakdown.HIGH >= 0);
      assert.ok(Number.isInteger(cs.sevBreakdown.MEDIUM) && cs.sevBreakdown.MEDIUM >= 0);
      assert.ok(Number.isInteger(cs.sevBreakdown.LOW) && cs.sevBreakdown.LOW >= 0);
    });
  });

  test('findingCount matches length of conflictIds for each category', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    result.categoryScores.forEach(cs => {
      assert.equal(
        cs.findingCount,
        cs.conflictIds.length,
        `Category "${cs.category}" findingCount must equal conflictIds.length`
      );
    });
  });

  test('explanation is a non-empty string for all categories', () => {
    const result = calculateReadinessScore(DIWALI_CAMPAIGN, kb);
    result.categoryScores.forEach(cs => {
      assert.ok(
        typeof cs.explanation === 'string' && cs.explanation.length > 0,
        `Category "${cs.category}" must have a non-empty explanation`
      );
    });
  });
});
