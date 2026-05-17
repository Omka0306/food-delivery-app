const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' })
);

const AI_TABLE    = process.env.AI_INTERACTIONS_TABLE || 'AIInteractions';
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || '100', 10);
const HOUR_LIMIT  = 20;
const GUEST_LIMIT = 5;

// In-memory fallback for dev / when DynamoDB is unavailable
const memStore = new Map();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function hourKey() {
  const d = new Date();
  return `${d.toISOString().slice(0, 13)}`;
}

async function checkAndIncrement(key, limit) {
  // Try in-memory first (fast path for Lambda warm containers)
  const existing = memStore.get(key) || { count: 0 };
  if (existing.count >= limit) return false;

  memStore.set(key, { count: existing.count + 1 });

  // Best-effort DynamoDB sync (non-blocking)
  try {
    await dynamo.send(new UpdateCommand({
      TableName: AI_TABLE,
      Key:       { interactionId: `ratelimit#${key}` },
      UpdateExpression: 'ADD #c :one SET #ttl = :ttl',
      ExpressionAttributeNames:  { '#c': 'count', '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':one': 1,
        ':ttl': Math.floor(Date.now() / 1000) + 25 * 60 * 60,
      },
    }));
  } catch {
    // Non-critical
  }

  return true;
}

function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

function aiRateLimit(req, res, next) {
  const userId = req.user?.userId;
  const limit  = userId ? HOUR_LIMIT : GUEST_LIMIT;
  const key    = userId ? `user#${userId}#${hourKey()}` : `ip#${req.ip}#${hourKey()}`;

  if (req.body?.query) {
    req.body.query = sanitizeInput(req.body.query);
  }

  checkAndIncrement(key, limit)
    .then((allowed) => {
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: { code: 'RATE_LIMIT_EXCEEDED', message: `AI requests limited to ${limit}/hour` },
        });
      }

      if (userId) {
        const dayKey = `user#${userId}#daily#${todayKey()}`;
        return checkAndIncrement(dayKey, DAILY_LIMIT).then((dailyAllowed) => {
          if (!dailyAllowed) {
            return res.status(429).json({
              success: false,
              error: { code: 'DAILY_LIMIT_EXCEEDED', message: `Daily AI limit of ${DAILY_LIMIT} reached` },
            });
          }
          next();
        });
      }
      next();
    })
    .catch(() => next()); // never block on rate-limiter failure
}

module.exports = aiRateLimit;
