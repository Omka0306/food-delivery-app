const { Router } = require('express');
const {
  register,
  registerRestaurant,
  verify,
  login,
  refresh,
  logout,
  resendVerification,
  getMe,
  updateProfile,
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  registerRestaurantSchema,
  verifySchema,
  loginSchema,
  refreshSchema,
  resendVerificationSchema,
} = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/register/restaurant', validate(registerRestaurantSchema), registerRestaurant);
router.post('/verify', validate(verifySchema), verify);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.patch('/profile', verifyToken, updateProfile);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

module.exports = router;
