const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { createReview, getItemReviews, getRestaurantReviews, getOrderReviews } = require('../controllers/reviews.controller');

// POST /api/reviews — authenticated customer creates a review
router.post('/', verifyToken, createReview);

// GET /api/reviews/menu/:itemId — public, reviews for one menu item
router.get('/menu/:itemId', getItemReviews);

// GET /api/reviews/restaurant/:restaurantId — public, all reviews for a restaurant
router.get('/restaurant/:restaurantId', getRestaurantReviews);

// GET /api/reviews/order/:orderId — authenticated, check if order has reviews
router.get('/order/:orderId', verifyToken, getOrderReviews);

module.exports = router;
