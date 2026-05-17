const { v4: uuidv4 } = require('uuid');
const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const MENU_TABLE = process.env.MENU_TABLE || 'MenuItems';

async function getAllMenuItems() {
  const result = await docClient.send(new ScanCommand({ TableName: MENU_TABLE }));
  return result.Items || [];
}

async function getMenuByCategory(category) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: MENU_TABLE,
      FilterExpression: 'category = :cat',
      ExpressionAttributeValues: { ':cat': category },
    })
  );
  return result.Items || [];
}

async function getMenuItemById(id) {
  const result = await docClient.send(
    new GetCommand({ TableName: MENU_TABLE, Key: { id } })
  );
  return result.Item || null;
}

async function updateMenuItemAvailability(id, available) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: MENU_TABLE,
      Key: { id },
      UpdateExpression: 'SET available = :available, updatedAt = :now',
      ExpressionAttributeValues: {
        ':available': available,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

async function createMenuItem({ restaurantId, name, description, price, category, imageUrl, isVeg, prepTime }) {
  const now = new Date().toISOString();
  const item = {
    id: uuidv4(),
    restaurantId,
    name,
    description: description || '',
    price: parseFloat(price),
    category,
    imageUrl: imageUrl || '',
    isVeg: isVeg === true || isVeg === 'true',
    prepTime: prepTime || '15-20 mins',
    available: true,
    rating: 0,
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: MENU_TABLE, Item: item }));
  return item;
}

async function updateMenuItem(id, updates) {
  const allowed = ['name', 'description', 'price', 'category', 'imageUrl', 'isVeg', 'prepTime'];
  const now = new Date().toISOString();

  const setParts = ['updatedAt = :now'];
  const expAttrValues = { ':now': now };
  const expAttrNames = {};

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      setParts.push(`#${field} = :${field}`);
      expAttrNames[`#${field}`] = field;
      expAttrValues[`:${field}`] =
        field === 'price' ? parseFloat(updates[field]) :
        field === 'isVeg' ? (updates[field] === true || updates[field] === 'true') :
        updates[field];
    }
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: MENU_TABLE,
      Key: { id },
      UpdateExpression: `SET ${setParts.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expAttrNames).length ? expAttrNames : undefined,
      ExpressionAttributeValues: expAttrValues,
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

async function deleteMenuItem(id) {
  await docClient.send(new DeleteCommand({ TableName: MENU_TABLE, Key: { id } }));
}

async function batchGetMenuItems(ids) {
  if (!ids || !ids.length) return []
  const uniqueIds = [...new Set(ids)].slice(0, 100) // DynamoDB batch limit
  const res = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [MENU_TABLE]: { Keys: uniqueIds.map((id) => ({ id })) },
      },
    })
  )
  return res.Responses?.[MENU_TABLE] || []
}

module.exports = {
  getAllMenuItems,
  getMenuByCategory,
  getMenuItemById,
  batchGetMenuItems,
  updateMenuItemAvailability,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
