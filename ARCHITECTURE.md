# Backend-Frontend Interaction Guide

This document explains how the **Node.js/Express backend** communicates with the **Next.js frontend** in this e-commerce application.

## Architecture Overview

```
┌─────────────────┐         HTTP/REST API         ┌─────────────────┐
│                 │ ◄──────────────────────────► │                 │
│   Frontend      │    (JSON Requests/Responses)   │    Backend      │
│   (Next.js)     │                                │   (Express)     │
│   Port 3000     │                                │   Port 5000     │
└─────────────────┘                                └─────────────────┘
```

## Communication Mechanism

### 1. **HTTP REST API**
The frontend makes HTTP requests to the backend API using the native `fetch()` API.

### 2. **CORS Configuration**
The backend enables CORS (Cross-Origin Resource Sharing) to allow the frontend (running on port 3000) to make requests to the backend (running on port 5000):

```javascript
// backend/index.js
app.use(cors());  // Allows requests from any origin (localhost:3000)
app.use(express.json());  // Parses JSON request bodies
```

### 3. **API Base URL Configuration**
The frontend uses a configurable base URL that defaults to `http://localhost:5000`:

```typescript
// frontend/src/lib/config.ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
```

## API Endpoints

### 1. **GET /api/products** - Fetch All Products

**Backend Handler:**
```javascript
// backend/index.js (lines 191-214)
app.get("/api/products", (req, res) => {
  const { category, featured } = req.query;
  
  let filtered = [...products];
  if (category) {
    filtered = filtered.filter(
      (product) => product.category.toLowerCase() === String(category).toLowerCase()
    );
  }
  
  if (featured === "true") {
    filtered = filtered.filter((product) => featuredIds.has(product.id));
  }
  
  res.json({
    data: filtered,
    meta: {
      total: filtered.length,
      categories: [...new Set(products.map((product) => product.category))],
      featuredCount: filtered.filter((item) => featuredIds.has(item.id)).length,
    },
  });
});
```

**Frontend Usage:**
```typescript
// frontend/src/app/page.tsx (lines 5-21)
async function fetchProducts(params: Record<string, string> = {}): Promise<ProductResponse> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(
    `${API_BASE_URL}/api/products${query ? `?${query}` : ""}`,
    {
      next: { revalidate: 60 },  // Next.js caching: revalidate every 60 seconds
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json();
}
```

**Request Example:**
```
GET http://localhost:5000/api/products?featured=true
```

**Response Example:**
```json
{
  "data": [
    {
      "id": "aurora-lamp",
      "name": "Aurora Minimal Lamp",
      "price": 129,
      "category": "Lighting",
      ...
    }
  ],
  "meta": {
    "total": 3,
    "categories": ["Lighting", "Furniture", "Office"],
    "featuredCount": 3
  }
}
```

### 2. **GET /api/products/:id** - Fetch Single Product

**Backend Handler:**
```javascript
// backend/index.js (lines 216-224)
app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  
  res.json(product);
});
```

### 3. **POST /api/checkout** - Process Checkout

**Backend Handler:**
```javascript
// backend/index.js (lines 226-259)
app.post("/api/checkout", (req, res) => {
  const { items = [], email } = req.body || {};
  
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Cart items are required" });
  }
  
  // Validate products and calculate totals
  const computedItems = items.map((line) => {
    const product = products.find((item) => item.id === line.id);
    if (!product) {
      throw new Error(`Invalid product id: ${line.id}`);
    }
    
    return {
      ...line,
      name: product.name,
      price: product.price,
      lineTotal: product.price * (line.quantity || 1),
    };
  });
  
  const subtotal = computedItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal > 400 ? 0 : 24;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;
  
  res.json({
    orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
    email: email || "guest@checkout.com",
    items: computedItems,
    breakdown: { subtotal, shipping, tax, total },
    estimatedArrival: "3-5 business days",
  });
});
```

