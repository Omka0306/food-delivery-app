const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { listAddresses, addAddress, updateAddress, deleteAddress } = require('../controllers/address.controller');

router.use(verifyToken); // all address routes require auth

router.get('/', listAddresses);
router.post('/', addAddress);
router.patch('/:addressId', updateAddress);
router.delete('/:addressId', deleteAddress);

module.exports = router;
