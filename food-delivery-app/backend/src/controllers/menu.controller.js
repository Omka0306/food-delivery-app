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

module.exports = { getMenu, getMenuItemById };
