/**
 * Creates DynamoDB tables in a local DynamoDB instance for CI integration tests.
 * Reads DYNAMODB_LOCAL_ENDPOINT from env (default: http://localhost:8000).
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000';

const client = new DynamoDBClient({
  endpoint,
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

const TABLES = [
  {
    TableName: process.env.MENU_TABLE || 'menu-items-test',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'restaurantId', AttributeType: 'S' },
      { AttributeName: 'category', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'restaurantId-index',
        KeySchema: [
          { AttributeName: 'restaurantId', KeyType: 'HASH' },
          { AttributeName: 'category', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.ORDERS_TABLE || 'orders-test',
    KeySchema: [{ AttributeName: 'orderId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'orderId', AttributeType: 'S' },
      { AttributeName: 'customerId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'customerId-index',
        KeySchema: [{ AttributeName: 'customerId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.RESTAURANTS_TABLE || 'restaurants-test',
    KeySchema: [{ AttributeName: 'restaurantId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'restaurantId', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.USER_PROFILES_TABLE || 'user-profiles-test',
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.WEBSOCKET_TABLE || 'websocket-connections-test',
    KeySchema: [{ AttributeName: 'connectionId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'connectionId', AttributeType: 'S' },
      { AttributeName: 'restaurantId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'restaurantId-index',
        KeySchema: [{ AttributeName: 'restaurantId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.REVIEWS_TABLE || 'reviews-test',
    KeySchema: [{ AttributeName: 'reviewId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'reviewId', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.AI_INTERACTIONS_TABLE || 'ai-interactions-test',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'interactionId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'interactionId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: process.env.USER_AI_PROFILES_TABLE || 'user-ai-profiles-test',
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
];

async function setup() {
  console.log(`Setting up DynamoDB Local tables at ${endpoint}...`);

  const { TableNames: existing } = await client.send(new ListTablesCommand({}));

  for (const tableParams of TABLES) {
    if (existing.includes(tableParams.TableName)) {
      console.log(`  ✓ ${tableParams.TableName} (already exists)`);
      continue;
    }
    await client.send(new CreateTableCommand(tableParams));
    console.log(`  ✓ ${tableParams.TableName} (created)`);
  }

  console.log('All tables ready.');
}

setup().catch((err) => {
  console.error('setupLocalTables failed:', err.message);
  process.exit(1);
});
