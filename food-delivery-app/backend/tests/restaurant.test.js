process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';

const mockVerify = jest.fn();
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: () => ({ verify: mockVerify }) },
}));

jest.mock('../src/services/restaurant.service');
jest.mock('../src/services/orders.service');

const request = require('supertest');
const app = require('../src/app');
const restaurantService = require('../src/services/restaurant.service');

const CUSTOMER_TOKEN = 'customer-token';
const OWNER_TOKEN = 'owner-token';
const ADMIN_TOKEN = 'admin-token';
const RESTAURANT_ID = 'rest-001';

const customerPayload = {
  sub: 'cust-001',
  email: 'customer@test.com',
  'custom:role': 'customer',
  'custom:restaurantId': null,
};
const ownerPayload = {
  sub: 'owner-001',
  email: 'owner@test.com',
  'custom:role': 'restaurant',
  'custom:restaurantId': RESTAURANT_ID,
};
const adminPayload = {
  sub: 'admin-001',
  email: 'admin@test.com',
  'custom:role': 'admin',
  'custom:restaurantId': null,
};

const mockRestaurant = {
  restaurantId: RESTAURANT_ID,
  name: 'The Burger Lab',
  cuisine: 'American',
  address: '12 MG Road, Bengaluru',
  status: 'active',
  isOpen: true,
  rating: 4.7,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockImplementation((token) => {
    if (token === CUSTOMER_TOKEN) return Promise.resolve(customerPayload);
    if (token === OWNER_TOKEN) return Promise.resolve(ownerPayload);
    if (token === ADMIN_TOKEN) return Promise.resolve(adminPayload);
    return Promise.reject(new Error('Invalid token'));
  });
});

describe('Restaurants API', () => {
  describe('GET /api/restaurants', () => {
    it('should return 200 with array of active restaurants (public)', async () => {
      restaurantService.listRestaurants.mockResolvedValue([mockRestaurant]);

      const res = await request(app).get('/api/restaurants');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].restaurantId).toBe(RESTAURANT_ID);
    });
  });

  describe('GET /api/restaurants/:restaurantId', () => {
    it('should return 200 with restaurant details (public)', async () => {
      restaurantService.getRestaurantById.mockResolvedValue(mockRestaurant);

      const res = await request(app).get(`/api/restaurants/${RESTAURANT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('The Burger Lab');
    });

    it('should return 404 when restaurant does not exist', async () => {
      restaurantService.getRestaurantById.mockResolvedValue(null);

      const res = await request(app).get('/api/restaurants/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/restaurants/:restaurantId', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .patch(`/api/restaurants/${RESTAURANT_ID}`)
        .send({ isOpen: false });
      expect(res.status).toBe(401);
    });

    it('should return 403 when customer tries to update restaurant', async () => {
      const res = await request(app)
        .patch(`/api/restaurants/${RESTAURANT_ID}`)
        .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
        .send({ isOpen: false });
      expect(res.status).toBe(403);
    });

    it('should return 200 when restaurant owner updates own restaurant', async () => {
      const updated = { ...mockRestaurant, isOpen: false };
      restaurantService.updateRestaurant.mockResolvedValue(updated);

      const res = await request(app)
        .patch(`/api/restaurants/${RESTAURANT_ID}`)
        .set('Authorization', `Bearer ${OWNER_TOKEN}`)
        .send({ isOpen: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isOpen).toBe(false);
    });

    it('should return 200 when admin updates any restaurant', async () => {
      const updated = { ...mockRestaurant, isOpen: false };
      restaurantService.updateRestaurant.mockResolvedValue(updated);

      const res = await request(app)
        .patch(`/api/restaurants/${RESTAURANT_ID}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ isOpen: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/restaurants/:restaurantId/orders', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get(`/api/restaurants/${RESTAURANT_ID}/orders`);
      expect(res.status).toBe(401);
    });

    it('should return 403 when another restaurant tries to access orders', async () => {
      const otherOwner = {
        ...ownerPayload,
        'custom:restaurantId': 'rest-999',
      };
      mockVerify.mockResolvedValueOnce(otherOwner);

      const res = await request(app)
        .get(`/api/restaurants/${RESTAURANT_ID}/orders`)
        .set('Authorization', `Bearer ${OWNER_TOKEN}`);

      expect(res.status).toBe(403);
    });

    it('should return 200 with orders when restaurant owner requests own orders', async () => {
      restaurantService.getRestaurantOrders.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/restaurants/${RESTAURANT_ID}/orders`)
        .set('Authorization', `Bearer ${OWNER_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/restaurants/:restaurantId/analytics', () => {
    it('should return 200 with analytics for restaurant owner', async () => {
      restaurantService.getRestaurantAnalytics.mockResolvedValue({
        restaurantId: RESTAURANT_ID,
        totalOrders: 10,
        completedOrders: 8,
        revenue: 500.0,
        rating: 4.7,
      });

      const res = await request(app)
        .get(`/api/restaurants/${RESTAURANT_ID}/analytics`)
        .set('Authorization', `Bearer ${OWNER_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalOrders).toBe(10);
    });
  });
});
