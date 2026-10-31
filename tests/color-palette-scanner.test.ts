import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  hexToRgb,
  rgbToHex,
  calculateColorDistance,
  evaluatePaletteCompliance,
  analyzeImagePaletteFromUrl
} from '../src/services/colorAnalysisService';
import { INITIAL_BRAND_KNOWLEDGE_BASE } from '../src/services/storageService';
import { BrandPaletteScanner } from '../src/components/ContentAuditor/BrandPaletteScanner';

const brandColors = INITIAL_BRAND_KNOWLEDGE_BASE.colors;

describe('Feature 2: In-Browser Brand Palette & Visual Identity Scanner', () => {
  test('hexToRgb and rgbToHex convert colors accurately', () => {
    const rgb = hexToRgb('#00473E');
    assert.equal(rgb.r, 0);
    assert.equal(rgb.g, 71);
    assert.equal(rgb.b, 62);

    const backToHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    assert.equal(backToHex, '#00473E');
  });

  test('calculateColorDistance produces 0 for exact matches and > 0 for distinct colors', () => {
    const zeroDist = calculateColorDistance('#00473E', '#00473E');
    assert.equal(zeroDist, 0);

    const closeDist = calculateColorDistance('#00473E', '#004A41');
    assert.ok(closeDist < 0.05, 'Very close shade should have small distance');

    const largeDist = calculateColorDistance('#00473E', '#FF0000');
    assert.ok(largeDist > 0.5, 'Emerald to Bright Red should have large distance');
  });

  test('evaluatePaletteCompliance classifies on-brand swatches as COMPLIANT', () => {
    const onBrandSwatches = [
      { hex: '#00473E', percentage: 50 }, // Aurelia Emerald
      { hex: '#C89B3C', percentage: 30 }, // Refined Gold
      { hex: '#F7F5F0', percentage: 20 }  // Pearl Cream
    ];

    const result = evaluatePaletteCompliance(onBrandSwatches, brandColors);
    assert.equal(result.status, 'COMPLIANT');
    assert.equal(result.paletteComplianceScore, 100);
    assert.equal(result.primaryColorMatched, true);
    assert.equal(result.offBrandColors.length, 0);
  });

  test('evaluatePaletteCompliance detects off-brand clashing accents', () => {
    const mixedSwatches = [
      { hex: '#00473E', percentage: 40 },
      { hex: '#F7F5F0', percentage: 30 },
      { hex: '#FF0055', percentage: 30 } // Off-brand neon magenta/red
    ];

    const result = evaluatePaletteCompliance(mixedSwatches, brandColors);
    assert.ok(result.status === 'WARNING' || result.status === 'VIOLATION');
    assert.ok(result.paletteComplianceScore < 100);
    assert.ok(result.offBrandColors.some(c => c.hex === '#FF0055'));
  });

  test('analyzeImagePaletteFromUrl resolves fallback for known sample assets', async () => {
    const result = await analyzeImagePaletteFromUrl('/assets/aurelia-pamphlet-ad.png', brandColors);
    assert.ok(result.dominantSwatches.length >= 3);
    assert.equal(result.primaryColorMatched, true);
    assert.ok(result.paletteComplianceScore >= 70);
  });

  test('renders BrandPaletteScanner in React SSR cleanly without errors', () => {
    const mockResult = evaluatePaletteCompliance(
      [
        { hex: '#00473E', percentage: 60 },
        { hex: '#C89B3C', percentage: 40 }
      ],
      brandColors
    );

    const html = renderToString(
      React.createElement(BrandPaletteScanner, {
        paletteResult: mockResult,
        brandColors,
        isAnalyzing: false
      })
    );

    assert.ok(html.includes('Visual Palette Scanner'));
    assert.ok(html.includes('On-Brand'));
  });
});
