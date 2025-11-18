# Backend API Tests

Comprehensive test suite for the e-commerce backend API using Jest and Supertest.

## Setup

Tests use a separate test database (`ecommerce-store-test`) to avoid affecting development data.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Test Files

- **`products.test.js`** - Product API endpoints
  - GET /api/products
  - GET /api/products/:id
  - GET /api/health

- **`auth.test.js`** - Authentication endpoints
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me

- **`inventory.test.js`** - Inventory management endpoints
  - GET /api/inventory/products/:id/stock
  - GET /api/inventory/low-stock
  - GET /api/inventory/out-of-stock
  - PUT /api/inventory/products/:id/stock
  - GET /api/inventory/summary

- **`payment.test.js`** - Payment processing endpoints
  - POST /api/payment/create-intent
  - POST /api/payment/confirm

- **`checkout.test.js`** - Checkout endpoint
  - POST /api/checkout

## Test Database

Tests automatically:
- Connect to test database before all tests
- Clear database after each test
- Close connection after all tests

## Environment Variables

For tests, you can set:
- `MONGODB_URI_TEST` - Test database connection string (defaults to `mongodb://127.0.0.1:27017/ecommerce-store-test`)
- `STRIPE_SECRET_KEY` - Stripe secret key (mocked in payment tests)

## Coverage

Run `npm run test:coverage` to generate a coverage report showing:
- Which routes are tested
- Which models are tested
- Code coverage percentage

## Writing New Tests

1. Create a new test file in `backend/tests/`
2. Follow the existing test structure
3. Use `beforeEach` to set up test data
4. Use `afterEach` to clean up (handled automatically by setup.js)
5. Test both success and error cases

## Example Test

```javascript
describe("GET /api/endpoint", () => {
  it("should return success response", async () => {
    const res = await request(app)
      .get("/api/endpoint")
      .send({ data: "test" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

