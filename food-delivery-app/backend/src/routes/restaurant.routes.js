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
const {
  toggleMenuItemAvailability,
  createMenuItemForRestaurant,
  updateMenuItemForRestaurant,
  deleteMenuItemForRestaurant,
} = require('../controllers/menu.controller');
const { verifyToken, requireRestaurantOwner } = require('../middleware/auth');

const router = Router();

// Public
router.get('/', listRestaurants);
router.get('/:restaurantId', getRestaurantById);
router.get('/:restaurantId/menu', getRestaurantMenuItems);

// Restaurant owner — menu CRUD
router.post(
  '/:restaurantId/menu',
  verifyToken, requireRestaurantOwner,
  createMenuItemForRestaurant
);
router.patch(
  '/:restaurantId/menu/:itemId/availability',
  verifyToken, requireRestaurantOwner,
  toggleMenuItemAvailability
);
router.patch(
  '/:restaurantId/menu/:itemId',
  verifyToken, requireRestaurantOwner,
  updateMenuItemForRestaurant
);
router.delete(
  '/:restaurantId/menu/:itemId',
  verifyToken, requireRestaurantOwner,
  deleteMenuItemForRestaurant
);

// Restaurant owner — settings & orders
router.patch('/:restaurantId', verifyToken, requireRestaurantOwner, updateRestaurant);
router.get('/:restaurantId/orders', verifyToken, requireRestaurantOwner, getRestaurantOrders);
router.patch(
  '/:restaurantId/orders/:orderId/status',
  verifyToken, requireRestaurantOwner,
  updateOrderStatusByRestaurant
);
router.get('/:restaurantId/analytics', verifyToken, requireRestaurantOwner, getRestaurantAnalytics);

module.exports = router;
