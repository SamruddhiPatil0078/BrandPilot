import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateComplianceScore, findPhraseBounds } from '../src/services/auditorEngine';
import { AuditFinding } from '../src/types/audit';

function createMockFinding(severity: 'HIGH' | 'MEDIUM' | 'LOW', id = 'f1'): AuditFinding {
  return {
    id,
    pinNumber: 1,
    title: 'Test Finding',
    category: 'Verified rule violation',
    severity,
    flaggedText: 'Flagged phrase',
    explanation: 'Explanation',
    approvedSource: {
      title: 'Guideline',
      version: 'v3.2'
    },
    suggestedFix: 'Approved phrase',
    suggestedFixExplanation: 'Fix explanation',
    ruleType: 'Claim',
    decision: 'PENDING'
  };
}

describe('Task 2 — Compliance Score Calculation', () => {
  test('returns 100 for clean assets with zero findings', () => {
    const score = calculateComplianceScore([]);
    assert.equal(score, 100);
  });

  test('deducts 25 points for each HIGH severity finding', () => {
    const findings = [createMockFinding('HIGH', 'f1')];
    assert.equal(calculateComplianceScore(findings), 75);
  });

  test('deducts 15 points for MEDIUM and 5 for LOW severity', () => {
    const findings = [
      createMockFinding('MEDIUM', 'f1'),
      createMockFinding('LOW', 'f2')
    ];
    // 100 - 15 - 5 = 80
    assert.equal(calculateComplianceScore(findings), 80);
  });

  test('calculates cumulative deductions accurately across mixed severities', () => {
    const findings = [
      createMockFinding('HIGH', 'f1'),   // -25
      createMockFinding('HIGH', 'f2'),   // -25
      createMockFinding('MEDIUM', 'f3'), // -15
      createMockFinding('LOW', 'f4')     // -5
    ];
    // 100 - 25 - 25 - 15 - 5 = 30
    assert.equal(calculateComplianceScore(findings), 30);
  });

  test('clamps score to 0 when deductions exceed 100 points (never negative)', () => {
    const findings = [
      createMockFinding('HIGH', 'f1'),
      createMockFinding('HIGH', 'f2'),
      createMockFinding('HIGH', 'f3'),
      createMockFinding('HIGH', 'f4'),
      createMockFinding('HIGH', 'f5')
    ];
    // 100 - 125 -> clamped to 0
    assert.equal(calculateComplianceScore(findings), 0);
  });

  test('clamped score never exceeds 100', () => {
    const score = calculateComplianceScore([]);
    assert.ok(score <= 100 && score >= 0);
  });
});

