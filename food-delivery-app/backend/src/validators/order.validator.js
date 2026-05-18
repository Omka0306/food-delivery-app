const Joi = require('joi');

const orderItemSchema = Joi.object({
  menuItemId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(20).required(),
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
});

const createOrderSchema = Joi.object({
  customerName: Joi.string().min(2).max(50).required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a 10-digit number',
    }),
  address: Joi.string().min(10).max(200).required(),
  customerId: Joi.string().optional(),
  restaurantId: Joi.string().uuid().optional(),
  promoCode: Joi.string().uppercase().optional(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Order Received', 'Preparing', 'Out for Delivery', 'Delivered')
    .required(),
});

module.exports = { createOrderSchema, updateStatusSchema };
