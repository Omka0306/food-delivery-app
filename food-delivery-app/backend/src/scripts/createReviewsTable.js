require('dotenv').config();
const {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
} = require('@aws-sdk/client-dynamodb');
const { client } = require('../config/dynamodb');

const TABLE = process.env.REVIEWS_TABLE || 'Reviews';

async function tableExists(tableName) {
  try {
    const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
    return result.Table.TableStatus;
  } catch (err) {
    if (err instanceof ResourceNotFoundException || err.name === 'ResourceNotFoundException') return null;
    throw err;
  }
}

async function run() {
  const status = await tableExists(TABLE);
  if (status === 'ACTIVE') {
    console.log(`Table "${TABLE}" already ACTIVE.`);
    return;
  }

  console.log(`Creating table "${TABLE}"...`);
  await client.send(
    new CreateTableCommand({
      TableName: TABLE,
      AttributeDefinitions: [{ AttributeName: 'reviewId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'reviewId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );

  console.log(`  Waiting for "${TABLE}" to become ACTIVE...`);
  await waitUntilTableExists(
    { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
    { TableName: TABLE }
  );

  console.log(`Table "${TABLE}" created successfully.`);
}

run().catch((err) => { console.error('Failed:', err); process.exit(1); });
