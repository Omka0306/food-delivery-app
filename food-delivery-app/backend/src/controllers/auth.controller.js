const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function registerRestaurant(req, res, next) {
  try {
    const result = await authService.registerRestaurant(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const result = await authService.verify(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const accessToken = req.headers.authorization?.slice(7);
    const result = await authService.logout({ accessToken });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const result = await authService.resendVerification(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const profile = await authService.getMe(req.user.userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
    }
    res.json({ success: true, data: { ...profile, ...req.user } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  registerRestaurant,
  verify,
  login,
  refresh,
  logout,
  resendVerification,
  getMe,
};
