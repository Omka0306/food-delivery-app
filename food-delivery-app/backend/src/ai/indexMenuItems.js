require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generateEmbedding, buildEmbeddingText } = require('./embeddings');
const { createIndex, indexDocument } = require('./opensearch');

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' })
);

async function indexAllMenuItems() {
  console.log('Fetching menu items from DynamoDB...');
  const res = await dynamo.send(new ScanCommand({ TableName: process.env.MENU_TABLE || 'MenuItems' }));
  const items = res.Items || [];
  console.log(`Found ${items.length} items`);

  await createIndex();

  let indexed = 0;
  let failed  = 0;

  for (const item of items) {
    try {
      const text      = buildEmbeddingText(item);
      const embedding = await generateEmbedding(text);

      await indexDocument({
        menuItemId:   item.id,
        restaurantId: item.restaurantId,
        name:         item.name,
        category:     item.category,
        description:  item.description,
        price:        item.price,
        isVeg:        item.isVeg ?? false,
        spiceLevel:   item.spiceLevel ?? 0,
        calories:     item.calories ?? 0,
        healthScore:  item.healthScore ?? 5,
        tags:         item.tags || [],
        moodTags:     item.moodTags || [],
        bestFor:      item.bestFor || [],
        weatherTags:  item.weatherTags || [],
        allergens:    item.allergens || [],
        rating:       item.rating ?? 0,
        available:    item.available !== false,
        embedding,
      });

      console.log(`  ✓ ${item.name}`);
      indexed++;
    } catch (err) {
      console.error(`  ✗ ${item.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${indexed} indexed, ${failed} failed`);
}

indexAllMenuItems().catch((err) => { console.error(err); process.exit(1); });
