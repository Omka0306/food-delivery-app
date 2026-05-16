const { v4: uuidv4 } = require('uuid');

const RESTAURANT_ID = 'ddb6d8ad-c007-4fff-8d62-3f13064d4725';

const menuItems = [
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Margherita',
    description:
      'Classic tomato base with fresh mozzarella and basil leaves baked to perfection. Simple ingredients that create an unforgettable taste.',
    price: 12.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop',
    available: true,
    rating: 4.5,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Pepperoni',
    description:
      'Generously loaded with premium spicy pepperoni slices on a rich tomato sauce. A timeless crowd favourite that never disappoints.',
    price: 14.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    available: true,
    rating: 4.7,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'BBQ Chicken',
    description:
      'Tender grilled chicken pieces smothered in smoky BBQ sauce on a crispy crust. Topped with caramelised onions and bell peppers.',
    price: 15.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    available: true,
    rating: 4.8,
    prepTime: '15-20 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Classic Smash',
    description:
      'Double smashed beef patty with crisp lettuce, ripe tomatoes, and house special sauce. A classic burger done absolutely right.',
    price: 9.99,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    available: true,
    rating: 4.6,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Mushroom Swiss',
    description:
      'Juicy beef patty topped with sautéed mushrooms and melted Swiss cheese. A gourmet take on the classic burger experience.',
    price: 11.99,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
    available: true,
    rating: 4.4,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Veggie',
    description:
      'A hearty black bean and chickpea patty packed with vibrant fresh vegetables. Proof that plant-based burgers can be just as satisfying.',
    price: 9.49,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop',
    available: true,
    rating: 4.2,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Loaded Fries',
    description:
      'Golden crispy fries piled high with melted cheddar, bacon bits, and spring onions. The ultimate indulgent side dish.',
    price: 4.99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    available: true,
    rating: 4.5,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Onion Rings',
    description:
      'Thick-cut onions coated in a seasoned beer batter and fried until perfectly golden. Crispy on the outside, sweet and tender inside.',
    price: 3.99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
    available: true,
    rating: 4.3,
    prepTime: '10-15 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Coleslaw',
    description:
      'Fresh shredded cabbage and carrots tossed in a creamy tangy dressing. The perfect cool and refreshing complement to any meal.',
    price: 2.99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&h=300&fit=crop',
    available: true,
    rating: 4.0,
    prepTime: '5-10 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Coca Cola',
    description:
      'The world-famous refreshing cola served ice cold in a chilled glass. The classic beverage pairing for any meal.',
    price: 1.99,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
    available: true,
    rating: 4.4,
    prepTime: '2-5 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Fresh Lemonade',
    description:
      'Freshly squeezed lemons blended with just the right amount of sugar and mint. A zesty and refreshing homemade drink.',
    price: 2.99,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
    available: true,
    rating: 4.6,
    prepTime: '5-10 mins',
  },
  {
    id: uuidv4(),
    restaurantId: RESTAURANT_ID,
    name: 'Mango Shake',
    description:
      'Thick creamy shake made from premium Alphonso mangoes blended with chilled milk. A tropical indulgence in every sip.',
    price: 3.99,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop',
    available: true,
    rating: 4.8,
    prepTime: '5-10 mins',
  },
];

module.exports = menuItems;
