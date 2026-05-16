require('dotenv').config();
const {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
} = require('@aws-sdk/client-dynamodb');
const { PutCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { client, docClient } = require('../config/dynamodb');
const restaurantData = require('./restaurantData');

const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || 'Restaurants';
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || 'UserProfiles';

async function getTableStatus(tableName) {
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

async function waitForActive(tableName) {
  console.log(`  Waiting for "${tableName}" to become ACTIVE...`);
  await waitUntilTableExists(
    { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
    { TableName: tableName }
  );
  console.log(`  "${tableName}" is ACTIVE.`);
}

async function ensureTable(tableName, pkName, pkType) {
  const status = await getTableStatus(tableName);
  if (status === 'ACTIVE') {
    console.log(`Table "${tableName}" is ACTIVE.`);
    return;
  }
  if (status === null) {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [{ AttributeName: pkName, AttributeType: pkType }],
        KeySchema: [{ AttributeName: pkName, KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    console.log(`Table "${tableName}" created.`);
  }
  await waitForActive(tableName);
}

async function clearTable(tableName, pkKey) {
  const scan = await docClient.send(new ScanCommand({
    TableName: tableName,
    ProjectionExpression: pkKey,
  }));
  if (!scan.Items || scan.Items.length === 0) return;
  for (const item of scan.Items) {
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { [pkKey]: item[pkKey] },
    }));
  }
  console.log(`  Cleared ${scan.Items.length} item(s) from "${tableName}".`);
}

async function run() {
  try {
    console.log('Ensuring restaurant tables exist...');
    await ensureTable(RESTAURANTS_TABLE, 'restaurantId', 'S');
    await ensureTable(USER_PROFILES_TABLE, 'userId', 'S');

    console.log('\nClearing existing restaurant data...');
    await clearTable(RESTAURANTS_TABLE, 'restaurantId');

    console.log(`\nSeeding ${restaurantData.length} restaurants...`);
    for (const restaurant of restaurantData) {
      await docClient.send(new PutCommand({ TableName: RESTAURANTS_TABLE, Item: restaurant }));
      console.log(`  [OK] ${restaurant.name} (${restaurant.cuisine})`);
    }

    console.log('\nSeed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
