const { PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const CONNECTIONS_TABLE = process.env.WEBSOCKET_TABLE || 'WebSocketConnections';
const TTL_SECONDS = 24 * 3600;

let verifier = null;
function getVerifier() {
  if (!verifier && process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: process.env.COGNITO_CLIENT_ID,
    });
  }
  return verifier;
}

async function onConnect(event) {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters?.token;
  const ttl = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  let userId = null;
  let restaurantId = null;
  let role = 'anonymous';

  if (token) {
    try {
      const v = getVerifier();
      if (v) {
        const payload = await v.verify(token);
        userId = payload.sub;
        restaurantId = payload['custom:restaurantId'] || null;
        role = payload['custom:role'] || 'customer';
      }
    } catch (_) {
      // allow unauthenticated connections
    }
  }

  await docClient.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        restaurantId,
        role,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    })
  );

  return { statusCode: 200 };
}

async function onDisconnect(event) {
  const connectionId = event.requestContext.connectionId;
  await docClient.send(
    new DeleteCommand({ TableName: CONNECTIONS_TABLE, Key: { connectionId } })
  );
  return { statusCode: 200 };
}

async function onMessage(event) {
  try {
    JSON.parse(event.body || '{}');
  } catch (_) {
    // ignore malformed messages
  }
  return { statusCode: 200 };
}

module.exports = { onConnect, onDisconnect, onMessage };