**Frontend Usage:**
```typescript
// frontend/src/components/storefront/Storefront.tsx (lines 79-116)
const handleCheckout = async () => {
  if (!cartItems.length) return;
  
  setIsCheckingOut(true);
  setCheckoutMessage(null);
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "guest@shopper.com",
          items: cartItems.map(({ product, quantity }) => ({
            id: product.id,
            quantity,
          })),
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error("Unable to process checkout");
    }
    
    const payload = await response.json();
    setCheckoutMessage(
      `Order ${payload.orderId} confirmed! ETA ${payload.estimatedArrival}`
    );
    setCart({});
  } catch (error) {
    console.error(error);
    setCheckoutMessage("Something went wrong. Please try again.");
  } finally {
    setIsCheckingOut(false);
  }
};
```

**Request Example:**
```json
POST http://localhost:5000/api/checkout
Content-Type: application/json

{
  "email": "guest@shopper.com",
  "items": [
    { "id": "aurora-lamp", "quantity": 2 },
    { "id": "solstice-chair", "quantity": 1 }
  ]
}
```

**Response Example:**
```json
{
  "orderId": "ORD-ABC123XYZ",
  "email": "guest@shopper.com",
  "items": [
    {
      "id": "aurora-lamp",
      "quantity": 2,
      "name": "Aurora Minimal Lamp",
      "price": 129,
      "lineTotal": 258
    }
  ],
  "breakdown": {
    "subtotal": 757,
    "shipping": 24,
    "tax": 60.56,
    "total": 841.56
  },
  "estimatedArrival": "3-5 business days"
}
```

## Data Flow

### 1. **Initial Page Load (Server-Side Rendering)**

```
User visits page
    ↓
Next.js Server (page.tsx)
    ↓
Fetches from backend API (GET /api/products)
    ↓
Backend returns product data
    ↓
Next.js renders HTML with data
    ↓
Browser receives fully rendered page
```

**Code Flow:**
```typescript
// frontend/src/app/page.tsx
export default async function HomePage() {
  // Server-side fetch (happens on Next.js server)
  const [allProducts, featuredProducts] = await Promise.all([
    fetchProducts(),                    // GET /api/products
    fetchProducts({ featured: "true" }), // GET /api/products?featured=true
  ]);
  
  // Pass data to client component
  return <Storefront products={...} featured={...} categories={...} />;
}
```

### 2. **Client-Side Interaction (Checkout)**

```
User clicks "Checkout"
    ↓
Client component (Storefront.tsx)
    ↓
Makes POST request to backend (POST /api/checkout)
    ↓
Backend validates and processes order
    ↓
Backend returns order confirmation
    ↓
Frontend updates UI with order details
```

## Key Technologies

1. **CORS**: Enables cross-origin requests between frontend (port 3000) and backend (port 5000)
2. **JSON**: All data is exchanged in JSON format
3. **Fetch API**: Modern JavaScript API for making HTTP requests
4. **Next.js Server Components**: Initial data fetching happens on the server
5. **React Client Components**: Interactive features (cart, checkout) run on the client

## Error Handling

### Backend Error Handling:
```javascript
// backend/index.js (lines 261-264)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});
```

### Frontend Error Handling:
```typescript
// frontend/src/components/storefront/Storefront.tsx
try {
  const response = await fetch(...);
  if (!response.ok) {
    throw new Error("Unable to process checkout");
  }
  // Handle success
} catch (error) {
  console.error(error);
  setCheckoutMessage("Something went wrong. Please try again.");
}
```

## Environment Configuration

To change the API URL (e.g., for production):

1. Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

2. The frontend will automatically use this URL instead of `http://localhost:5000`

## Summary

- **Backend** (Express) serves as a REST API on port 5000
- **Frontend** (Next.js) makes HTTP requests to the backend API
- **CORS** is enabled to allow cross-origin requests
- **Server-Side Rendering**: Initial product data is fetched on the server
- **Client-Side Interaction**: Cart and checkout operations happen in the browser
- **JSON** is used for all data exchange
- Both services run independently and communicate over HTTP

