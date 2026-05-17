/**
 * Migration: adds isVeg field and updates prices to INR for all menu items.
 * Matches items by name (safe to run multiple times).
 */
require('dotenv').config();
const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const MENU_TABLE = process.env.MENU_TABLE || 'MenuItems';

const UPDATES = {
  'Margherita':    { price: 299, isVeg: true },
  'Pepperoni':     { price: 349, isVeg: false },
  'BBQ Chicken':   { price: 399, isVeg: false },
  'Classic Smash': { price: 249, isVeg: false },
  'Mushroom Swiss':{ price: 299, isVeg: false },
  'Veggie':        { price: 199, isVeg: true },
  'Veggie Burger': { price: 199, isVeg: true },
  'Loaded Fries':  { price: 149, isVeg: false },
  'Onion Rings':   { price: 89,  isVeg: true },
  'Coleslaw':      { price: 69,  isVeg: true },
  'Coca Cola':     { price: 49,  isVeg: true },
  'Fresh Lemonade':{ price: 69,  isVeg: true },
  'Mango Shake':   { price: 89,  isVeg: true },
};

async function run() {
  console.log('Scanning menu items…');
  const { Items = [] } = await docClient.send(new ScanCommand({ TableName: MENU_TABLE }));
  console.log(`Found ${Items.length} items`);

  let updated = 0;
  for (const item of Items) {
    const patch = UPDATES[item.name];
    if (!patch) {
      console.log(`  SKIP  ${item.name} (no mapping)`);
      continue;
    }
    await docClient.send(
      new UpdateCommand({
        TableName: MENU_TABLE,
        Key: { id: item.id },
        UpdateExpression: 'SET price = :p, isVeg = :v',
        ExpressionAttributeValues: { ':p': patch.price, ':v': patch.isVeg },
      })
    );
    console.log(`  OK    ${item.name} → ₹${patch.price}, isVeg=${patch.isVeg}`);
    updated++;
  }
  console.log(`\nDone — updated ${updated}/${Items.length} items`);
}

run().catch((err) => { console.error(err); process.exit(1); });
