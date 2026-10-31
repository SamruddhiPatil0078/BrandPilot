import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  extractBrandDataDeterministic,
  mergeExtractedDataIntoKb
} from '../src/services/pdfBrandGuideParser';
import { INITIAL_BRAND_KNOWLEDGE_BASE } from '../src/services/storageService';
import { PdfImportModal } from '../src/components/BrandMemory/PdfImportModal';

const SAMPLE_TEXT = `
AURELIA SKINCARE Q4 GUIDELINES
Theme Color: Emerald #00473E
Accent: Gold #C89B3C
Primary Product: Deep Hydrating Moisturizer 50g (SKU: AUR-HM-50) Standard Price: ₹1,299.
Banned Claim: "cures acne permanently" and "results guaranteed in 7 days".
*Based on a 4-week clinical trial of 30 women using Aurelia.
Primary Tagline: "Discover your daily skincare ritual."
`;

describe('Feature 1: Dynamic PDF Brand Guide Ingestion (PDF-to-Memory Sync)', () => {
  test('extractBrandDataDeterministic extracts hex colors and product prices reliably', () => {
    const data = extractBrandDataDeterministic(SAMPLE_TEXT);

    assert.ok(data.colors.length >= 2, 'Should extract at least 2 colors');
    assert.ok(data.colors.some(c => c.hex === '#00473E'), 'Should extract #00473E');
    assert.ok(data.colors.some(c => c.hex === '#C89B3C'), 'Should extract #C89B3C');

    assert.ok(data.products.length >= 1, 'Should extract at least 1 product');
    assert.ok(data.products.some(p => p.currentPrice === 1299), 'Should extract ₹1,299');
  });

  test('extractBrandDataDeterministic detects prohibited claim terminology', () => {
    const data = extractBrandDataDeterministic(SAMPLE_TEXT);
    assert.ok(data.terminology.length >= 2, 'Should detect at least 2 banned terms');
    assert.ok(data.terminology.some(t => t.term.toLowerCase().includes('cures acne')));
    assert.ok(data.terminology.some(t => t.term.toLowerCase().includes('guaranteed in 7 days')));
  });

  test('extractBrandDataDeterministic extracts asterisk footnote disclaimers', () => {
    const data = extractBrandDataDeterministic(SAMPLE_TEXT);
    assert.ok(data.disclaimers.length >= 1, 'Should extract clinical trial footnote');
    assert.ok(data.disclaimers[0].disclaimerText.includes('4-week clinical trial'));
  });

  test('mergeExtractedDataIntoKb creates a new version and appends rollback history', () => {
    const initialKb = INITIAL_BRAND_KNOWLEDGE_BASE;
    const initialHistoryLength = initialKb.versionHistory.length;

    const extracted = extractBrandDataDeterministic(SAMPLE_TEXT);
    const updated = mergeExtractedDataIntoKb(initialKb, extracted, 'v3.3 (PDF Guidelines)', 'Test Auditor');

    assert.equal(updated.activeVersion, 'v3.3 (PDF Guidelines)');
    assert.equal(updated.updatedBy, 'Test Auditor');
    assert.equal(updated.versionHistory.length, initialHistoryLength + 1);
    assert.equal(updated.versionHistory[0].version, 'v3.3 (PDF Guidelines)');
    assert.ok(updated.versionHistory[0].snapshotData, 'Should store snapshot for 1-click rollback');
  });

  test('renders PdfImportModal cleanly in React SSR without errors', () => {
    const html = renderToString(
      React.createElement(PdfImportModal, {
        isOpen: true,
        onClose: () => {},
        existingKb: INITIAL_BRAND_KNOWLEDGE_BASE,
        onApplyNewKb: () => {}
      })
    );

    assert.ok(html.includes('Import Brand Book (PDF-to-Memory Sync)'));
    assert.ok(html.includes('Load Demo Manual'));
  });
});
