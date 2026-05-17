require('dotenv').config();
const {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
  UpdateTimeToLiveCommand,
} = require('@aws-sdk/client-dynamodb');
const { client } = require('../config/dynamodb');

const WEBSOCKET_TABLE = process.env.WEBSOCKET_TABLE || 'WebSocketConnections';

async function tableExists(tableName) {
  try {
    const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
    return result.Table.TableStatus;
  } catch (err) {
    if (err instanceof ResourceNotFoundException || err.name === 'ResourceNotFoundException') {
      return null;
    }
    throw err;
  }
}

async function createWebSocketTable() {
  const status = await tableExists(WEBSOCKET_TABLE);
  if (status === 'ACTIVE') {
    console.log(`Table "${WEBSOCKET_TABLE}" already ACTIVE.`);
    return;
  }

  console.log(`Creating table "${WEBSOCKET_TABLE}"...`);
  await client.send(
    new CreateTableCommand({
      TableName: WEBSOCKET_TABLE,
      AttributeDefinitions: [
        { AttributeName: 'connectionId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'restaurantId', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'connectionId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-index',
          KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'restaurantId-index',
          KeySchema: [{ AttributeName: 'restaurantId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    })
  );

  console.log(`  Waiting for "${WEBSOCKET_TABLE}" to become ACTIVE...`);
  await waitUntilTableExists(
    { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
    { TableName: WEBSOCKET_TABLE }
  );

  await client.send(
    new UpdateTimeToLiveCommand({
      TableName: WEBSOCKET_TABLE,
      TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true },
    })
  );

  console.log(`Table "${WEBSOCKET_TABLE}" created with TTL enabled.`);
}

async function run() {
  try {
    await createWebSocketTable();
    console.log('\nTable setup complete.');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

run();
