# Cypress E2E Tests

This directory contains end-to-end tests for the e-commerce store frontend using Cypress.

## Prerequisites

1. **Backend server must be running** on `http://localhost:5000`
2. **Frontend server must be running** on `http://localhost:3000`
3. **MongoDB must be running** (for backend API to work)

## Running Tests

### Open Cypress Test Runner (Interactive Mode)

```bash
npm run cypress:open
# or
npm run test:e2e:open
```

This opens the Cypress Test Runner GUI where you can:
- Select which tests to run
- Watch tests execute in real-time
- Debug tests interactively

### Run Tests Headlessly (CI/CD Mode)

```bash
npm run cypress:run
# or
npm run test:e2e
```

This runs all tests in headless mode (no browser window).

### Run Tests in Headed Mode (See Browser)

```bash
npm run cypress:run:headed
```

This runs tests with a visible browser window.

## Test Structure

```
cypress/
├── e2e/              # Test files
│   ├── storefront.cy.ts   # Product display, filtering, search
│   ├── cart.cy.ts         # Shopping cart functionality
│   ├── auth.cy.ts         # Authentication (login, register, logout)
│   └── checkout.cy.ts     # Checkout and payment flow
├── fixtures/         # Test data
│   └── products.json      # Sample product data
└── support/          # Custom commands and utilities
    ├── commands.ts        # Custom Cypress commands
    └── e2e.ts            # Support file configuration
```

## Test Files

### `storefront.cy.ts`
Tests for the main storefront page:
- Product display
- Category filtering
- Search functionality
- Stock information display
- Featured products section

### `cart.cy.ts`
Tests for shopping cart functionality:
- Adding items to cart
- Updating quantities
- Removing items
- Cart persistence
- Cart totals calculation
- Out of stock prevention

### `auth.cy.ts`
Tests for authentication:
- User registration
- User login
- User logout
- Session persistence
- Protected routes
- Profile page access

### `checkout.cy.ts`
Tests for checkout process:
- Checkout button visibility
- Payment modal display
- Order summary
- Payment form (requires Stripe test keys)
- Cart clearing after checkout

## Custom Commands

The following custom commands are available in all tests:

- `cy.login(email, password)` - Log in a user
- `cy.register(email, password, name)` - Register a new user
- `cy.addToCart(productName)` - Add a product to cart by name
- `cy.clearCart()` - Clear the shopping cart

## Configuration

Cypress configuration is in `cypress.config.ts`:
- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Timeouts: 10 seconds for commands and requests
- Videos: Disabled (can be enabled for debugging)

## Writing New Tests

1. Create a new file in `cypress/e2e/` with `.cy.ts` extension
2. Use the `describe` and `it` blocks to structure tests
3. Use custom commands from `support/commands.ts`
4. Mock API responses when needed using `cy.intercept()`

Example:

```typescript
describe('My Feature', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should do something', () => {
    cy.get('[data-testid="my-element"]').should('be.visible')
  })
})
```

## Best Practices

1. **Use data-testid attributes** in your components for reliable selectors
2. **Mock API calls** when testing UI without backend dependencies
3. **Clean up state** in `beforeEach` hooks (clear localStorage, etc.)
4. **Wait for async operations** using `cy.wait()` or `cy.intercept()`
5. **Use custom commands** for repeated actions (login, add to cart, etc.)

## Troubleshooting

### Tests fail with "Cannot connect to server"
- Ensure both frontend (`npm run dev` in `frontend/`) and backend (`npm run dev` in `backend/`) are running
- Check that ports 3000 and 5000 are not in use by other applications

### Tests fail with "Element not found"
- Check that the component has the expected `data-testid` attributes
- Verify the page has loaded completely before interacting with elements
- Use `cy.wait()` for API calls that load data

### Stripe payment tests fail
- Ensure Stripe test keys are configured in `.env.local`
- Payment tests may require special setup for Stripe elements to render in Cypress

## CI/CD Integration

For continuous integration, use:

```bash
npm run cypress:run
```

This command:
- Runs all tests headlessly
- Generates screenshots on failure
- Exits with appropriate code for CI systems
- Can be integrated into GitHub Actions, GitLab CI, etc.

## Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Real World App Examples](https://github.com/cypress-io/cypress-realworld-app)

