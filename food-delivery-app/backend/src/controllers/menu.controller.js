const menuService = require('../services/menu.service');

async function getMenu(req, res, next) {
  try {
    const { category } = req.query;
    const items = category
      ? await menuService.getMenuByCategory(category)
      : await menuService.getAllMenuItems();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

async function getMenuItemById(req, res, next) {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu item not found' },
      });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function toggleMenuItemAvailability(req, res, next) {
  try {
    const { itemId } = req.params;
    const { available } = req.body;
    if (typeof available !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '`available` must be a boolean' },
      });
    }
    const updated = await menuService.updateMenuItemAvailability(itemId, available);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function createMenuItemForRestaurant(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, category, imageUrl, isVeg, prepTime } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name, price, and category are required' },
      });
    }

    const VALID_CATEGORIES = ['Pizza', 'Burgers', 'Sides', 'Drinks'];
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      });
    }

    const item = await menuService.createMenuItem({
      restaurantId,
      name,
      description,
      price,
      category,
      imageUrl,
      isVeg,
      prepTime,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function updateMenuItemForRestaurant(req, res, next) {
  try {
    const { itemId } = req.params;
    const updated = await menuService.updateMenuItem(itemId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteMenuItemForRestaurant(req, res, next) {
  try {
    const { itemId } = req.params;
    await menuService.deleteMenuItem(itemId);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMenu,
  getMenuItemById,
  toggleMenuItemAvailability,
  createMenuItemForRestaurant,
  updateMenuItemForRestaurant,
  deleteMenuItemForRestaurant,
};
