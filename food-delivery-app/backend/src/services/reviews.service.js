const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const TABLE = process.env.REVIEWS_TABLE || 'Reviews';

async function createReview({ menuItemId, restaurantId, orderId, customerId, customerName, rating, comment }) {
  const reviewId = uuidv4();
  const now = new Date().toISOString();
  const review = {
    reviewId,
    menuItemId,
    restaurantId,
    orderId: orderId || null,
    customerId,
    customerName,
    rating: Number(rating),
    comment: comment || '',
    createdAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: review }));
  return review;
}

async function getReviewsByMenuItem(menuItemId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'menuItemId = :mid',
      ExpressionAttributeValues: { ':mid': menuItemId },
    })
  );
  return (result.Items || []).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

async function getReviewsByRestaurant(restaurantId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'restaurantId = :rid',
      ExpressionAttributeValues: { ':rid': restaurantId },
    })
  );
  return (result.Items || []).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

async function getReviewsByOrder(orderId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'orderId = :oid',
      ExpressionAttributeValues: { ':oid': orderId },
    })
  );
  return result.Items || [];
}

module.exports = { createReview, getReviewsByMenuItem, getReviewsByRestaurant, getReviewsByOrder };
