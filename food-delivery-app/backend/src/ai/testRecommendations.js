require('dotenv').config();
const { buildContext } = require('./contextBuilder');
const { retrieveRelevantMenuItems } = require('./retrieval');
const { getRecommendations } = require('./recommendationEngine');

const TEST_QUERIES = [
  'I want something spicy for dinner',
  'vegetarian healthy option under ₹200',
  'something refreshing to drink',
  'comfort food for rainy weather',
  'light lunch with low calories',
];

async function runTests() {
  console.log('=== AI Meal Assistant — E2E Test ===\n');

  const context = await buildContext({ city: 'Mumbai' });
  console.log('Context:', JSON.stringify(context, null, 2), '\n');

  for (const query of TEST_QUERIES) {
    console.log(`\nQuery: "${query}"`);
    console.log('─'.repeat(50));

    try {
      const menuItems = await retrieveRelevantMenuItems(query, context);
      console.log(`Retrieved ${menuItems.length} items: ${menuItems.map((m) => m.name).join(', ')}`);

      const result = await getRecommendations({ query, context, menuItems });
      console.log('Greeting:', result.greeting);
      console.log('Recommendations:');
      result.recommendations?.forEach((r) => console.log(`  - ${r.name} ₹${r.price}: ${r.reason}`));
      if (result.tip) console.log('Tip:', result.tip);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  console.log('\n=== Tests complete ===');
}

runTests().catch((err) => { console.error(err); process.exit(1); });
