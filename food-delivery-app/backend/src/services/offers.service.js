const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';

const PROMOS = {
  SAVE10:   { type: 'percent', value: 10, maxDiscount: 100, minOrder: 0,   description: '10% off your order (up to ₹100)' },
  FLAT50:   { type: 'flat',    value: 50,                   minOrder: 200, description: '₹50 off on orders ₹200+' },
  WELCOME:  { type: 'percent', value: 15, maxDiscount: 150, minOrder: 0,   description: '15% off — welcome gift (first order only)' },
  FREESHIP: { type: 'delivery', value: 40,                  minOrder: 0,   description: 'Free delivery on this order' },
  LOYALTY5: { type: 'flat',    value: 100,                  minOrder: 0,   description: '₹100 loyalty reward (unlocked after 5 orders)' },
};

async function getCustomerOrderCount(customerId) {
  if (!customerId) return 0;
  const result = await docClient.send(
    new ScanCommand({
      TableName: ORDERS_TABLE,
      FilterExpression: 'customerId = :cid',
      ExpressionAttributeValues: { ':cid': customerId },
      Select: 'COUNT',
    })
  );
  return result.Count || 0;
}

async function validatePromo(code, subtotal, customerId) {
  const upper = code?.toUpperCase();
  const promo = PROMOS[upper];
  if (!promo) {
    const err = new Error('Invalid promo code');
    err.statusCode = 400;
    throw err;
  }
  if (subtotal < promo.minOrder) {
    const err = new Error(`Minimum order of ₹${promo.minOrder} required for this code`);
    err.statusCode = 400;
    throw err;
  }

  if (upper === 'WELCOME') {
    const count = await getCustomerOrderCount(customerId);
    if (count > 0) {
      const err = new Error('WELCOME is valid for first-time orders only');
      err.statusCode = 400;
      throw err;
    }
  }

  if (upper === 'LOYALTY5') {
    if (!customerId) {
      const err = new Error('Please log in to use the loyalty reward');
      err.statusCode = 400;
      throw err;
    }
    const count = await getCustomerOrderCount(customerId);
    if (count < 5) {
      const err = new Error(`You need at least 5 orders for this reward (you have ${count})`);
      err.statusCode = 400;
      throw err;
    }
  }

  let discount = 0;
  let freeDelivery = false;

  if (promo.type === 'percent') {
    discount = subtotal * promo.value / 100;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    discount = parseFloat(discount.toFixed(2));
  } else if (promo.type === 'flat') {
    discount = parseFloat(Math.min(promo.value, subtotal).toFixed(2));
  } else if (promo.type === 'delivery') {
    freeDelivery = true;
  }

  return { code: upper, discount, freeDelivery, description: promo.description, type: promo.type };
}

function listPromos() {
  return Object.entries(PROMOS).map(([code, p]) => ({
    code,
    description: p.description,
    minOrder: p.minOrder,
    type: p.type,
  }));
}

module.exports = { validatePromo, listPromos };
