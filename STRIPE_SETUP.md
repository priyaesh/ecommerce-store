# Stripe Payment Integration Setup

The e-commerce website now includes Stripe payment processing in **Test Mode**. No real money is involved.

## Setup Instructions

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key**

### 2. Configure Environment Variables

#### Backend (`.env` file in `backend/` directory)

Add your Stripe Secret Key:

```env
STRIPE_SECRET_KEY=sk_test_...
```

#### Frontend (`.env.local` file in `frontend/` directory)

Add your Stripe Publishable Key:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Restart Your Servers

After adding the environment variables, restart both backend and frontend:

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Test Mode Cards

Use these test card numbers in Stripe Test Mode:

### Successful Payment
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### Declined Payment
- **Card Number**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

### Requires Authentication (3D Secure)
- **Card Number**: `4000 0025 0000 3155`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

## How It Works

### Payment Flow

1. **User clicks "Checkout securely"**
   - Opens payment modal with Stripe Elements

2. **Payment Intent Created**
   - Backend creates a Stripe Payment Intent
   - Validates stock availability
   - Returns client secret to frontend

3. **User Enters Card Details**
   - Stripe Elements handles card input securely
   - Card details never touch your server

4. **Payment Confirmation**
   - Stripe processes the payment
   - Backend confirms payment and reduces stock
   - Order is completed

### API Endpoints

#### `POST /api/payment/create-intent`
Creates a Stripe Payment Intent for checkout.

**Request:**
```json
{
  "email": "customer@example.com",
  "items": [
    { "id": "product-id", "quantity": 2 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_...",
  "orderDetails": {
    "orderId": "ORD-...",
    "email": "customer@example.com",
    "items": [...],
    "breakdown": {
      "subtotal": 100,
      "shipping": 24,
      "tax": 8,
      "total": 132
    }
  }
}
```

#### `POST /api/payment/confirm`
Confirms payment and reduces inventory.

**Request:**
```json
{
  "paymentIntentId": "pi_..."
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-...",
  "email": "customer@example.com",
  "paymentIntentId": "pi_...",
  "message": "Order confirmed and inventory updated"
}
```

## Security Features

- ✅ **PCI Compliance**: Card details handled by Stripe
- ✅ **Stock Validation**: Prevents overselling
- ✅ **Payment Verification**: Confirms payment before reducing stock
- ✅ **Error Handling**: Graceful error messages
- ✅ **Test Mode**: Safe testing environment

## Features

- **Secure Payment Processing**: Stripe handles all card data
- **Real-time Stock Validation**: Checks availability before payment
- **Automatic Inventory Updates**: Reduces stock after successful payment
- **User-Friendly UI**: Clean payment modal with Stripe Elements
- **Error Handling**: Clear error messages for failed payments
- **Test Mode Support**: Safe testing with test cards

## Troubleshooting

### Payment Intent Creation Fails
- Check that `STRIPE_SECRET_KEY` is set correctly
- Verify you're using Test Mode keys (start with `sk_test_`)
- Check backend logs for detailed error messages

### Payment Modal Doesn't Open
- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify the key starts with `pk_test_`
- Check browser console for errors

### Payment Succeeds But Stock Not Reduced
- Check backend logs for confirmation errors
- Verify payment confirmation endpoint is working
- Check MongoDB connection

## Production Setup

When ready for production:

1. Switch Stripe Dashboard to **Live Mode**
2. Get your Live Mode API keys
3. Update environment variables with Live keys
4. Test with real cards (small amounts)
5. Set up webhooks for payment events (optional)

## Additional Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)

