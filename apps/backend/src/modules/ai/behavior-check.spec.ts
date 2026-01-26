import {
  distributeActivitiesAcrossDays,
  TripDestination,
} from '../../utils/planningHeuristics';
import {
  analyzeResponseQuality,
  validateInput,
} from '../../utils/responseSafety';
import { getHumanExplanation } from '../../utils/explanationTemplates';

// --- MOCK DATA FACTORY ---
const createMockPlace = (name: string, score: number): TripDestination => ({
  id: name,
  placeName: name,
  shortDescription: 'Desc',
  order: 0,
  coordinates: { latitude: 7.0, longitude: 80.0 },
  metadata: { duration: '2 hours', category: 'culture' },
  confidenceScore: score,
});

describe('AI Production Behavior Review', () => {
  // SCENARIO 1: Predictability & Clarity (Happy Path)
  // Ensure a standard request produces a valid, explained plan.
  it('Scenario: Standard Request -> Produces Valid Plan + Explanations', () => {
    const inputs = [
      createMockPlace('Temple of Tooth', 0.95),
      createMockPlace('Kandy Lake', 0.85),
      createMockPlace('Royal Botanical Gardens', 0.9),
    ];

    // 1. Run Planning
    const plan = distributeActivitiesAcrossDays(inputs, 1);

    // 2. Check Plan Structure
    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0].length).toBe(3); // Should fit all 3 in one day

    // 3. Check Explanation Generation
    const explanation = getHumanExplanation('DAY_GROUPING');
    expect(explanation).toBeTruthy();
    expect(typeof explanation).toBe('string');
    console.log('       [Clarity Check] Generated Explanation:', explanation);
  });

  // SCENARIO 2: Fallback Triggers (Low Quality Data)
  // Ensure the system warns the user instead of silently failing.
  it('Scenario: Low Confidence Data -> Triggers "WEAK_MATCH" Warning', () => {
    const poorInputs = [
      createMockPlace('Unknown Shop', 0.2), // Below 0.4 threshold
      createMockPlace('Sketchy Alley', 0.3), // Below 0.4 threshold
    ];

    // 1. Run Planning (Should filter everything out)
    const plan = distributeActivitiesAcrossDays(poorInputs, 1);

    // 2. Verify Result is Empty (Strict Filtering worked)
    expect(plan.flat().length).toBe(0);

    // 3. Run Safety Check on the ORIGINAL input (to decide what to tell user)
    // Note: In real app, we check the OUTPUT of the DB search.
    // Here we simulate the safety check catching the low scores.
    const safetyResult = analyzeResponseQuality(poorInputs);

    expect(safetyResult.status).toBe('WEAK_MATCH');
    console.log(
      '       [Fallback Check] Status Triggered:',
      safetyResult.status,
    );
    console.log(
      '       [Fallback Check] Message to User:',
      safetyResult.message,
    );
  });

  // SCENARIO 3: Safety & Validation (Bad Input)
  // Ensure the system blocks bad inputs immediately.
  it('Scenario: Bad User Input -> Blocked Immediately', () => {
    const badInputs = ['', 'Hi', '   '];

    badInputs.forEach((input) => {
      const error = validateInput(input);
      expect(error).not.toBeNull(); // Should return an error string
    });
    console.log('       [Safety Check] Blocked invalid inputs successfully.');
  });

  // SCENARIO 4: Consistency Check (Stability)
  // Ensure that running the same request multiple times produces identical results.
  it('Scenario: Repeated Requests -> Produce Consistent Output', () => {
    const inputs = [
      createMockPlace('Fixed Point A', 0.9),
      createMockPlace('Fixed Point B', 0.85),
      createMockPlace('Fixed Point C', 0.8),
    ];

    // Run 1
    const run1 = distributeActivitiesAcrossDays(inputs, 1);
    const order1 = run1[0].map((p) => p.placeName).join('->');

    // Run 2
    const run2 = distributeActivitiesAcrossDays(inputs, 1);
    const order2 = run2[0].map((p) => p.placeName).join('->');

    // Verify they are identical
    expect(order1).toBe(order2);
    console.log(`       [Stability Check] Run 1: ${order1}`);
    console.log(`       [Stability Check] Run 2: ${order2}`);
    console.log(
      '       [Stability Check] Result: PASS (Outputs are identical)',
    );
  });
});
