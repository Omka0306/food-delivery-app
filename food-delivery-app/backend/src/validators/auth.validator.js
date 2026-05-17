const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one {{#name}} letter',
    }),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone must be a 10-digit number',
  }),
  role: Joi.string().valid('customer').default('customer'),
});

const registerRestaurantSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  restaurantName: Joi.string().min(2).max(100).required(),
  cuisine: Joi.string().min(2).max(50).required(),
  address: Joi.string().min(10).max(200).required(),
  description: Joi.string().max(500).optional(),
});

const verifySchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = {
  registerSchema,
  registerRestaurantSchema,
  verifySchema,
  loginSchema,
  refreshSchema,
  resendVerificationSchema,
};
