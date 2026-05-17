const {
  GetCommand,
  UpdateCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || 'Restaurants';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';
const MENU_TABLE = process.env.MENU_TABLE || 'MenuItems';

async function listRestaurants({ cuisine, status = 'active', isOpen } = {}) {
  const filterParts = ['#status = :status'];
  const expAttrNames = { '#status': 'status' };
  const expAttrValues = { ':status': status };

  if (cuisine) {
    filterParts.push('cuisine = :cuisine');
    expAttrValues[':cuisine'] = cuisine;
  }
  if (isOpen !== undefined) {
    filterParts.push('isOpen = :isOpen');
    expAttrValues[':isOpen'] = isOpen === 'true' || isOpen === true;
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: RESTAURANTS_TABLE,
      FilterExpression: filterParts.join(' AND '),
      ExpressionAttributeNames: expAttrNames,
      ExpressionAttributeValues: expAttrValues,
    })
  );
  return result.Items || [];
}

async function getRestaurantById(restaurantId) {
  const result = await docClient.send(
    new GetCommand({ TableName: RESTAURANTS_TABLE, Key: { restaurantId } })
  );
  return result.Item || null;
}

async function updateRestaurant(restaurantId, updates) {
  const allowedFields = [
    'name', 'description', 'phone', 'address',
    'openingTime', 'closingTime', 'isOpen', 'imageUrl',
  ];
  const now = new Date().toISOString();

  const setParts = ['updatedAt = :now'];
  const expAttrNames = {};
  const expAttrValues = { ':now': now };

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setParts.push(`#${field} = :${field}`);
      expAttrNames[`#${field}`] = field;
      expAttrValues[`:${field}`] = updates[field];
    }
  }

  if (setParts.length === 1) return getRestaurantById(restaurantId);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: RESTAURANTS_TABLE,
      Key: { restaurantId },
      UpdateExpression: `SET ${setParts.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expAttrNames).length ? expAttrNames : undefined,
      ExpressionAttributeValues: expAttrValues,
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

async function getRestaurantOrders(restaurantId, { status } = {}) {
  const filterParts = ['restaurantId = :restaurantId'];
  const expAttrValues = { ':restaurantId': restaurantId };
  const params = { TableName: ORDERS_TABLE, ExpressionAttributeValues: expAttrValues };

  if (status) {
    filterParts.push('#s = :status');
    expAttrValues[':status'] = status;
    params.ExpressionAttributeNames = { '#s': 'status' };
  }

  params.FilterExpression = filterParts.join(' AND ');

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function getRestaurantAnalytics(restaurantId) {
  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) return null;

  const orders = await getRestaurantOrders(restaurantId);
  const completed = orders.filter((o) => o.status === 'Delivered');

  return {
    restaurantId,
    name: restaurant.name,
    totalOrders: orders.length,
    completedOrders: completed.length,
    revenue: parseFloat(completed.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)),
    rating: restaurant.rating || 0,
    isOpen: restaurant.isOpen,
    status: restaurant.status,
  };
}

async function getRestaurantMenuItems(restaurantId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: MENU_TABLE,
      FilterExpression: 'restaurantId = :restaurantId',
      ExpressionAttributeValues: { ':restaurantId': restaurantId },
    })
  );
  return result.Items || [];
}

module.exports = {
  listRestaurants,
  getRestaurantById,
  updateRestaurant,
  getRestaurantOrders,
  getRestaurantAnalytics,
  getRestaurantMenuItems,
};
