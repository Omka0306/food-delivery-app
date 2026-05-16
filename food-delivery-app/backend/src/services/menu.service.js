const { ScanCommand, GetCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const MENU_TABLE = process.env.MENU_TABLE || 'MenuItems';

async function getAllMenuItems() {
  const result = await docClient.send(
    new ScanCommand({ TableName: MENU_TABLE })
  );
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
    new GetCommand({
      TableName: MENU_TABLE,
      Key: { id },
    })
  );
  return result.Item || null;
}

async function updateMenuItemAvailability(id, available) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: MENU_TABLE,
      Key: { id },
      UpdateExpression: 'SET available = :available',
      ExpressionAttributeValues: { ':available': available },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

module.exports = { getAllMenuItems, getMenuByCategory, getMenuItemById, updateMenuItemAvailability };
