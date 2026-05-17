# QuickBite — Food Delivery Platform

[![Backend CI](https://github.com/Omka0306/food-delivery-app/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Omka0306/food-delivery-app/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Omka0306/food-delivery-app/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Omka0306/food-delivery-app/actions/workflows/frontend-ci.yml)
[![Tests: 115 passing](https://img.shields.io/badge/tests-115%20passing-brightgreen)](#testing)

> A production-grade, serverless food delivery platform with real-time order tracking, role-based access, promo/coupon engine, and AI-powered meal recommendations.

**Live App:** https://food-delivery-app-rouge-gamma.vercel.app
**API Base:** https://haxew3ftcj.execute-api.ap-south-1.amazonaws.com/api

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Feature Set](#feature-set)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [CI/CD Pipelines](#cicd-pipelines)
- [Design Decisions](#design-decisions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 + Vite)               │
│   Zustand (cart + auth + activeOrder)  ·  TanStack Query        │
│   WebSocket hook ──────────────────────────────────────────┐    │
└───────────────────────────┬────────────────────────────────┼────┘
                            │ HTTPS REST                     │ WSS
          ┌─────────────────▼────────────────────────────────▼────┐
          │           AWS API Gateway (HTTP + WebSocket)           │
          └───────────────────────────┬─────────────────────────── ┘
                                      │
          ┌───────────────────────────▼────────────────────────────┐
          │              AWS Lambda (Node 18 / Express)             │
          │  Auth · Menu · Orders · Offers · Restaurant · Reviews   │
          └──────┬────────────────┬──────────────────┬─────────────┘
                 │                │                  │
          ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
          │   DynamoDB  │  │   Cognito   │  │   Bedrock    │
          │  (5 tables) │  │  User Pool  │  │  Nova Pro AI │
          └─────────────┘  └─────────────┘  └──────────────┘
```

### DynamoDB Tables

| Table | Partition Key | Purpose |
|---|---|---|
| `MenuItems` | `id` | Menu catalogue |
| `Orders` | `orderId` | Order lifecycle |
| `Restaurants` | `restaurantId` | Restaurant profiles |
| `UserProfiles` | `userId` | Customer data |
| `Reviews` | `reviewId` | Order feedback |

---

## Feature Set

### Customer-Facing
- **Menu browsing** — category filter, veg/non-veg toggle, full-text search, budget strip (items under ₹99)
- **Cart** — multi-item, quantity controls, restaurant-conflict guard (prevents mixing orders)
- **Checkout** — delivery details form with Zod validation, saved address selector, promo/coupon code input
- **Order tracking** — live status timeline (Order Received → Preparing → Out for Delivery → Delivered)
- **Live order bar** — Swiggy-style floating bottom bar with real-time status across all pages
- **AI Meal Assistant** — natural-language query → Bedrock Nova Pro → semantic menu recommendations
- **Profile management** — update name, phone; view order history

### Restaurant Dashboard
- Incoming order queue with one-click status progression
- Menu management (add/edit/remove items, toggle availability)
- Analytics — revenue, order volume, popular items

### Admin Panel
- Approve/suspend restaurants
- Full order visibility across all restaurants
- User management

### Promo / Coupon Engine

| Code | Type | Benefit | Condition |
|---|---|---|---|
| `SAVE10` | Percent | 10% off (max ₹100) | Any order |
| `FLAT50` | Flat | ₹50 off | Orders ₹200+ |
| `WELCOME` | Percent | 15% off (max ₹150) | First order only |
| `FREESHIP` | Delivery | Free delivery | Any order |
| `LOYALTY5` | Flat | ₹100 off | After 5 orders |

### Real-Time Order Tracking
Orders are tracked via **AWS API Gateway WebSocket** with automatic fallback to HTTP polling (every 10 seconds). The `LiveOrderBar` persists across page navigation using Zustand's `persist` middleware (localStorage).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TailwindCSS, Framer Motion |
| State | Zustand v5 (persist middleware), TanStack Query v5 |
| Backend | Node.js 18, Express, Serverless Framework |
| Database | AWS DynamoDB (via `@aws-sdk/lib-dynamodb`) |
| Auth | AWS Cognito (User Pools, JWT via `aws-jwt-verify`) |
| Real-Time | AWS API Gateway WebSocket API |
| AI | AWS Bedrock (Nova Pro), OpenSearch Serverless (KNN) |
| Testing | Vitest + Testing Library (frontend), Jest + Supertest (backend) |
| CI/CD | GitHub Actions → AWS Lambda + Vercel |

---

## Project Structure

```
food-delivery-app/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express app wiring
│   │   ├── lambda.js                 # Serverless entry point
│   │   ├── controllers/              # Request/response handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── menu.controller.js
│   │   │   ├── orders.controller.js
│   │   │   ├── offers.controller.js
│   │   │   ├── restaurant.controller.js
│   │   │   └── reviews.controller.js
│   │   ├── services/                 # Business logic + DynamoDB
│   │   │   ├── auth.service.js
│   │   │   ├── menu.service.js
│   │   │   ├── orders.service.js     # Full pricing: GST, platform fee, promo
│   │   │   ├── offers.service.js     # Promo code validation
│   │   │   └── restaurant.service.js
│   │   ├── routes/                   # Express routers
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verify + role guard
│   │   │   ├── validate.js           # Joi/Zod schema validation
│   │   │   └── errorHandler.js
│   │   ├── validators/               # Request schema definitions
│   │   ├── websocket/                # WebSocket push handlers
│   │   └── ai/                       # Bedrock + OpenSearch pipeline
│   ├── tests/
│   │   ├── orders.test.js            # 20 tests — CRUD, validation, auth
│   │   ├── menu.test.js              # 4 tests — retrieval, 404 handling
│   │   ├── auth.test.js              # 8 tests — register, login, JWT
│   │   └── restaurant.test.js        # 7 tests — dashboard, status updates
│   └── serverless.yml                # Lambda + API Gateway config
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx           # Menu browsing + AI search
    │   │   ├── CheckoutPage.jsx       # Cart review + promo
    │   │   ├── OrderStatusPage.jsx    # Live order tracking
    │   │   ├── customer/
    │   │   │   ├── MyOrdersPage.jsx
    │   │   │   └── ProfilePage.jsx
    │   │   ├── restaurant/            # Restaurant dashboard
    │   │   └── admin/                 # Admin panel
    │   ├── components/
    │   │   ├── cart/                  # CartDrawer, CartItem, CartButton
    │   │   ├── checkout/              # CheckoutForm, OrderSummary, AddressSelector
    │   │   ├── order/                 # LiveOrderBar, OrderTracker, StatusTimeline
    │   │   ├── menu/                  # MenuCard, MenuGrid, CategoryFilter
    │   │   └── ai/                    # AIMealAssistantButton, AISearchBar
    │   ├── hooks/
    │   │   ├── useCart.js
    │   │   ├── useMenu.js
    │   │   ├── useOrderTracking.js    # WebSocket + polling hybrid
    │   │   └── useAIRecommendations.js
    │   ├── store/
    │   │   ├── cartStore.js           # Zustand cart (persisted)
    │   │   ├── authStore.js           # Zustand auth (persisted)
    │   │   └── activeOrderStore.js    # Zustand live order (persisted)
    │   └── services/
    │       ├── api.js                 # All REST API methods
    │       └── apiClient.js           # Axios instance with JWT interceptor
    └── tests/
        ├── MenuCard.test.jsx
        ├── CartItem.test.jsx
        ├── CheckoutForm.test.jsx
        ├── LoginPage.test.jsx
        ├── ProtectedRoute.test.jsx
        ├── RestaurantDashboard.test.jsx
        └── useWebSocket.test.js
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <idToken>`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/verify` | Public | Verify email OTP |
| PATCH | `/auth/profile` | Customer | Update name/phone |

### Menu
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/menu` | Public | All items (filterable by category, restaurantId) |
| GET | `/menu/:id` | Public | Single item |
| POST | `/menu` | Restaurant | Add menu item |
| PATCH | `/menu/:id` | Restaurant | Update item |
| DELETE | `/menu/:id` | Restaurant | Remove item |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Customer | Place order |
| GET | `/orders/my` | Customer | Customer's order history |
| GET | `/orders/:orderId` | Public | Order detail + status history |
| PATCH | `/orders/:orderId/status` | Restaurant | Advance order status |

### Offers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/offers` | Public | List all promo codes |
| POST | `/offers/validate` | Public | Validate code + calculate discount |

### Pricing (calculated server-side on order placement)
```
Total = Subtotal + GST (5%) + Platform Fee (₹10) + Delivery Fee (₹40 or FREE if ≥₹499) − Discount
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured (`aws configure`)
- AWS account with DynamoDB, Cognito, Lambda permissions

### Backend (local)
```bash
cd backend
npm install
cp .env.example .env        # fill AWS credentials and table names
npm run dev                 # Express on :3000
npm test                    # run 39 Jest tests
```

### Frontend (local)
```bash
cd frontend
npm install
cp .env.example .env        # set VITE_API_URL=http://localhost:3000/api
npm run dev                 # Vite on :5173
npm test                    # run 76 Vitest tests
```

### Environment Variables

**Backend `.env`**
```env
COGNITO_USER_POOL_ID=ap-south-1_xxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
RESTAURANTS_TABLE=Restaurants
MENU_TABLE=MenuItems
ORDERS_TABLE=Orders
USER_PROFILES_TABLE=UserProfiles
REVIEWS_TABLE=Reviews
AWS_REGION=ap-south-1
```

**Frontend `.env`**
```env
VITE_API_URL=https://haxew3ftcj.execute-api.ap-south-1.amazonaws.com/api
VITE_WEBSOCKET_URL=wss://5fe1g1yn7j.execute-api.ap-south-1.amazonaws.com/prod
VITE_APP_NAME=QuickBite
VITE_AI_ENABLED=true
```

---

## Testing

### Run All Tests
```bash
# Backend — Jest + Supertest (39 tests)
cd backend && npm test

# Frontend — Vitest + Testing Library (76 tests)
cd frontend && npm test
```

### Test Coverage

**Backend (Jest)**
| Suite | Tests | Coverage Focus |
|---|---|---|
| `orders.test.js` | 20 | Place order, validation, auth guards, status updates, 404 |
| `auth.test.js` | 8 | Register, login, JWT verify, role enforcement |
| `menu.test.js` | 4 | GET all, GET by category, GET by ID, 404 |
| `restaurant.test.js` | 7 | Dashboard, order management, status progression |

**Frontend (Vitest)**
| Suite | Tests | Coverage Focus |
|---|---|---|
| `MenuCard.test.jsx` | 6 | Render, Add button, quantity controls |
| `CartItem.test.jsx` | 4 | Render, increment, decrement, remove |
| `CheckoutForm.test.jsx` | 4 | Validation errors, successful submission |
| `LoginPage.test.jsx` | 6 | Form render, validation, submit |
| `ProtectedRoute.test.jsx` | 5 | Role-based redirect logic |
| `RestaurantDashboard.test.jsx` | 8 | Dashboard render, order actions |
| `useWebSocket.test.js` | 3 | Connect, message handling, cleanup |
| AI component tests | 40 | AI search bar, recommendation results |

**Total: 115 tests, all passing**

---

## CI/CD Pipelines

| Workflow | Trigger | Steps |
|---|---|---|
| `backend-ci` | Push/PR → `main` | Lint → Jest (39 tests) → Coverage report |
| `backend-cd` | Push → `main` | `serverless deploy --stage prod` → AWS Lambda |
| `frontend-ci` | Push/PR → `main` | Lint → Vitest (76 tests) → Vite build |
| `frontend-cd` | Push → `main` | Vercel production deploy |
| `pr-checks` | PR opened | Title format · size warning · dependency audit |

---

## Design Decisions

**Why AWS Lambda + Serverless Framework?**
Pay-per-request billing suits a startup/assessment context. The entire backend scales to zero and costs nothing when idle, yet handles traffic spikes automatically.

**Why Zustand over Redux?**
Three stores (cart, auth, activeOrder) each under 15 lines. Zustand's `persist` middleware gave us free localStorage sync for the live order bar without any boilerplate.

**Why WebSocket + HTTP polling hybrid?**
WebSocket gives instant status pushes when the connection is alive. The polling fallback ensures orders still update on flaky mobile networks. Both paths hit the same `useQuery` cache so the UI logic is identical either way.

**Why server-side pricing?**
All price calculations (GST, platform fee, delivery fee, discount) happen in `orders.service.js` at placement time, not in the frontend. This prevents client-side manipulation and creates an immutable audit trail in DynamoDB.

**Why inline `require` for offers in orders.service.js?**
`orders.service.js` and `offers.service.js` would create a circular dependency if imported at the top level. The inline `require('./offers.service')` inside the function body resolves this cleanly without restructuring the module graph.

---

## License

MIT — Omkar Patil
