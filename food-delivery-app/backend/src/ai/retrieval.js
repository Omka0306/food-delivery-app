const { generateEmbedding } = require('./embeddings');
const { knnSearch } = require('./opensearch');

function extractFiltersFromQuery(query) {
  const q = query.toLowerCase();
  const filters = {};

  if (/\bveg(etarian)?\b/.test(q) && !/non.?veg/i.test(q)) filters.isVeg = true;

  const priceMatch = q.match(/under\s+(?:rs\.?\s*|₹\s*)?(\d+)/);
  if (priceMatch) filters.maxPrice = parseInt(priceMatch[1], 10);

  const calMatch = q.match(/under\s+(\d+)\s*(?:cal|calories)/);
  if (calMatch) filters.maxCalories = parseInt(calMatch[1], 10);

  if (/\bno\s+spice\b|not\s+spicy\b|mild\b/.test(q)) filters.maxSpice = 0;
  if (/\blight\s+spice\b|lightly\s+spicy\b/.test(q)) filters.maxSpice = 1;

  const categories = ['pizza', 'burger', 'burgers', 'sides', 'drinks'];
  for (const cat of categories) {
    if (q.includes(cat)) {
      filters.category = cat.charAt(0).toUpperCase() + cat.slice(1).replace('s', '');
      if (cat === 'burgers') filters.category = 'Burgers';
      break;
    }
  }

  const allergens = [];
  if (/\bgluten.?free\b/.test(q)) allergens.push('gluten');
  if (/\bdairy.?free\b/.test(q) || /\bno\s+dairy\b/.test(q)) allergens.push('dairy');
  if (allergens.length) filters.allergenFree = allergens;

  return filters;
}

async function retrieveRelevantMenuItems(query, context = {}, overrideFilters = {}) {
  const filters = { ...extractFiltersFromQuery(query), ...overrideFilters };

  // Enrich query with contextual signals for better semantic matching
  const enriched = [
    query,
    context.time?.meal ? `for ${context.time.meal}` : '',
    context.weather?.condition && context.weather.condition !== 'unknown'
      ? `weather is ${context.weather.condition} ${context.weather.temp}°C`
      : '',
  ]
    .filter(Boolean)
    .join(', ');

  const embedding = await generateEmbedding(enriched);
  const results   = await knnSearch({ embedding, size: 8, filters });

  return results;
}

module.exports = { retrieveRelevantMenuItems, extractFiltersFromQuery };
