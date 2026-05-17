const { Router } = require('express');
const { getMenu, getMenuItemById } = require('../controllers/menu.controller');

const router = Router();

router.get('/', getMenu);
router.get('/:id', getMenuItemById);

module.exports = router;
