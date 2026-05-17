const express  = require('express');
const router   = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const aiRateLimit = require('../middleware/aiRateLimit');
const { buildContext }              = require('../ai/contextBuilder');
const { retrieveRelevantMenuItems } = require('../ai/retrieval');
const { getRecommendations, streamRecommendations } = require('../ai/recommendationEngine');
const {
  logInteraction,
  getInteractionHistory,
  getUserAIProfile,
  upsertUserAIProfile,
} = require('../services/ai.service');
const { batchGetMenuItems } = require('../services/menu.service');

// Build OpenSearch lookup map keyed by menuItemId
function buildOsLookup(menuItems) {
  return Object.fromEntries(menuItems.map((m) => [m.menuItemId, m]))
}

// Enrich AI recommendation objects with imageUrl (DynamoDB) + metadata (OpenSearch)
async function enrichRecommendations(recommendations, osLookup) {
  const ids     = recommendations.map((r) => r.menuItemId).filter(Boolean)
  const dbItems = ids.length ? await batchGetMenuItems(ids) : []
  const dbById  = Object.fromEntries(dbItems.map((i) => [i.id, i]))

  return recommendations.map((rec) => {
    const os = osLookup[rec.menuItemId] || {}
    const db = dbById[rec.menuItemId]  || {}
    return {
      ...rec,
      imageUrl:     db.imageUrl                          || null,
      restaurantId: os.restaurantId || db.restaurantId   || null,
      isVeg:        os.isVeg        ?? db.isVeg          ?? undefined,
      spiceLevel:   os.spiceLevel   ?? db.spiceLevel     ?? 0,
      healthScore:  os.healthScore  ?? db.healthScore    ?? 0,
      calories:     os.calories     ?? db.calories       ?? 0,
      _score:       os._score                            || undefined,
    }
  })
}

// POST /api/ai/recommend — full JSON recommendation
router.post('/recommend', optionalAuth, aiRateLimit, async (req, res) => {
  const { query, city, filters } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, error: { message: 'query is required' } });
  }

  try {
    const userId    = req.user?.userId;
    const context   = await buildContext({ userId, city });
    const menuItems = await retrieveRelevantMenuItems(query.trim(), context, filters || {});

    if (!menuItems.length) {
      return res.json({
        success: true,
        data: {
          greeting:        'Hmm, nothing matched that exactly!',
          recommendations: [],
          tip:             'Try a broader query or browse our full menu.',
        },
      });
    }

    const result   = await getRecommendations({ query: query.trim(), context, menuItems });
    const osLookup = buildOsLookup(menuItems)

    // Enrich: add imageUrl, restaurantId, isVeg, spiceLevel, healthScore, calories (non-fatal)
    try {
      result.recommendations = await enrichRecommendations(result.recommendations || [], osLookup)
    } catch (enrichErr) {
      console.warn('[AI recommend] enrichRecommendations failed (non-fatal):', enrichErr.message)
    }

    // Non-blocking log
    logInteraction({ userId, query: query.trim(), recommendations: result.recommendations, context }).catch(() => {});

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[AI recommend]', err);
    res.status(500).json({ success: false, error: { message: 'AI service temporarily unavailable' } });
  }
});

// GET /api/ai/suggestions/quick — pre-built quick suggestions (no user query needed)
router.get('/suggestions/quick', optionalAuth, async (req, res) => {
  try {
    const context = await buildContext({ userId: req.user?.userId });
    const meal    = context.time?.meal || 'meal';
    const weather = context.weather?.condition || '';

    const queries = [
      `best for ${meal}`,
      weather && weather !== 'unknown' ? `good food for ${weather} weather` : 'popular items',
      'healthy option',
    ].filter(Boolean);

    const suggestions = await Promise.all(
      queries.map(async (q) => {
        const items = await retrieveRelevantMenuItems(q, context);
        return items.slice(0, 2);
      })
    );

    const flat = suggestions.flat();
    const seen = new Set();
    const unique = flat.filter((item) => {
      if (seen.has(item.menuItemId)) return false;
      seen.add(item.menuItemId);
      return true;
    });

    res.json({ success: true, data: { context: { meal, weather }, suggestions: unique.slice(0, 6) } });
  } catch (err) {
    console.error('[AI quick suggestions]', err);
    res.status(500).json({ success: false, error: { message: 'AI service temporarily unavailable' } });
  }
});

