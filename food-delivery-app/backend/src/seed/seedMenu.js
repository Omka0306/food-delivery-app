require('dotenv').config();
const {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
} = require('@aws-sdk/client-dynamodb');
const { PutCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { client, docClient } = require('../config/dynamodb');
const menuItems = require('./menuData');

const MENU_TABLE = process.env.MENU_TABLE || 'MenuItems';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';

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

async function createMenuTable() {
  const status = await getTableStatus(MENU_TABLE);
  if (status === 'ACTIVE') {
    console.log(`Table "${MENU_TABLE}" already exists and is ACTIVE.`);
    return;
  }
  if (status === null) {
    await client.send(
      new CreateTableCommand({
        TableName: MENU_TABLE,
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    console.log(`Table "${MENU_TABLE}" created successfully.`);
  }
  await waitForActive(MENU_TABLE);
}

async function createOrdersTable() {
  const status = await getTableStatus(ORDERS_TABLE);
  if (status === 'ACTIVE') {
    console.log(`Table "${ORDERS_TABLE}" already exists and is ACTIVE.`);
    return;
  }
  if (status === null) {
    await client.send(
      new CreateTableCommand({
        TableName: ORDERS_TABLE,
        AttributeDefinitions: [{ AttributeName: 'orderId', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'orderId', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    console.log(`Table "${ORDERS_TABLE}" created successfully.`);
  }
  await waitForActive(ORDERS_TABLE);
}

async function clearMenuItems() {
  console.log(`\nClearing all existing items from "${MENU_TABLE}"...`);
  const scan = await docClient.send(new ScanCommand({
    TableName: MENU_TABLE,
    ProjectionExpression: 'id',
  }));

  if (!scan.Items || scan.Items.length === 0) {
    console.log('  No existing items found.');
    return;
  }

  for (const item of scan.Items) {
    await docClient.send(new DeleteCommand({
      TableName: MENU_TABLE,
      Key: { id: item.id },
    }));
  }
  console.log(`  Deleted ${scan.Items.length} existing item(s).`);
}

async function seedMenuItems() {
  console.log(`\nSeeding ${menuItems.length} menu items into "${MENU_TABLE}"...`);
  for (const item of menuItems) {
    try {
      await docClient.send(new PutCommand({ TableName: MENU_TABLE, Item: item }));
      console.log(`  [OK] ${item.name} (${item.category})`);
    } catch (err) {
      console.error(`  [FAIL] ${item.name}: ${err.message}`);
    }
  }
}

async function run() {
  try {
    console.log('Ensuring DynamoDB tables exist...');
    await createMenuTable();
    await createOrdersTable();
    await clearMenuItems();
    await seedMenuItems();
    console.log('\nSeed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
