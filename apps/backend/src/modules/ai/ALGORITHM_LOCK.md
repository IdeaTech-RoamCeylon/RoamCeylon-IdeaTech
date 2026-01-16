# Trip Planner Algorithm - Locked v1.0.0

**Date:** January 16, 2026  
**Status:** Feature Freeze

## What's Locked

The trip planning algorithm in `ai.controller.ts`:
- Scoring formulas and thresholds
- Activity distribution (2/4 per day, 15 max)
- Diversity controls
- Regional filtering

**Key Values:**
- Confidence: 0.8 (High), 0.5 (Medium), 0.55 (Min)
- Activity limits: 15 total, 4/day (multi-day), 2/day (single)
- Category divisor: 4

## Allowed

Bug fixes only:
- Null checks
- Edge case handling
- Error messages
- Code comments

## Not Allowed

Algorithm changes:
- Threshold adjustments
- Formula modifications
- New features

Requires PO approval and version bump.

## Changelog

| Date | Version | Change | By |
|------|---------|--------|-----|
| 2026-01-16 | 1.0.0 | Initial lock | [Your Name] |