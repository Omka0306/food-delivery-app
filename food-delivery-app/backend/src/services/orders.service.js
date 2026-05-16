const { PutCommand, GetCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');
const { pushToRestaurant, pushToUser } = require('../websocket/push');
const { v4: uuidv4 } = require('uuid');

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';

const STATUS_MESSAGES = {
  'Order Received': "We've received your order and confirming with the restaurant",
  Preparing: 'The restaurant is preparing your delicious food',
  'Out for Delivery': 'Your order is on its way!',
  Delivered: 'Your food has been delivered. Enjoy your meal!',
};

async function updateOrderStatus(orderId, status) {
  const now = new Date().toISOString();
  const historyEntry = {
    status,
    timestamp: now,
    message: STATUS_MESSAGES[status] || status,
  };

  const result = await docClient.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression:
        'SET #s = :status, updatedAt = :now, statusHistory = list_append(statusHistory, :entry)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':now': now,
        ':entry': [historyEntry],
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  const order = result.Attributes;
  if (order) {
    await pushToUser(order.customerId, { type: 'ORDER_STATUS_UPDATE', order });
  }

  return order;
}

async function createOrder(orderData) {
  const orderId = uuidv4();
  const now = new Date().toISOString();

  const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const initialStatus = 'Order Received';
  const order = {
    orderId,
    customerId: orderData.customerId || null,
    customerName: orderData.customerName,
    phone: orderData.phone,
    address: orderData.address,
    restaurantId: orderData.restaurantId || null,
    items: orderData.items,
    total: parseFloat(total.toFixed(2)),
    status: initialStatus,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: now,
        message: STATUS_MESSAGES[initialStatus],
      },
    ],
  };

  await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));

  await pushToRestaurant(order.restaurantId, { type: 'NEW_ORDER', order });

  return order;
}

async function getOrderById(orderId) {
  const result = await docClient.send(
    new GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } })
  );
  return result.Item || null;
}

async function getOrdersByCustomer(customerId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: ORDERS_TABLE,
      FilterExpression: 'customerId = :customerId',
      ExpressionAttributeValues: { ':customerId': customerId },
    })
  );
  return (result.Items || []).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

module.exports = { createOrder, getOrderById, updateOrderStatus, getOrdersByCustomer };
