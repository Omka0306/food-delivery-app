require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Titan embeddings only available in us-east-1
const client = new BedrockRuntimeClient({ region: 'us-east-1' });

const MODEL_ID = 'amazon.titan-embed-text-v1';

async function generateEmbedding(text) {
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: text }),
  });

  const res = await client.send(command);
  const parsed = JSON.parse(Buffer.from(res.body).toString('utf-8'));
  return parsed.embedding; // float[]  length 1536
}

function buildEmbeddingText(item) {
  const tags     = (item.tags      || []).join(', ');
  const moods    = (item.moodTags  || []).join(', ');
  const bestFor  = (item.bestFor   || []).join(', ');
  const weather  = (item.weatherTags || []).join(', ');
  const allergens = (item.allergens || []).join(', ');

  return [
    `Name: ${item.name}`,
    `Category: ${item.category}`,
    `Description: ${item.description}`,
    `Price: ₹${item.price}`,
    `Vegetarian: ${item.isVeg ? 'Yes' : 'No'}`,
    `Spice Level: ${item.spiceLevel ?? 0}/5`,
    `Calories: ${item.calories ?? 'unknown'}`,
    `Health Score: ${item.healthScore ?? 'unknown'}/10`,
    `Tags: ${tags}`,
    `Mood: ${moods}`,
    `Best For: ${bestFor}`,
    `Weather: ${weather}`,
    allergens ? `Allergens: ${allergens}` : '',
    `Rating: ${item.rating ?? 'N/A'}/5`,
  ]
    .filter(Boolean)
    .join('. ');
}

module.exports = { generateEmbedding, buildEmbeddingText };
