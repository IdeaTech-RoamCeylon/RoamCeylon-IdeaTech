# Trip Planner Algorithm - Locked v1.0.0

**Date:** January 16, 2026  
**Status:** Feature Freeze  
**Implementation:** See `planner.constants.ts` for locked values

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
- Proximity boosts: 0.30 (title), 0.20 (metadata), 0.15 (content)
- Max priority score: 2.0

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

## Final Weight Configuration (v2.0 Locked)
The finalized scoring pipeline utilizes the following relative base score limits for calculating the final rank:

- **Base Score**: ~60% (Relevance, Match)
- **Preference Match Influence**: 21% (Max override up to 21% of base)
- **Feedback Influence**: 15.75% (User-history boost cap)
- **Diversity Control**: ~3.25% (Emergency fallback and category penalties)

Requires PO approval and version bump.

## Changelog

| Date | Version | Change | By |
|------|---------|--------|-----|
| 2026-01-16 | 1.0.0 | Initial lock | [Your Name] |
| 2026-03-17 | 2.0.0 | Final optimized weight configuration locked per Day 55 tasks | Backend Team |