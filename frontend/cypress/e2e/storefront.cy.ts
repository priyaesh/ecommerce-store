describe('Storefront', () => {
  beforeEach(() => {
    // Visit the homepage
    cy.visit('/')
    // Wait for products to load
    cy.intercept('GET', '**/api/products**', { fixture: 'products.json' }).as('getProducts')
  })

  it('should display the storefront with products', () => {
    // Wait for products to load
    cy.wait('@getProducts')
    // Check that products are displayed (products are in article tags)
    cy.get('article').should('have.length.at.least', 1)
  })

  it('should display product information correctly', () => {
    cy.wait('@getProducts')
    // Check for product name, price, and image
    cy.get('article').first().within(() => {
      cy.get('h3').should('exist') // Product name
      cy.contains(/\$/).should('exist') // Price
      cy.get('img').should('exist') // Product image
    })
  })

  it('should filter products by category', () => {
    cy.wait('@getProducts')
    // Look for category filter buttons (All, Electronics, Furniture, etc.)
    cy.get('button').contains('All').should('exist')
    // Click a category button if available
    cy.get('button').contains(/electronics|furniture|lighting/i).first().then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click()
        // Products should still be visible after filtering
        cy.get('article').should('have.length.at.least', 1)
      }
    })
  })

  it('should search for products', () => {
    cy.wait('@getProducts')
    // Find search input
    cy.get('input[type="search"]').type('desk')
    // Wait a moment for search to process
    cy.wait(500)
    // Products matching search should be visible or show "No products found"
    cy.get('article, p').contains(/products found|No products/i).should('exist')
  })

  it('should display stock information', () => {
    cy.wait('@getProducts')
    // Check for stock indicators in product cards
    cy.get('article').first().within(() => {
      // Should show stock status, quantity, or "Add to cart" button
      cy.get('button').contains(/Add to cart|Out of Stock|in stock/i).should('exist')
    })
  })

  it('should show featured products section', () => {
    cy.wait('@getProducts')
    // Look for featured section
    cy.contains(/featured|popular|trending/i).should('exist')
  })
})

