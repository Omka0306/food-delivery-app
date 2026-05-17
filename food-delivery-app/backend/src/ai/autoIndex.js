const { generateEmbedding, buildEmbeddingText } = require('./embeddings');
const { indexDocument } = require('./opensearch');

// Non-blocking re-index for a single menu item.
// Call this after create/update operations in restaurant menu routes.
function scheduleItemIndex(menuItem) {
  if (!process.env.OPENSEARCH_ENDPOINT) return;

  setImmediate(async () => {
    try {
      const text      = buildEmbeddingText(menuItem);
      const embedding = await generateEmbedding(text);

      await indexDocument({
        menuItemId:   menuItem.id,
        restaurantId: menuItem.restaurantId,
        name:         menuItem.name,
        category:     menuItem.category,
        description:  menuItem.description,
        price:        menuItem.price,
        isVeg:        menuItem.isVeg ?? false,
        spiceLevel:   menuItem.spiceLevel ?? 0,
        calories:     menuItem.calories ?? 0,
        healthScore:  menuItem.healthScore ?? 5,
        tags:         menuItem.tags || [],
        moodTags:     menuItem.moodTags || [],
        bestFor:      menuItem.bestFor || [],
        weatherTags:  menuItem.weatherTags || [],
        allergens:    menuItem.allergens || [],
        rating:       menuItem.rating ?? 0,
        available:    menuItem.available !== false,
        embedding,
      });
    } catch (err) {
      // Non-critical — log and continue
      console.warn(`[autoIndex] Failed to index "${menuItem.name}":`, err.message);
    }
  });
}

module.exports = { scheduleItemIndex };
