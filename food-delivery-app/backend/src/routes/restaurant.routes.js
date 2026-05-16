const { Router } = require('express');
const {
  listRestaurants,
  getRestaurantById,
  updateRestaurant,
  getRestaurantOrders,
  updateOrderStatusByRestaurant,
  getRestaurantAnalytics,
  getRestaurantMenuItems,
} = require('../controllers/restaurant.controller');
const { verifyToken, requireRestaurantOwner } = require('../middleware/auth');

const router = Router();

router.get('/', listRestaurants);
router.get('/:restaurantId', getRestaurantById);
router.get('/:restaurantId/menu', getRestaurantMenuItems);
router.patch('/:restaurantId', verifyToken, requireRestaurantOwner, updateRestaurant);
router.get(
  '/:restaurantId/orders',
  verifyToken,
  requireRestaurantOwner,
  getRestaurantOrders
);
router.patch(
  '/:restaurantId/orders/:orderId/status',
  verifyToken,
  requireRestaurantOwner,
  updateOrderStatusByRestaurant
);
router.get(
  '/:restaurantId/analytics',
  verifyToken,
  requireRestaurantOwner,
  getRestaurantAnalytics
);

module.exports = router;
