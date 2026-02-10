import { getHumanExplanation } from '../src/utils/explanationTemplates';

console.log("\n🤖 --- EXPLANATION TEST --- 🤖");
// Generate 5 examples to see the variation
for(let i=0; i<5; i++) {
  console.log(`[${i+1}] ${getHumanExplanation("PREFERENCE_MATCH", "History")}`);
}