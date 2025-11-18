## Morrow Studio — Modern E‑commerce Starter

Full-stack demo storefront built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and a lightweight **Node/Express API**. It ships with curated product data, category filters, a cart summary, and a mock checkout endpoint that returns live order summaries.

### Project Structure

```
ecommerce-store/
├── frontend/          # Next.js application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/          # Node.js/Express API
│   ├── config/       # Database configuration
│   ├── models/       # MongoDB models (Product)
│   ├── scripts/      # Database seed script
│   ├── index.js      # API server
│   └── package.json  # Backend dependencies
└── package.json      # Root scripts (orchestrates both)
```

### Tech Stack
- Next.js 16 + React 19 for the storefront UI
- Tailwind v4 for utility-first styling and custom gradients
- Express 5 API with CORS-enabled JSON endpoints
- MongoDB with Mongoose ODM for data persistence
- TypeScript types shared across the app layer

### Local Development

#### Option 1: Install and run separately

Install dependencies for both frontend and backend:

```bash
# Install root dependencies (includes concurrently for running both)
npm install

# Install frontend dependencies
npm install --prefix frontend

# Install backend dependencies
npm install --prefix backend
```

Or use the convenience script:
```bash
npm run install:all
```

#### MongoDB Setup

**Option 1: Local MongoDB**
1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service (usually runs automatically on Windows/Mac)
3. Create a `.env` file in the `backend` folder:
```bash
cd backend
cp .env.example .env
# Edit .env and set: MONGODB_URI=mongodb://localhost:27017/ecommerce-store
```

**Option 2: MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Create a `.env` file in the `backend` folder:
```bash
cd backend
cp .env.example .env
# Edit .env and set: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store
```

**Seed the Database:**
After setting up MongoDB, populate it with sample products:
```bash
cd backend
npm run seed
```

Start the backend API (port 5000 by default):
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

In another terminal, start the frontend:
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

#### Option 2: Run both simultaneously

From the root directory:
```bash
npm run dev
```

This uses `concurrently` to run both the backend and frontend servers at the same time.

Visit `http://localhost:3000` and the storefront will fetch data from `http://localhost:5000`.

> **Environment variable:** Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` if you host the API elsewhere. The frontend defaults to `http://localhost:5000`.

### API Overview
`GET /api/products` — all products with metadata & categories  
`GET /api/products?featured=true` — highlight set used by the hero  
`GET /api/products/:id` — details for a single SKU  
`POST /api/payment/create-intent` — creates Stripe payment intent for checkout  
`POST /api/payment/confirm` — confirms payment and reduces inventory

### Payment Integration (Stripe)

The website includes Stripe payment processing in **Test Mode**. See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for setup instructions.

**Quick Setup:**
1. Get your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com/) (Test Mode)
2. Add `STRIPE_SECRET_KEY` to `backend/.env`
3. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `frontend/.env.local`
4. Restart servers

**Test Card:** Use `4242 4242 4242 4242` with any future expiry date and CVC.

### Production Notes
- Deploy the API separately (e.g., Render, Railway, Fly.io) and point `NEXT_PUBLIC_API_BASE_URL` to the public URL.
- Set `MONGODB_URI` environment variable in your production backend environment.
- Run `npm run build` (from root) or `cd frontend && npm run build` followed by `npm start` for the Next.js production server.
- The database is now using MongoDB for persistent storage instead of in-memory data.
