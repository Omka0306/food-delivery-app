const reviewsService = require('../services/reviews.service');

async function createReview(req, res, next) {
  try {
    const { menuItemId, restaurantId, orderId, rating, comment } = req.body;
    if (!menuItemId || !restaurantId || !rating) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'menuItemId, restaurantId, and rating are required' },
      });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' },
      });
    }
    const review = await reviewsService.createReview({
      menuItemId,
      restaurantId,
      orderId: orderId || null,
      customerId: req.user.userId,
      customerName: req.user.name || req.user.email,
      rating: Number(rating),
      comment: comment || '',
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

async function getItemReviews(req, res, next) {
  try {
    const reviews = await reviewsService.getReviewsByMenuItem(req.params.itemId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantReviews(req, res, next) {
  try {
    const reviews = await reviewsService.getReviewsByRestaurant(req.params.restaurantId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

async function getOrderReviews(req, res, next) {
  try {
    const reviews = await reviewsService.getReviewsByOrder(req.params.orderId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getItemReviews, getRestaurantReviews, getOrderReviews };
