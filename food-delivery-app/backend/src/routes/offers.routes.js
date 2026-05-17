const { Router } = require('express');
const { validatePromoHandler, listPromosHandler } = require('../controllers/offers.controller');

const router = Router();

router.get('/', listPromosHandler);
router.post('/validate', validatePromoHandler);

module.exports = router;
