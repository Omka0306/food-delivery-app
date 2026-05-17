const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || 'Restaurants';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || 'UserProfiles';

async function listAllUsers() {
  const result = await docClient.send(new ScanCommand({ TableName: USER_PROFILES_TABLE }));
  return result.Items || [];
}

async function listAllOrders({ status } = {}) {
  const params = { TableName: ORDERS_TABLE };
  if (status) {
    params.FilterExpression = '#s = :status';
    params.ExpressionAttributeNames = { '#s': 'status' };
    params.ExpressionAttributeValues = { ':status': status };
  }
  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function setRestaurantStatus(restaurantId, newStatus) {
  const now = new Date().toISOString();
  const result = await docClient.send(
    new UpdateCommand({
      TableName: RESTAURANTS_TABLE,
      Key: { restaurantId },
      UpdateExpression: 'SET #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': newStatus, ':now': now },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

async function getAnalytics() {
  const [usersResult, restaurantsResult, ordersResult] = await Promise.all([
    docClient.send(new ScanCommand({ TableName: USER_PROFILES_TABLE })),
    docClient.send(new ScanCommand({ TableName: RESTAURANTS_TABLE })),
    docClient.send(new ScanCommand({ TableName: ORDERS_TABLE })),
  ]);

  const orders = ordersResult.Items || [];
  const delivered = orders.filter((o) => o.status === 'Delivered');

  return {
    totalUsers: (usersResult.Items || []).length,
    totalRestaurants: (restaurantsResult.Items || []).length,
    activeRestaurants: (restaurantsResult.Items || []).filter((r) => r.status === 'active').length,
    pendingRestaurants: (restaurantsResult.Items || []).filter((r) => r.status === 'pending').length,
    totalOrders: orders.length,
    completedOrders: delivered.length,
    totalRevenue: parseFloat(
      delivered.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)
    ),
  };
}

module.exports = { listAllUsers, listAllOrders, setRestaurantStatus, getAnalytics };
