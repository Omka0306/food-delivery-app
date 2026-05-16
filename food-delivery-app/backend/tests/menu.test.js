const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/menu.service');
const menuService = require('../src/services/menu.service');

const mockMenuItems = [
  {
    id: 'item-001',
    name: 'Margherita',
    description: 'Classic tomato and mozzarella pizza. Simple and delicious.',
    price: 12.99,
    category: 'Pizza',
    imageUrl: 'https://source.unsplash.com/400x300/?margherita',
    available: true,
    rating: 4.5,
    prepTime: '10-15 mins',
  },
  {
    id: 'item-002',
    name: 'Pepperoni',
    description: 'Loaded with spicy pepperoni slices. A crowd favourite.',
    price: 14.99,
    category: 'Pizza',
    imageUrl: 'https://source.unsplash.com/400x300/?pepperoni',
    available: true,
    rating: 4.7,
    prepTime: '10-15 mins',
  },
  {
    id: 'item-003',
    name: 'Classic Smash',
    description: 'Juicy smashed beef patty with lettuce and tomato. A classic done right.',
    price: 9.99,
    category: 'Burgers',
    imageUrl: 'https://source.unsplash.com/400x300/?burger',
    available: true,
    rating: 4.6,
    prepTime: '10-15 mins',
  },
];

describe('Menu API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/menu', () => {
    it('should return 200 with an array of all menu items', async () => {
      menuService.getAllMenuItems.mockResolvedValue(mockMenuItems);

      const res = await request(app).get('/api/menu');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(3);
    });

    it('should return only Pizza items when ?category=Pizza is provided', async () => {
      const pizzaItems = mockMenuItems.filter((i) => i.category === 'Pizza');
      menuService.getMenuByCategory.mockResolvedValue(pizzaItems);

      const res = await request(app).get('/api/menu?category=Pizza');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      res.body.data.forEach((item) => {
        expect(item.category).toBe('Pizza');
      });
    });
  });

  describe('GET /api/menu/:id', () => {
    it('should return a single menu item by id', async () => {
      menuService.getMenuItemById.mockResolvedValue(mockMenuItems[0]);

      const res = await request(app).get('/api/menu/item-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('item-001');
      expect(res.body.data.name).toBe('Margherita');
    });

    it('should return 404 when menu item id does not exist', async () => {
      menuService.getMenuItemById.mockResolvedValue(null);

      const res = await request(app).get('/api/menu/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
