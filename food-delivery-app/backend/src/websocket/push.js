const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');
const { ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const CONNECTIONS_TABLE = process.env.WEBSOCKET_TABLE || 'WebSocketConnections';

function getManagementClient() {
  const endpoint = process.env.WEBSOCKET_ENDPOINT;
  if (!endpoint) return null;
  return new ApiGatewayManagementApiClient({ endpoint });
}

async function sendToConnection(client, connectionId, data) {
  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(data)),
      })
    );
    return true;
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 410) {
      await docClient.send(
        new DeleteCommand({ TableName: CONNECTIONS_TABLE, Key: { connectionId } })
      );
    }
    return false;
  }
}

async function pushToUser(userId, data) {
  const client = getManagementClient();
  if (!client || !userId) return;

  const result = await docClient.send(
    new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    })
  );

  const connections = result.Items || [];
  await Promise.all(connections.map((c) => sendToConnection(client, c.connectionId, data)));
}

async function pushToRestaurant(restaurantId, data) {
  const client = getManagementClient();
  if (!client || !restaurantId) return;

  const result = await docClient.send(
    new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'restaurantId = :restaurantId',
      ExpressionAttributeValues: { ':restaurantId': restaurantId },
    })
  );

  const connections = result.Items || [];
  await Promise.all(connections.map((c) => sendToConnection(client, c.connectionId, data)));
}

module.exports = { pushToUser, pushToRestaurant };
