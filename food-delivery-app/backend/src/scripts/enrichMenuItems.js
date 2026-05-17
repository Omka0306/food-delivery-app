require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' })
);

// AI metadata keyed by item name (case-insensitive)
const AI_META = {
  'Margherita':    { tags: ['classic','cheese','italian','vegetarian','light'], calories: 750, spiceLevel: 0, allergens: ['gluten','dairy'], healthScore: 6, moodTags: ['comfort','light','classic'], bestFor: ['lunch','dinner','family'], weatherTags: ['any','sunny'] },
  'Pepperoni':     { tags: ['spicy','meat','italian','non-veg','crowd-pleaser'], calories: 900, spiceLevel: 2, allergens: ['gluten','dairy','pork'], healthScore: 4, moodTags: ['indulgent','party','celebration'], bestFor: ['dinner','party','group-order'], weatherTags: ['rainy','cold','any'] },
  'BBQ Chicken':   { tags: ['bbq','chicken','smoky','non-veg','hearty'], calories: 980, spiceLevel: 1, allergens: ['gluten','dairy'], healthScore: 5, moodTags: ['hearty','comfort','satisfying'], bestFor: ['dinner','weekend','group-order'], weatherTags: ['cold','rainy','winter'] },
  'Classic Smash': { tags: ['beef','classic','smash-burger','non-veg','filling'], calories: 720, spiceLevel: 0, allergens: ['gluten','dairy','egg'], healthScore: 4, moodTags: ['comfort','satisfying','classic'], bestFor: ['lunch','dinner','quick-meal'], weatherTags: ['any','sunny'] },
  'Mushroom Swiss':{ tags: ['mushroom','cheese','gourmet','non-veg','umami'], calories: 780, spiceLevel: 0, allergens: ['gluten','dairy','egg'], healthScore: 5, moodTags: ['gourmet','indulgent','comfort'], bestFor: ['dinner','date-night','treat-yourself'], weatherTags: ['cold','rainy','any'] },
  'Veggie Burger': { tags: ['vegetarian','healthy','plant-based','light','fresh'], calories: 480, spiceLevel: 0, allergens: ['gluten','egg'], healthScore: 8, moodTags: ['healthy','light','fresh'], bestFor: ['lunch','health-conscious','vegetarian'], weatherTags: ['sunny','warm','any'] },
  'Loaded Fries':  { tags: ['fries','cheese','bacon','indulgent','shareable'], calories: 560, spiceLevel: 0, allergens: ['dairy','pork'], healthScore: 3, moodTags: ['indulgent','comfort','party'], bestFor: ['snack','side','sharing'], weatherTags: ['any','rainy','cold'] },
  'Onion Rings':   { tags: ['crispy','vegetarian','shareable','fried','snack'], calories: 380, spiceLevel: 0, allergens: ['gluten','egg'], healthScore: 3, moodTags: ['snack','comfort','crunchy'], bestFor: ['snack','side','sharing'], weatherTags: ['any'] },
  'Coleslaw':      { tags: ['fresh','healthy','vegetarian','creamy','light'], calories: 150, spiceLevel: 0, allergens: ['egg','dairy'], healthScore: 8, moodTags: ['light','fresh','healthy'], bestFor: ['side','health-conscious','summer'], weatherTags: ['sunny','warm','hot'] },
  'Coca Cola':     { tags: ['cold','fizzy','classic','refreshing','sweet'], calories: 140, spiceLevel: 0, allergens: [], healthScore: 2, moodTags: ['refreshing','classic','celebration'], bestFor: ['any-meal','party','quick-drink'], weatherTags: ['hot','sunny','warm'] },
  'Fresh Lemonade':{ tags: ['fresh','citrus','mint','healthy','homemade'], calories: 90, spiceLevel: 0, allergens: [], healthScore: 7, moodTags: ['refreshing','fresh','light'], bestFor: ['any-meal','health-conscious','summer'], weatherTags: ['hot','sunny','warm'] },
  'Mango Shake':   { tags: ['mango','creamy','tropical','sweet','thick'], calories: 320, spiceLevel: 0, allergens: ['dairy'], healthScore: 6, moodTags: ['indulgent','tropical','treat-yourself'], bestFor: ['dessert','treat-yourself','summer'], weatherTags: ['hot','sunny','warm'] },
};

async function main() {
  console.log('Fetching menu items...');
  const res = await dynamo.send(new ScanCommand({ TableName: process.env.MENU_TABLE || 'MenuItems' }));
  const items = res.Items || [];
  console.log(`Found ${items.length} items\n`);

  for (const item of items) {
    const meta = AI_META[item.name];
    if (!meta) {
      console.log(`  SKIP (no metadata): ${item.name}`);
      continue;
    }

    await dynamo.send(new UpdateCommand({
      TableName: process.env.MENU_TABLE || 'MenuItems',
      Key: { id: item.id },
      UpdateExpression: 'SET #tags = :tags, calories = :cal, spiceLevel = :sl, allergens = :al, healthScore = :hs, moodTags = :mt, bestFor = :bf, weatherTags = :wt',
      ExpressionAttributeNames:  { '#tags': 'tags' },
      ExpressionAttributeValues: {
        ':tags': meta.tags,
        ':cal':  meta.calories,
        ':sl':   meta.spiceLevel,
        ':al':   meta.allergens,
        ':hs':   meta.healthScore,
        ':mt':   meta.moodTags,
        ':bf':   meta.bestFor,
        ':wt':   meta.weatherTags,
      },
    }));
    console.log(`  ✓ ${item.name}`);
  }

  console.log('\nEnrichment complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
