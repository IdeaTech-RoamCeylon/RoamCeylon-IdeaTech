import { PLANNER_CONFIG } from './planner.constants';

describe('Learning Influence Caps - Configuration Validation', () => {
  describe('Cap Hierarchy', () => {
    it('should have properly configured cap hierarchy', () => {
      const feedbackCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX;
      const preferenceCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.PREFERENCE_OVERRIDE_MAX;
      const combinedCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX;

      // Feedback cap should be less than combined
      expect(feedbackCap).toBeLessThan(combinedCap);

      // Preference cap should be less than combined
      expect(preferenceCap).toBeLessThan(combinedCap);

      // Combined should be the highest
      expect(combinedCap).toBeGreaterThanOrEqual(feedbackCap);
      expect(combinedCap).toBeGreaterThanOrEqual(preferenceCap);

      console.log(`\n📊 Cap Configuration:`);
      console.log(`   Feedback cap: ${(feedbackCap * 100).toFixed(0)}%`);
      console.log(`   Preference cap: ${(preferenceCap * 100).toFixed(0)}%`);
      console.log(`   Combined cap: ${(combinedCap * 100).toFixed(0)}%`);
      console.log(`   ✅ Cap hierarchy is properly configured`);
    });

    it('should have feedback cap at 15%', () => {
      expect(
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX,
      ).toBe(0.15);
    });

    it('should have preference cap at 20%', () => {
      expect(
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.PREFERENCE_OVERRIDE_MAX,
      ).toBe(0.2);
    });

    it('should have combined cap at 25%', () => {
      expect(PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX).toBe(
        0.25,
      );
    });
  });

  describe('Integration with Existing Caps', () => {
    it('should align combined cap with MAX_PERSONALIZATION_INFLUENCE', () => {
      const combinedCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX;
      const maxPersonalization =
        PLANNER_CONFIG.CONSISTENCY.MAX_PERSONALIZATION_INFLUENCE;

      // These should match to ensure consistent behavior
      expect(combinedCap).toBe(maxPersonalization);

      console.log(
        `\n✅ Combined cap aligns with MAX_PERSONALIZATION_INFLUENCE`,
      );
      console.log(`   Both set to ${(combinedCap * 100).toFixed(0)}%`);
    });

    it('should prevent runaway bias with proper cap ratios', () => {
      const feedbackCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX;
      const preferenceCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.PREFERENCE_OVERRIDE_MAX;
      const combinedCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX;

      // Verify that even if both feedback and preference try to max out,
      // the combined cap will constrain them
      const worstCaseUncapped = feedbackCap + preferenceCap; // 0.15 + 0.20 = 0.35

      console.log(`\n📊 Runaway Bias Prevention:`);
      console.log(
        `   Worst case uncapped: ${(worstCaseUncapped * 100).toFixed(0)}%`,
      );
      console.log(`   Combined cap: ${(combinedCap * 100).toFixed(0)}%`);
      console.log(
        `   Reduction: ${((worstCaseUncapped - combinedCap) * 100).toFixed(0)}%`,
      );
      console.log(`   ✅ Caps prevent accumulation beyond 25%`);

      expect(combinedCap).toBeLessThan(worstCaseUncapped);
    });
  });

  describe('Cap Configuration Metadata', () => {
    it('should have descriptive documentation', () => {
      expect(PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.DESCRIPTION).toBeDefined();
      expect(PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.DESCRIPTION).toContain(
        'runaway bias',
      );

      console.log(`\n📝 Documentation:`);
      console.log(`   ${PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.DESCRIPTION}`);
    });
  });

  describe('Mathematical Constraints', () => {
    it('should ensure caps are within valid bounds (0-1)', () => {
      const feedbackCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX;
      const preferenceCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.PREFERENCE_OVERRIDE_MAX;
      const combinedCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX;

      expect(feedbackCap).toBeGreaterThan(0);
      expect(feedbackCap).toBeLessThanOrEqual(1);

      expect(preferenceCap).toBeGreaterThan(0);
      expect(preferenceCap).toBeLessThanOrEqual(1);

      expect(combinedCap).toBeGreaterThan(0);
      expect(combinedCap).toBeLessThanOrEqual(1);

      console.log(`\n✅ All caps within valid range (0, 1]`);
    });

    it('should have meaningful cap spacing', () => {
      const feedbackCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX;
      const preferenceCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.PREFERENCE_OVERRIDE_MAX;
      const combinedCap =
        PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX;

      // Feedback should be meaningfully less than preference
      const feedbackPrefGap = preferenceCap - feedbackCap;
      expect(feedbackPrefGap).toBeGreaterThan(0.04); // At least 4% gap (allowing for floating point)

      // Combined should be meaningfully higher than preference
      const prefCombinedGap = combinedCap - preferenceCap;
      expect(prefCombinedGap).toBeGreaterThan(0.04); // At least 4% gap (allowing for floating point)

      console.log(`\n📊 Cap Spacing:`);
      console.log(
        `   Feedback → Preference gap: ${(feedbackPrefGap * 100).toFixed(0)}%`,
      );
      console.log(
        `   Preference → Combined gap: ${(prefCombinedGap * 100).toFixed(0)}%`,
      );
      console.log(`   ✅ Meaningful gaps between cap tiers`);
    });
  });
});
