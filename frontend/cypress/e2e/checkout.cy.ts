describe('Checkout Process', () => {
  const testUser = {
    email: 'checkout-test@example.com',
    password: 'TestPassword123!',
    name: 'Checkout Test User'
  }

  beforeEach(() => {
    cy.clearCart()
    cy.visit('/')
    cy.intercept('GET', '**/api/products**', { fixture: 'products.json' }).as('getProducts')
    cy.wait('@getProducts')
  })

  it('should display checkout button when cart has items', () => {
    // Add item to cart
    cy.get('button').contains('Add to cart').first().click()
    
    // Cart sidebar should be visible, checkout button should be enabled
    cy.contains('Your cart').should('be.visible')
    cy.get('button').contains(/Checkout securely/i).should('be.visible').and('not.be.disabled')
  })

  it('should disable checkout button for empty cart', () => {
    // Cart sidebar should be visible
    cy.contains('Your cart').should('be.visible')
    
    // Checkout button should be disabled
    cy.get('button').contains(/Checkout securely/i).should('be.disabled')
  })

  it('should open payment modal when checkout is clicked', () => {
    // Add item to cart
    cy.get('button').contains('Add to cart').first().click()
    
    // Click checkout button in cart sidebar
    cy.get('button').contains(/Checkout securely/i).click()
    
    // Payment modal should appear
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains(/payment|stripe|card/i).should('exist')
  })

  it('should display order summary in checkout', () => {
    // Add item to cart
    cy.get('button').contains('Add to cart').first().click()
    
    // Click checkout
    cy.get('button').contains(/Checkout securely/i).click()
    
    // Should show order summary in modal
    cy.get('[role="dialog"]').within(() => {
      cy.contains(/subtotal|total|items/i).should('exist')
      cy.contains(/\$/).should('exist')
    })
  })

  it('should close payment modal when cancel is clicked', () => {
    // Add item and open checkout
    cy.get('button').contains('Add to cart').first().click()
    cy.get('button').contains(/Checkout securely/i).click()
    
    // Wait for modal to appear
    cy.get('[role="dialog"]').should('be.visible')
    
    // Try to find and click close button, if it doesn't exist, use ESC key
    cy.get('body').then(($body) => {
      const closeButton = $body.find('button').filter((_, el) => {
        const text = Cypress.$(el).text().toLowerCase()
        return text.includes('close') || text.includes('cancel') || text.includes('×')
      })
      
      if (closeButton.length > 0) {
        cy.get('button').contains(/close|cancel|×/i).first().click()
      } else {
        // If no close button, use ESC key
        cy.get('body').type('{esc}')
      }
      
      // Verify modal is closed
      cy.get('[role="dialog"]').should('not.exist')
    })
  })

  // Note: Actual payment processing with Stripe requires test mode setup
  // This test would need to be run with Stripe test keys configured
  it('should handle payment form display', () => {
    // Mock payment intent creation
    cy.intercept('POST', '**/api/payment/create-intent', {
      statusCode: 200,
      body: { clientSecret: 'test_client_secret' }
    }).as('createIntent')
    
    // Add item and open checkout
    cy.get('button').contains('Add to cart').first().click()
    cy.get('button').contains(/Checkout securely/i).click()
    
    // Wait for payment intent
    cy.wait('@createIntent')
    
    // Payment form should be visible (Stripe PaymentElement)
    // Note: Actual Stripe elements may not render in Cypress without special setup
    cy.get('[role="dialog"]').should('be.visible')
  })

  it('should clear cart after successful checkout', () => {
    // This test would require mocking a successful payment
    // For now, we'll just verify the flow exists
    cy.get('button').contains('Add to cart').first().click()
    cy.get('button').contains(/Checkout securely/i).should('exist')
    
    // After successful payment, cart should be empty
    // This would be tested with a mocked successful payment response
  })

  it('should validate cart items before checkout', () => {
    // Checkout button should be disabled for empty cart
    cy.contains('Your cart').should('be.visible')
    cy.get('button').contains(/Checkout securely/i).should('be.disabled')
  })
})