// POST /api/ai/chat — SSE streaming response with inline recommendation cards
router.post('/chat', optionalAuth, aiRateLimit, async (req, res) => {
  const { query, city } = req.body;
  if (!query?.trim()) {
    return res.status(400).json({ success: false, error: { message: 'query is required' } });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const context   = await buildContext({ userId: req.user?.userId, city });
    const menuItems = await retrieveRelevantMenuItems(query.trim(), context);

    // Pre-fetch imageUrls for top items — non-fatal if it fails
    const topItems = menuItems.slice(0, 3)
    const topIds   = topItems.map((m) => m.menuItemId).filter(Boolean)
    let dbById = {}
    try {
      const dbItems = topIds.length ? await batchGetMenuItems(topIds) : []
      dbById = Object.fromEntries(dbItems.map((i) => [i.id, i]))
    } catch (batchErr) {
      console.warn('[AI chat] batchGetMenuItems failed (non-fatal):', batchErr.message)
    }

    // Stream conversational text
    await streamRecommendations({
      query: query.trim(),
      context,
      menuItems,
      onChunk: (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
    });

    // After text stream: send real item cards so user can actually add to cart
    if (topItems.length) {
      const enriched = topItems.map((m) => ({
        menuItemId:   m.menuItemId,
        name:         m.name,
        price:        m.price,
        restaurantId: m.restaurantId || null,
        imageUrl:     dbById[m.menuItemId]?.imageUrl || null,
        isVeg:        m.isVeg,
      }))
      res.write(`data: ${JSON.stringify({ recommendations: enriched })}\n\n`)
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[AI chat stream]', err);
    res.write(`data: ${JSON.stringify({ error: 'AI unavailable' })}\n\n`);
  } finally {
    res.end();
  }
});

// POST /api/ai/feedback — thumbs up/down on a recommendation
router.post('/feedback', verifyToken, async (req, res) => {
  const { interactionId, rating, comment } = req.body;
  if (!interactionId || !['up', 'down'].includes(rating)) {
    return res.status(400).json({ success: false, error: { message: 'interactionId and rating (up|down) required' } });
  }
  try {
    const userId  = req.user.userId;
    const profile = (await getUserAIProfile(userId)) || {};
    const feedbacks = profile.feedbacks || [];
    feedbacks.unshift({ interactionId, rating, comment, at: new Date().toISOString() });
    await upsertUserAIProfile(userId, { feedbacks: feedbacks.slice(0, 50) });
    res.json({ success: true, data: { message: 'Feedback recorded. Thank you!' } });
  } catch (err) {
    console.error('[AI feedback]', err);
    res.status(500).json({ success: false, error: { message: 'Could not save feedback' } });
  }
});

// GET /api/ai/history — past AI interactions for authenticated user
router.get('/history', verifyToken, async (req, res) => {
  try {
    const items = await getInteractionHistory(req.user.userId);
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[AI history]', err);
    res.status(500).json({ success: false, error: { message: 'Could not load history' } });
  }
});

// GET /api/ai/profile — get user AI profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const profile = await getUserAIProfile(req.user.userId);
    res.json({ success: true, data: profile || {} });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Could not load profile' } });
  }
});

// PUT /api/ai/profile — update user AI profile (dietary prefs, etc.)
router.put('/profile', verifyToken, async (req, res) => {
  const { isVeg, allergens, preferredCategories, preferredSpiceLevel,
          fitnessGoal, dietary, allergies, mood } = req.body;
  try {
    const updates = {};
    if (isVeg != null)                   updates.isVeg                = !!isVeg;
    if (Array.isArray(allergens))         updates.allergens            = allergens;
    if (Array.isArray(preferredCategories)) updates.preferredCategories = preferredCategories;
    if (preferredSpiceLevel != null)      updates.preferredSpiceLevel  = Number(preferredSpiceLevel);
    // Fields from AIProfileSettings UI
    if (fitnessGoal)                      updates.fitnessGoal          = fitnessGoal;
    if (Array.isArray(dietary))           updates.dietary              = dietary;
    if (Array.isArray(allergies))         updates.allergies            = allergies;
    if (mood !== undefined)               updates.mood                 = mood;

    await upsertUserAIProfile(req.user.userId, updates);
    res.json({ success: true, data: { message: 'Profile updated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Could not update profile' } });
  }
});

module.exports = router;
