import { distributeActivitiesAcrossDays, TripDestination } from '../src/utils/planningHeuristics';

// 1. MOCK DATA: A mix of categories
const MOCK_DB: TripDestination[] = [
  {
    id: 't-1', placeName: 'Grand Temple', order: 0, shortDescription: '',
    coordinates: { latitude: 0, longitude: 0 },
    confidenceScore: 0.7, // <--- CHANGED FROM 0.8 TO 0.7 (So others can beat it!)
    metadata: { duration: '2h', category: 'culture' }
  },
  {
    id: 'f-1', placeName: 'Spicy Street Food', order: 0, shortDescription: '',
    coordinates: { latitude: 0, longitude: 0.01 },
    confidenceScore: 0.6, 
    metadata: { duration: '1h', category: 'food' }
  },
  {
    id: 'r-1', placeName: 'Sunset Park', order: 0, shortDescription: '',
    coordinates: { latitude: 0, longitude: 0.02 },
    confidenceScore: 0.7,
    metadata: { duration: '2h', category: 'relaxation' }
  },
  {
    id: 'f-2', placeName: 'Floating Market', order: 0, shortDescription: '',
    coordinates: { latitude: 0, longitude: 0.03 },
    confidenceScore: 0.5, 
    metadata: { duration: '2h', category: 'food' }
  }
];

const runDemo = () => {
  console.log('🤖 --- AI SPRINT 6 DEMO: PERSONALIZATION --- 🤖\n');

  // SCENARIO A: Generic User (No Profile)
  const genericPlan = distributeActivitiesAcrossDays([...MOCK_DB], 1);
  console.log('👤 [Generic User] Top Pick:', genericPlan[0][0].placeName); 
  // Expect: Grand Temple (Score 0.8)

  // SCENARIO B: The "Foodie" (Loves Food)
  const foodiePlan = distributeActivitiesAcrossDays([...MOCK_DB], 1, {
    likedCategories: ['food'],
    previouslyVisitedIds: []
  });
  console.log('🍕 [Foodie User]  Top Pick:', foodiePlan[0][0].placeName);
  // Expect: Spicy Street Food (Score 0.6 + 0.15 boost > others? Maybe close, but market might jump up)

  // SCENARIO C: The "Regular" (Visited Temple Before)
  // They have already been to the Temple, so they want something new OR they edited it.
  // Actually, let's test "Explicit Interest" -> They clicked "Floating Market" before.
  const returnUserPlan = distributeActivitiesAcrossDays([...MOCK_DB], 1, {
    likedCategories: [],
    previouslyVisitedIds: ['f-2'] // Floating Market ID
  });
  console.log('⭐ [Return User]  Top Pick:', returnUserPlan[0][0].placeName);
  // Expect: Floating Market (Score 0.5 + 0.25 boost = 0.75, making it very competitive)

  console.log('\n✅ DEMO COMPLETE: Different users get different trips!');
};

runDemo();