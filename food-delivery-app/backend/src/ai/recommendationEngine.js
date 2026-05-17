require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

// Amazon Nova Pro — strong reasoning, no use-case form required
const MODEL_ID = 'amazon.nova-pro-v1:0';

const SYSTEM_PROMPT = `You are QuickBite's friendly AI meal assistant. Your job is to recommend food from the menu based on the user's query, context (time of day, weather, order history), and the retrieved items provided.

Rules:
- Only recommend items from the "Retrieved menu items" list provided — never invent items.
- Be warm, conversational, and concise.
- Always return valid JSON matching the schema below — no markdown, no code fences, no extra text.
- Recommend 2–4 items with a brief reason for each.
- If no items match well, say so honestly and suggest the closest alternatives.

Response JSON schema (return ONLY this JSON, nothing else):
{
  "greeting": "Short friendly greeting referencing time/weather/context",
  "recommendations": [
    {
      "menuItemId": "...",
      "name": "...",
      "price": 000,
      "reason": "One sentence why this item fits"
    }
  ],
  "tip": "Optional short tip (deal, combo suggestion, dietary note)"
}`;

function buildUserMessage(query, context, menuItems) {
  const itemsText = menuItems
    .map(
      (m) =>
        `- ${m.name} (${m.category}) ₹${m.price} | ID: ${m.menuItemId} | ` +
        `${m.isVeg ? 'Veg' : 'Non-Veg'} | Spice: ${m.spiceLevel}/5 | ` +
        `Cal: ${m.calories} | Tags: ${(m.tags || []).join(', ')}`
    )
    .join('\n');

  return `User query: "${query}"

Context:
- Time: ${context.time?.meal || 'unknown'} (${context.time?.day || ''}, ${context.time?.hour || ''}:00)
- Weather: ${context.weather?.condition || 'unknown'}, ${context.weather?.temp ?? '?'}°C
- Recent orders: ${
    context.orderHistory?.length
      ? context.orderHistory.slice(0, 5).map((o) => o.name).join(', ')
      : 'None'
  }

Retrieved menu items:
${itemsText}

Respond with JSON only — no markdown, no explanation.`;
}

async function getRecommendations({ query, context, menuItems }) {
  const body = JSON.stringify({
    messages: [
      { role: 'user', content: [{ text: buildUserMessage(query, context, menuItems) }] },
    ],
    system: [{ text: SYSTEM_PROMPT }],
    inferenceConfig: { max_new_tokens: 1024, temperature: 0.3 },
  });

  const res = await bedrockClient.send(new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  }));

  const parsed = JSON.parse(Buffer.from(res.body).toString('utf-8'));
  const text   = parsed.output?.message?.content?.[0]?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { greeting: '', recommendations: [], tip: '' };
  }
}

async function streamRecommendations({ query, context, menuItems, onChunk }) {
  const simpleMsg = `User query: "${query}"\nMenu items:\n${
    menuItems.map((m) => `- ${m.name} ₹${m.price}`).join('\n')
  }\nContext: ${context.time?.meal}, ${context.weather?.condition} ${context.weather?.temp}°C\n\nGive a brief conversational food recommendation.`;

  const body = JSON.stringify({
    messages: [{ role: 'user', content: [{ text: simpleMsg }] }],
    system: [{
      text: "You are QuickBite's friendly AI meal assistant. Recommend food items briefly and warmly. " +
            "IMPORTANT: never claim you are adding anything to the user's cart — you cannot do that. " +
            "Instead, suggest the item and let the user tap the 'Add' button on the card below.",
    }],
    inferenceConfig: { max_new_tokens: 400 },
  });

  const res = await bedrockClient.send(new InvokeModelWithResponseStreamCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  }));

  for await (const event of res.body) {
    if (event.chunk) {
      const chunk = JSON.parse(Buffer.from(event.chunk.bytes).toString('utf-8'));
      const text  = chunk.contentBlockDelta?.delta?.text;
      if (text) onChunk(text);
    }
  }
}

module.exports = { getRecommendations, streamRecommendations };
