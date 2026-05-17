const ordersService = require('../services/orders.service');

async function createOrder(req, res, next) {
  try {
    const order = await ordersService.createOrder({
      ...req.body,
      customerId: req.user.userId,
    });
    res.status(201).json({ success: true, data: order, message: 'Order placed successfully' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: 'ORDER_VALIDATION_ERROR', message: err.message },
      });
    }
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await ordersService.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const updated = await ordersService.updateOrderStatus(orderId, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await ordersService.getOrdersByCustomer(req.user.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrderById, updateOrderStatus, getMyOrders };
