process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';

const mockVerify = jest.fn();
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: () => ({ verify: mockVerify }) },
}));

const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/orders.service');
const ordersService = require('../src/services/orders.service');

jest.mock('../src/websocket/push', () => ({
  pushToRestaurant: jest.fn().mockResolvedValue(undefined),
  pushToUser: jest.fn().mockResolvedValue(undefined),
}));

const CUSTOMER_TOKEN = 'customer-token';
const RESTAURANT_TOKEN = 'restaurant-token';

const customerPayload = {
  sub: 'cust-001',
  email: 'customer@test.com',
  'custom:role': 'customer',
  'custom:restaurantId': null,
};

const restaurantPayload = {
  sub: 'rest-owner-001',
  email: 'owner@test.com',
  'custom:role': 'restaurant',
  'custom:restaurantId': 'rest-001',
};

mockVerify.mockImplementation((token) => {
  if (token === CUSTOMER_TOKEN) return Promise.resolve(customerPayload);
  if (token === RESTAURANT_TOKEN) return Promise.resolve(restaurantPayload);
  return Promise.reject(new Error('Invalid token'));
});

const validOrderPayload = {
  customerName: 'John Doe',
  phone: '9876543210',
  address: '123 Main Street, Mumbai, Maharashtra 400001',
  restaurantId: 'ddb6d8ad-c007-4fff-8d62-3f13064d4725',
  items: [{ menuItemId: 'item-001', quantity: 2, name: 'Margherita', price: 12.99 }],
};

const mockOrder = {
  orderId: 'order-abc-123',
  customerId: 'cust-001',
  customerName: 'John Doe',
  phone: '9876543210',
  address: '123 Main Street, Mumbai, Maharashtra 400001',
  restaurantId: 'rest-001',
  items: validOrderPayload.items,
  total: 25.98,
  status: 'Order Received',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  statusHistory: [
    {
      status: 'Order Received',
      timestamp: new Date().toISOString(),
      message: "We've received your order and confirming with the restaurant",
    },
  ],
};

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockImplementation((token) => {
      if (token === CUSTOMER_TOKEN) return Promise.resolve(customerPayload);
      if (token === RESTAURANT_TOKEN) return Promise.resolve(restaurantPayload);
      return Promise.reject(new Error('Invalid token'));
    });
  });

  describe('POST /api/orders', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).post('/api/orders').send(validOrderPayload);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when restaurant role tries to place order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${RESTAURANT_TOKEN}`)
        .send(validOrderPayload);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 201 with orderId and status "Order Received" for valid customer order', async () => {
      ordersService.createOrder.mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
        .send(validOrderPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe('order-abc-123');
      expect(res.body.data.status).toBe('Order Received');
      expect(Array.isArray(res.body.data.statusHistory)).toBe(true);
    });

    it('should return 400 validation error when customerName is missing', async () => {
      const payload = { ...validOrderPayload };
      delete payload.customerName;

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('should return 400 validation error when items array is empty', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
        .send({ ...validOrderPayload, items: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 validation error when phone number is invalid', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
        .send({ ...validOrderPayload, phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/orders/my', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/orders/my');
      expect(res.status).toBe(401);
    });

    it('should return 200 with customer orders when authenticated', async () => {
      ordersService.getOrdersByCustomer.mockResolvedValue([mockOrder]);

      const res = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should return order with full statusHistory (public endpoint)', async () => {
      ordersService.getOrderById.mockResolvedValue(mockOrder);

      const res = await request(app).get('/api/orders/order-abc-123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe('order-abc-123');
      expect(Array.isArray(res.body.data.statusHistory)).toBe(true);
      expect(res.body.data.statusHistory.length).toBeGreaterThan(0);
    });

    it('should return 404 when orderId does not exist', async () => {
      ordersService.getOrderById.mockResolvedValue(null);

      const res = await request(app).get('/api/orders/nonexistent-order');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/orders/:orderId/status', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .patch('/api/orders/order-abc-123/status')
        .send({ status: 'Preparing' });
      expect(res.status).toBe(401);
    });

    it('should return 403 when customer tries to update status', async () => {
      const res = await request(app)
        .patch('/api/orders/order-abc-123/status')
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
        .send({ status: 'Preparing' });
      expect(res.status).toBe(403);
    });

    it('should update order status when restaurant role is used', async () => {
      const updatedOrder = { ...mockOrder, status: 'Preparing' };
      ordersService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const res = await request(app)
        .patch('/api/orders/order-abc-123/status')
        .set('Authorization', `Bearer ${RESTAURANT_TOKEN}`)
        .send({ status: 'Preparing' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Preparing');
    });
  });
});
