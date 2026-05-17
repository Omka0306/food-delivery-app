const offersService = require('../services/offers.service');

async function validatePromoHandler(req, res, next) {
  try {
    const { code, subtotal, customerId } = req.body;
    if (!code || subtotal === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code and subtotal are required' },
      });
    }
    const result = await offersService.validatePromo(
      code,
      parseFloat(subtotal),
      customerId || null
    );
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: 'PROMO_ERROR', message: err.message },
      });
    }
    next(err);
  }
}

function listPromosHandler(_req, res) {
  res.json({ success: true, data: offersService.listPromos() });
}

module.exports = { validatePromoHandler, listPromosHandler };
