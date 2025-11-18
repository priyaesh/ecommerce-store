# Inventory Management System

A comprehensive inventory management system has been added to the e-commerce website, tracking stock levels, preventing overselling, and providing admin tools for stock management.

## Features

### Backend Inventory Management

1. **Product Model Enhancements**
   - `stock` field tracks available inventory
   - Instance methods:
     - `isInStock(quantity)` - Check if product has enough stock
     - `reduceStock(quantity)` - Reduce stock (with validation)
     - `increaseStock(quantity)` - Increase stock (for restocking)
   - Static methods:
     - `getLowStock(threshold)` - Get products with low stock
     - `getOutOfStock()` - Get out of stock products

2. **Inventory API Endpoints**
   - `GET /api/inventory/products/:id/stock` - Get stock level (public)
   - `GET /api/inventory/low-stock` - Get low stock products (admin)
   - `GET /api/inventory/out-of-stock` - Get out of stock products (admin)
   - `GET /api/inventory/summary` - Get inventory summary (admin)
   - `PUT /api/inventory/products/:id/stock` - Update stock (admin)
     - Actions: `set`, `add`, `subtract`

3. **Checkout Integration**
   - Validates stock before processing checkout
   - Prevents checkout if items are out of stock
   - Automatically reduces stock on successful checkout
   - Returns detailed error messages for stock issues

### Frontend Inventory Features

1. **Product Display**
   - Shows stock status on product cards
   - **Out of Stock**: Red badge, disabled "Add to Cart" button
   - **Low Stock (≤10)**: Amber warning, shows remaining quantity
   - **In Stock (>10)**: Shows stock count

2. **Cart Management**
   - Prevents adding more than available stock
   - Disables quantity increase button when at max stock
   - Shows stock warnings in cart
   - Automatically adjusts cart quantities to match available stock
   - Validates cart on load (removes invalid quantities)

3. **Checkout Protection**
   - Validates stock before checkout
   - Shows detailed error messages for stock issues
   - Refreshes product data after checkout to show updated stock

4. **Admin Inventory Dashboard**
   - Accessible at `/admin/inventory` (admin only)
   - Inventory summary cards:
     - Total products
     - In stock products
     - Low stock products
     - Out of stock products
   - Low stock product list with update controls
   - Out of stock product list with restock controls
   - Real-time stock updates

## Stock Status Indicators

### Product Cards
- **Out of Stock (0)**: 
  - Red "Out of Stock" badge
  - Disabled button
- **Low Stock (1-10)**:
  - Amber "Only X left in stock" warning
  - Button disabled when cart quantity reaches stock limit
- **In Stock (>10)**:
  - Shows stock count
  - Normal "Add to Cart" button

### Cart Items
- Shows stock warnings if quantity exceeds available stock
- Disables quantity increase when at max stock
- Shows low stock warnings (≤10 items)

## API Usage Examples

### Get Stock Level
```bash
GET /api/inventory/products/aurora-lamp/stock
```

### Update Stock (Admin)
```bash
PUT /api/inventory/products/aurora-lamp/stock
Authorization: Bearer <admin-token>
Body: {
  "stock": 50,
  "action": "set"  // or "add", "subtract"
}
```

### Get Inventory Summary (Admin)
```bash
GET /api/inventory/summary
Authorization: Bearer <admin-token>
```

## Stock Validation Flow

1. **Adding to Cart**
   - Frontend checks `product.stock` before adding
   - Limits quantity to available stock
   - Shows warnings for low stock

2. **Cart Quantity Updates**
   - Prevents increasing beyond available stock
   - Automatically adjusts if stock decreases

3. **Checkout**
   - Backend validates all items have sufficient stock
   - Returns error with details if validation fails
   - Reduces stock atomically on success

4. **Cart Loading**
   - Validates cart items against current stock
   - Adjusts quantities to match available stock
   - Removes items that are out of stock

## Admin Access

To access the inventory management dashboard:
1. Log in as a user with `role: "admin"`
2. Navigate to `/admin/inventory`
3. View and manage stock levels

### Creating an Admin User

Update a user's role in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Database Schema

The Product model includes:
```javascript
stock: {
  type: Number,
  required: true,
  min: 0,
}
```

## Error Handling

### Stock Errors
- Checkout fails with detailed error if stock insufficient
- Frontend shows user-friendly error messages
- Cart quantities are automatically adjusted

### Validation
- Cart quantities are validated on load
- Invalid quantities are adjusted to available stock
- Out of stock items are removed from cart

## Best Practices

1. **Stock Updates**: Use admin dashboard for bulk updates
2. **Monitoring**: Check low stock alerts regularly
3. **Restocking**: Update stock before items go out of stock
4. **Validation**: Always validate stock on both frontend and backend
5. **User Experience**: Show clear stock status to users

## Future Enhancements

Potential improvements:
- Stock alerts/notifications
- Automatic reorder points
- Stock history tracking
- Multi-warehouse support
- Stock reservations for pending orders

