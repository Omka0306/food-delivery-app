const { PutCommand, GetCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');
const { pushToRestaurant, pushToUser } = require('../websocket/push');
const menuService = require('./menu.service');
const { v4: uuidv4 } = require('uuid');

const GST_RATE = 0.05;          // 5%
const PLATFORM_FEE = 10;        // ₹10 flat
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 40;

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';

const STATUS_MESSAGES = {
  'Order Received': "We've received your order and confirming with the restaurant",
  Preparing:        'The restaurant is preparing your delicious food',
  'Out for Delivery': 'Your order is on its way!',
  Delivered:        'Your food has been delivered. Enjoy your meal!',
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
  const { items, restaurantId: clientRestaurantId } = orderData;

  // ── Validate every item exists and all belong to the same restaurant ──────
  const resolvedItems = await Promise.all(
    items.map(async (item) => {
      const menuItem = await menuService.getMenuItemById(item.menuItemId);
      if (!menuItem) {
        const err = new Error(`Menu item "${item.name || item.menuItemId}" not found`);
        err.statusCode = 404;
        throw err;
      }
      if (menuItem.available === false) {
        const err = new Error(`"${menuItem.name}" is currently unavailable`);
        err.statusCode = 400;
        throw err;
      }
      return { ...item, restaurantId: menuItem.restaurantId };
    })
  );

  // Derive the authoritative restaurantId from the menu items themselves
  const restaurantIds = [...new Set(resolvedItems.map((i) => i.restaurantId))];
  if (restaurantIds.length > 1) {
    const err = new Error('All items in an order must be from the same restaurant');
    err.statusCode = 400;
    throw err;
  }

  const restaurantId = restaurantIds[0] || clientRestaurantId || null;

  // If the client sent a restaurantId, it must match what DynamoDB says
  if (clientRestaurantId && restaurantId && clientRestaurantId !== restaurantId) {
    const err = new Error('Order restaurant does not match item restaurant');
    err.statusCode = 400;
    throw err;
  }

  const orderId = uuidv4();
  const now     = new Date().toISOString();

  const subtotal    = parseFloat(items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));
  const gst         = parseFloat((subtotal * GST_RATE).toFixed(2));
  const platformFee = PLATFORM_FEE;

  // Apply promo code if provided
  let discount    = 0;
  let freeDelivery = false;
  let promoCode   = null;
  if (orderData.promoCode) {
    try {
      const offersService = require('./offers.service');
      const promo = await offersService.validatePromo(
        orderData.promoCode, subtotal, orderData.customerId
      );
      discount     = promo.discount;
      freeDelivery = promo.freeDelivery;
      promoCode    = promo.code;
    } catch (_) { /* invalid promo — ignore, don't block the order */ }
  }

  const deliveryFee = freeDelivery || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total       = parseFloat((subtotal + gst + platformFee + deliveryFee - discount).toFixed(2));

  const pricing = { subtotal, gst, platformFee, deliveryFee, discount, total };

  const initialStatus = 'Order Received';
  const order = {
    orderId,
    customerId:   orderData.customerId || null,
    customerName: orderData.customerName,
    phone:        orderData.phone,
    address:      orderData.address,
    restaurantId,
    items,
    pricing,
    total,
    promoCode,
    status: initialStatus,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      { status: initialStatus, timestamp: now, message: STATUS_MESSAGES[initialStatus] },
    ],
  };

  await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));
  await pushToRestaurant(restaurantId, { type: 'NEW_ORDER', order });

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