describe('Task 3 — Suggested Fix Workflow Logic', () => {
  function applyFindingFixToText(
    currentText: string,
    finding: AuditFinding
  ): { success: boolean; updatedText: string; reason?: string } {
    if (finding.ruleType === 'Disclaimer') {
      const cleanFix = finding.suggestedFix.trim();
      if (!currentText.includes(cleanFix)) {
        return { success: true, updatedText: currentText.trimEnd() + '\n\n' + cleanFix };
      }
      return { success: false, updatedText: currentText, reason: 'Disclaimer is already present in draft text.' };
    }

    if (finding.ruleType === 'Logo') {
      return {
        success: false,
        updatedText: currentText,
        reason: 'Logo replacement must be updated in artwork/graphic files directly.'
      };
    }

    const flagged = finding.flaggedText.trim();
    const unquotedFlagged = flagged.replace(/^["'“”]|["'“”]$/g, '').trim();
    const cleanFix = finding.suggestedFix.replace(/^["'“”]|["'“”]$/g, '').trim();

    if (currentText.includes(flagged)) {
      return { success: true, updatedText: currentText.replace(flagged, cleanFix) };
    }

    if (unquotedFlagged && currentText.includes(unquotedFlagged)) {
      return { success: true, updatedText: currentText.replace(unquotedFlagged, cleanFix) };
    }

    if (unquotedFlagged.length >= 4) {
      const lowerText = currentText.toLowerCase();
      const lowerFlagged = unquotedFlagged.toLowerCase();
      const firstIdx = lowerText.indexOf(lowerFlagged);
      if (firstIdx !== -1) {
        const secondIdx = lowerText.indexOf(lowerFlagged, firstIdx + 1);
        if (secondIdx === -1) {
          const updatedText =
            currentText.substring(0, firstIdx) +
            cleanFix +
            currentText.substring(firstIdx + unquotedFlagged.length);
          return { success: true, updatedText };
        }
      }
    }

    if (finding.ruleType === 'Price') {
      const priceDigits = flagged.replace(/[^0-9]/g, '');
      if (priceDigits) {
        const priceRegex = new RegExp(`(₹|rs\\.?\\s*)?\\s*${priceDigits}`, 'i');
        if (priceRegex.test(currentText)) {
          return { success: true, updatedText: currentText.replace(priceRegex, cleanFix) };
        }
      }
    }

    return {
      success: false,
      updatedText: currentText,
      reason: `Could not confidently match "${flagged}" in editable draft copy. Please edit the draft text manually.`
    };
  }

  test('replaces exact flagged text with approved fix in editable draft', () => {
    const finding = createMockFinding('HIGH');
    finding.flaggedText = 'Results guaranteed in 7 days.';
    finding.suggestedFix = 'Visible barrier hydration within 4 weeks*.';

    const draft = 'Aurelia Skincare. Results guaranteed in 7 days. Special offer.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, true);
    assert.equal(result.updatedText, 'Aurelia Skincare. Visible barrier hydration within 4 weeks*. Special offer.');
  });

  test('replaces unquoted flagged text when quotes exist in guideline entry', () => {
    const finding = createMockFinding('HIGH');
    finding.flaggedText = '"India\'s most loved moisturizer!"';
    finding.suggestedFix = '"Discover your daily skincare ritual."';

    const draft = "Welcome to Aurelia. India's most loved moisturizer! Daily ritual.";
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, true);
    assert.equal(result.updatedText, 'Welcome to Aurelia. Discover your daily skincare ritual. Daily ritual.');
  });

  test('appends mandatory legal disclaimer when absent from draft', () => {
    const finding = createMockFinding('HIGH');
    finding.ruleType = 'Disclaimer';
    finding.flaggedText = '(Disclaimer footnote absent from asset)';
    finding.suggestedFix = '*Based on clinical trial of 30 women over 4 weeks.';

    const draft = 'Aurelia Deep Hydrating Moisturizer 50g.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, true);
    assert.ok(result.updatedText.endsWith('*Based on clinical trial of 30 women over 4 weeks.'));
  });

  test('refuses automatic text replacement for Logo rules and guides manual artwork update', () => {
    const finding = createMockFinding('MEDIUM');
    finding.ruleType = 'Logo';
    finding.flaggedText = 'Vintage Crest Logo v2.1';
    finding.suggestedFix = 'Botanical Wordmark v3.0';

    const draft = 'Aurelia Skincare — Discover your daily skincare ritual.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, false);
    assert.ok(result.reason?.includes('artwork/graphic files directly'));
    assert.equal(result.updatedText, draft); // Content left untouched
  });

  test('refuses replacement and prompts manual editing if flagged text cannot be located', () => {
    const finding = createMockFinding('HIGH');
    finding.flaggedText = 'Completely unknown phrase not in draft';
    finding.suggestedFix = 'Fixed text';

    const draft = 'Aurelia Skincare — Discover your daily skincare ritual.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, false);
    assert.ok(result.reason?.includes('Could not confidently match'));
    assert.equal(result.updatedText, draft);
  });
});

describe('Task 1 — Backend Proxy Request Validation & Health', () => {
  let serverInstance: any;

  test('GET /api/health returns server status without exposing secrets', async () => {
    const { server } = await import('../server/index');
    serverInstance = server;
    const res = await fetch('http://localhost:3001/api/health');
    assert.equal(res.status, 200);
    const data = await res.json() as { status: string; groqConfigured: boolean };
    assert.equal(data.status, 'ok');
    assert.equal(typeof data.groqConfigured, 'boolean');
    assert.equal((data as Record<string, unknown>).apiKey, undefined);
  });

  test('POST /api/groq/chat rejects empty messages array with 400', async () => {
    const res = await fetch('http://localhost:3001/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });
    assert.equal(res.status, 400);
    const data = await res.json() as { error: string };
    assert.ok(data.error.includes('must be a non-empty array'));
  });

  test('POST /api/groq/chat rejects invalid role with 400', async () => {
    const res = await fetch('http://localhost:3001/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'hacker', content: 'test' }]
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json() as { error: string };
    assert.ok(data.error.includes('must be system, user, or assistant'));
  });

  test('POST /api/groq/chat rejects message content exceeding 25,000 characters with 400', async () => {
    const res = await fetch('http://localhost:3001/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'A'.repeat(26000) }]
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json() as { error: string };
    assert.ok(data.error.includes('up to 25,000 characters'));

    if (serverInstance) {
      serverInstance.close();
    }
  });
});

describe('Task 4 — Content Auditor Marker Accuracy & Coordinate Mapping', () => {
  const mockImageWidth = 900;
  const mockImageHeight = 1200;

  const mockOcrWords = [
    { text: 'AURELIA', bbox: { x0: 204, y0: 60, x1: 424, y1: 98 } },
    { text: 'SKINCARE', bbox: { x0: 440, y0: 60, x1: 692, y1: 98 } },
    { text: 'VITAMIN', bbox: { x0: 136, y0: 202, x1: 353, y1: 238 } },
    { text: 'C', bbox: { x0: 369, y0: 202, x1: 400, y1: 238 } },
    { text: 'GLOW', bbox: { x0: 417, y0: 202, x1: 572, y1: 238 } },
    { text: 'SERUM', bbox: { x0: 586, y0: 202, x1: 760, y1: 238 } },
    { text: '*100%', bbox: { x0: 78, y0: 811, x1: 238, y1: 848 } },
    { text: 'CURE', bbox: { x0: 254, y0: 811, x1: 389, y1: 848 } },
    { text: 'FOR', bbox: { x0: 404, y0: 811, x1: 507, y1: 848 } },
    { text: 'WRINKLES', bbox: { x0: 519, y0: 811, x1: 784, y1: 848 } },
    { text: 'RESULTS', bbox: { x0: 122, y0: 882, x1: 273, y1: 906 } },
    { text: 'GUARANTEED', bbox: { x0: 285, y0: 882, x1: 528, y1: 906 } },
    { text: 'IN', bbox: { x0: 542, y0: 882, x1: 574, y1: 906 } },
    { text: '48', bbox: { x0: 586, y0: 882, x1: 629, y1: 906 } },
    { text: 'HOURS!', bbox: { x0: 643, y0: 882, x1: 775, y1: 906 } }
  ];

  test('locates exact normalized percentage rectangle for "100% cure for wrinkles"', () => {
    const bounds = findPhraseBounds('100% cure for wrinkles', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.ok(bounds, 'Bounds should be found');
    // x0=78, y0=811, x1=784, y1=848
    // x% = (78 / 900) * 100 ≈ 8.67%
    // y% = (811 / 1200) * 100 ≈ 67.58%
    assert.ok(Math.abs(bounds.x - (78 / 900) * 100) < 0.01);
    assert.ok(Math.abs(bounds.y - (811 / 1200) * 100) < 0.01);
    assert.ok(Math.abs(bounds.width - ((784 - 78) / 900) * 100) < 0.01);
    assert.ok(Math.abs(bounds.height - ((848 - 811) / 1200) * 100) < 0.01);
  });

  test('locates exact separate rectangle for "Results guaranteed in 48 hours!" without overlap', () => {
    const boundsWrinkles = findPhraseBounds('100% cure for wrinkles', mockOcrWords, mockImageWidth, mockImageHeight);
    const boundsGuarantee = findPhraseBounds('results guaranteed in 48 hours', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.ok(boundsWrinkles && boundsGuarantee);
    // Guarantee is at y0=882, which is below y1=848
    assert.ok(boundsGuarantee.y > boundsWrinkles.y + boundsWrinkles.height, 'Guarantee box should be below wrinkle cure box');
  });

  test('returns undefined for non-existent phrases and does not fabricate coordinates', () => {
    const bounds = findPhraseBounds('Some imaginary text not in image', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.equal(bounds, undefined);
  });

  test('VITAMIN C GLOW SERUM coordinates are distinct and not matched for violations', () => {
    const boundsProduct = findPhraseBounds('VITAMIN C GLOW SERUM', mockOcrWords, mockImageWidth, mockImageHeight);
    const boundsWrinkles = findPhraseBounds('100% cure for wrinkles', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.ok(boundsProduct && boundsWrinkles);
    // Product is near y=202/1200 ≈ 16.8%, wrinkles is near y=811/1200 ≈ 67.6%
    assert.ok(boundsProduct.y < 25);
    assert.ok(boundsWrinkles.y > 60);
  });
});


