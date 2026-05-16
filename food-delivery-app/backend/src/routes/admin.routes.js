const { Router } = require('express');
const {
  listUsers,
  listOrders,
  approveRestaurant,
  suspendRestaurant,
  getAnalytics,
} = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.use(verifyToken, requireRole('admin'));

router.get('/users', listUsers);
router.get('/orders', listOrders);
router.patch('/restaurants/:restaurantId/approve', approveRestaurant);
router.patch('/restaurants/:restaurantId/suspend', suspendRestaurant);
router.get('/analytics', getAnalytics);

module.exports = router;
