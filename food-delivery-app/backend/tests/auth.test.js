process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';

const mockVerify = jest.fn();
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: () => ({ verify: mockVerify }) },
}));

jest.mock('../src/services/auth.service');

const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/auth.service');

const VALID_TOKEN = 'valid-id-token';
const customerPayload = {
  sub: 'user-001',
  email: 'user@test.com',
  name: 'Test User',
  'custom:role': 'customer',
  'custom:restaurantId': null,
};

beforeAll(() => {
  mockVerify.mockImplementation((token) => {
    if (token === VALID_TOKEN) return Promise.resolve(customerPayload);
    return Promise.reject(new Error('Invalid token'));
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockImplementation((token) => {
    if (token === VALID_TOKEN) return Promise.resolve(customerPayload);
    return Promise.reject(new Error('Invalid token'));
  });
});

const validRegisterPayload = {
  email: 'newuser@test.com',
  password: 'Password1',
  name: 'New User',
  phone: '9876543210',
};

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should return 201 on successful registration', async () => {
      authService.register.mockResolvedValue({
        message: 'Registration successful. Check your email for a verification code.',
      });

      const res = await request(app).post('/api/auth/register').send(validRegisterPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/verification/i);
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterPayload, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when password is too weak', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterPayload, password: 'weak' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when phone is not 10 digits', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterPayload, phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should return 200 on successful verification', async () => {
      authService.verify.mockResolvedValue({
        message: 'Email verified successfully. You can now log in.',
      });

      const res = await request(app)
        .post('/api/auth/verify')
        .send({ email: 'user@test.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/verified/i);
    });

    it('should return 400 when code is not 6 digits', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .send({ email: 'user@test.com', code: '12' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with tokens on valid credentials', async () => {
      authService.login.mockResolvedValue({
        idToken: 'id-token-xyz',
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'Password1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.idToken).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password1' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 with user profile when authenticated', async () => {
      authService.getMe.mockResolvedValue({
        userId: 'user-001',
        email: 'user@test.com',
        name: 'Test User',
        role: 'customer',
        phone: '9876543210',
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('user@test.com');
      expect(res.body.data.role).toBe('customer');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should return 200 on valid email', async () => {
      authService.resendVerification.mockResolvedValue({ message: 'Verification code resent.' });

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
