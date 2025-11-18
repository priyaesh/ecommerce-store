# Stripe Setup Instructions

## Quick Setup

1. **Get your Stripe Test Mode API keys:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Make sure you're in **Test Mode** (toggle in top right)
   - Copy your **Secret key** (starts with `sk_test_`)

2. **Create or update `backend/.env` file:**
   ```env
   # MongoDB Connection (if not already set)
   MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce-store

   # JWT Secret (if not already set)
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRE=30d

   # Stripe Payment Processing (Test Mode)
   STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key_here
   ```

3. **Restart your backend server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   cd backend
   npm run dev
   ```

## Test Card

Once configured, use this test card:
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

## Frontend Setup

Also add to `frontend/.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key_here
```

Then restart the frontend server.

