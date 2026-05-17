const addressService = require('../services/address.service');

async function listAddresses(req, res, next) {
  try {
    const addresses = await addressService.getAddresses(req.user.userId);
    res.json({ success: true, data: addresses });
  } catch (err) { next(err); }
}

async function addAddress(req, res, next) {
  try {
    const { label, name, phone, addressLine, isDefault } = req.body;
    if (!name || !phone || !addressLine) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name, phone, and addressLine are required' },
      });
    }
    const address = await addressService.addAddress(req.user.userId, {
      label, name, phone, addressLine, isDefault,
    });
    res.status(201).json({ success: true, data: address });
  } catch (err) { next(err); }
}

async function updateAddress(req, res, next) {
  try {
    const updated = await addressService.updateAddress(
      req.user.userId, req.params.addressId, req.body
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Address not found' },
      });
    }
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

async function deleteAddress(req, res, next) {
  try {
    await addressService.deleteAddress(req.user.userId, req.params.addressId);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
}

module.exports = { listAddresses, addAddress, updateAddress, deleteAddress };
