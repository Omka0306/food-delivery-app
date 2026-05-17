const restaurantService = require('../services/restaurant.service');
const ordersService = require('../services/orders.service');

async function listRestaurants(req, res, next) {
  try {
    const { cuisine, status, isOpen } = req.query;
    const restaurants = await restaurantService.listRestaurants({ cuisine, status, isOpen });
    res.json({ success: true, data: restaurants });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantById(req, res, next) {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Restaurant not found' },
      });
    }
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
}

async function updateRestaurant(req, res, next) {
  try {
    const updated = await restaurantService.updateRestaurant(
      req.params.restaurantId,
      req.body
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantOrders(req, res, next) {
  try {
    const { status } = req.query;
    const orders = await restaurantService.getRestaurantOrders(req.params.restaurantId, {
      status,
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatusByRestaurant(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const VALID_TRANSITIONS = ['Preparing', 'Out for Delivery', 'Delivered'];
    if (!VALID_TRANSITIONS.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid status. Must be one of: ${VALID_TRANSITIONS.join(', ')}`,
        },
      });
    }

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

async function getRestaurantAnalytics(req, res, next) {
  try {
    const analytics = await restaurantService.getRestaurantAnalytics(req.params.restaurantId);
    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Restaurant not found' },
      });
    }
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantMenuItems(req, res, next) {
  try {
    const items = await restaurantService.getRestaurantMenuItems(req.params.restaurantId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRestaurants,
  getRestaurantById,
  updateRestaurant,
  getRestaurantOrders,
  updateOrderStatusByRestaurant,
  getRestaurantAnalytics,
  getRestaurantMenuItems,
};
