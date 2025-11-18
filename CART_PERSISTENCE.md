# Cart Persistence System

The e-commerce website now has a comprehensive cart persistence system that works both in the browser (localStorage) and in the database.

## Architecture

### Frontend: localStorage (Primary Storage)
- **Always active** - Cart is saved to localStorage for all users (guests and authenticated)
- **User-specific keys** - Each user has their own cart key: `cart_<userId>` or `cart_guest`
- **Instant persistence** - Cart saves immediately on any change
- **Works offline** - Cart persists even without internet connection

### Backend: Database (Optional Sync)
- **Authenticated users only** - Cart is synced to MongoDB when user is logged in
- **Debounced saves** - Database saves happen 1 second after last cart change (reduces API calls)
- **Fallback support** - If database save fails, localStorage is still used
- **Priority loading** - On login, database cart takes priority over localStorage

## Cart Storage Keys

```
localStorage:
  - cart_<userId1> → User 1's cart
  - cart_<userId2> → User 2's cart
  - cart_guest → Guest user's cart

MongoDB (User document):
  - user.cart → Map of productId: quantity
```

## How It Works

### 1. Adding Items to Cart
- Item added → Cart state updates
- **localStorage**: Saved immediately
- **Database**: Saved after 1 second debounce (if user is logged in)

### 2. User Logs In
- **Priority order**:
  1. Load from database (if exists)
  2. Fall back to localStorage (if database empty)
  3. Start with empty cart (if neither exists)
- Cart is validated (removes invalid/deleted products)
- Both localStorage and database are updated

### 3. User Logs Out
- ✅ **Cart remains visible** - Items stay in the cart
- Cart is saved to:
  - User's localStorage key (`cart_<userId>`) - for when they log back in
  - Guest localStorage key (`cart_guest`) - for current session
- Cart is **NOT cleared** - User can continue shopping as guest

### 4. Different User Logs In
- Previous user's cart is saved and hidden
- New user's cart is loaded from:
  - Database (if exists)
  - Their localStorage key (if exists)
  - Empty cart (if new user)

### 5. Page Refresh
- Cart is restored from localStorage immediately
- If user is logged in, database cart is synced in background
- Database cart takes priority if it exists

## API Endpoints

### Save Cart to Database
```
PUT /api/auth/cart
Authorization: Bearer <token>
Body: { "cart": { "product-id": 2, "another-id": 1 } }
```

### Get Cart from Database
```
GET /api/auth/cart
Authorization: Bearer <token>
Response: { "success": true, "cart": { "product-id": 2 } }
```

## Features

✅ **Dual Storage** - localStorage (always) + database (optional)
✅ **Logout Persistence** - Cart remains visible after logout
✅ **User Isolation** - Each user has their own cart
✅ **Guest Support** - Guest users have persistent cart
✅ **Offline Support** - Works without internet (localStorage)
✅ **Auto-sync** - Database syncs automatically when logged in
✅ **Debounced Saves** - Reduces database API calls
✅ **Graceful Fallback** - Falls back to localStorage if database fails
✅ **Product Validation** - Removes invalid/deleted products automatically

## Database Schema

The User model now includes a `cart` field:

```javascript
cart: {
  type: Map,
  of: Number,
  default: new Map(),
}
```

Stored as: `{ "product-id-1": 2, "product-id-2": 1 }`

## Testing

1. **Add items as guest** → Items persist in `cart_guest`
2. **Log in** → Cart loads from database or localStorage
3. **Add more items** → Saves to both localStorage and database
4. **Log out** → Cart remains visible, saved to both keys
5. **Different user logs in** → Sees their own cart
6. **Original user logs back in** → Sees their original cart

## Notes

- Database sync is **optional** - the app works perfectly with just localStorage
- Database saves are **debounced** (1 second) to reduce API calls
- Cart validation happens on load - invalid products are automatically removed
- Logout **never clears** the cart - it always remains visible

