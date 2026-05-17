const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' })
);

const AI_TABLE   = process.env.AI_INTERACTIONS_TABLE || 'AIInteractions';
const PROF_TABLE = process.env.USER_AI_PROFILES_TABLE || 'UserAIProfiles';

async function logInteraction({ userId, query, recommendations, context }) {
  const interactionId = uuidv4();
  const item = {
    interactionId,
    userId:          userId || 'guest',
    query,
    recommendations: recommendations || [],
    context:         context || {},
    createdAt:       new Date().toISOString(),
    ttl:             Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90-day TTL
  };
  await dynamo.send(new PutCommand({ TableName: AI_TABLE, Item: item }));
  return interactionId;
}

async function getInteractionHistory(userId, limit = 10) {
  const res = await dynamo.send(new QueryCommand({
    TableName:                 AI_TABLE,
    IndexName:                 'userId-createdAt-index',
    KeyConditionExpression:    'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward:          false,
    Limit:                     limit,
  }));
  return res.Items || [];
}

async function getUserAIProfile(userId) {
  const res = await dynamo.send(new GetCommand({ TableName: PROF_TABLE, Key: { userId } }));
  return res.Item || null;
}

async function upsertUserAIProfile(userId, updates) {
  const expressions = [];
  const names  = {};
  const values = { ':ua': new Date().toISOString() };

  for (const [k, v] of Object.entries(updates)) {
    expressions.push(`#${k} = :${k}`);
    names[`#${k}`]  = k;
    values[`:${k}`] = v;
  }
  expressions.push('#updatedAt = :ua');
  names['#updatedAt'] = 'updatedAt';

  await dynamo.send(new UpdateCommand({
    TableName:                 PROF_TABLE,
    Key:                       { userId },
    UpdateExpression:          `SET ${expressions.join(', ')}`,
    ExpressionAttributeNames:  names,
    ExpressionAttributeValues: values,
  }));
}

module.exports = { logInteraction, getInteractionHistory, getUserAIProfile, upsertUserAIProfile };
