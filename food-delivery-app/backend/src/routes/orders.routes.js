const { Router } = require('express');
const {
  createOrder,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
} = require('../controllers/orders.controller');
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const { createOrderSchema, updateStatusSchema } = require('../validators/order.validator');

const router = Router();

router.post('/', verifyToken, requireRole('customer'), validate(createOrderSchema), createOrder);
router.get('/my', verifyToken, getMyOrders);
router.get('/:orderId', getOrderById);
router.patch(
  '/:orderId/status',
  verifyToken,
  requireRole('restaurant', 'admin'),
  validate(updateStatusSchema),
  updateOrderStatus
);

module.exports = router;
