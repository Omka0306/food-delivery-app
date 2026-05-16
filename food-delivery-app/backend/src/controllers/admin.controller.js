const adminService = require('../services/admin.service');

async function listUsers(req, res, next) {
  try {
    const users = await adminService.listAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const { status } = req.query;
    const orders = await adminService.listAllOrders({ status });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

async function approveRestaurant(req, res, next) {
  try {
    const restaurant = await adminService.setRestaurantStatus(
      req.params.restaurantId,
      'active'
    );
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
}

async function suspendRestaurant(req, res, next) {
  try {
    const restaurant = await adminService.setRestaurantStatus(
      req.params.restaurantId,
      'suspended'
    );
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const analytics = await adminService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, listOrders, approveRestaurant, suspendRestaurant, getAnalytics };
