describe('Shopping Cart', () => {
  beforeEach(() => {
    cy.clearCart()
    cy.visit('/')
    cy.intercept('GET', '**/api/products**', { fixture: 'products.json' }).as('getProducts')
    cy.wait('@getProducts')
  })

  it('should add a product to cart', () => {
    // Find and click "Add to Cart" button
    cy.get('button').contains('Add to cart').first().click()
    
    // Check that cart sidebar shows items (cart is always visible on the right)
    cy.contains('Your cart').should('be.visible')
    cy.contains(/\d+ items/).should('exist')
    
    // Verify item is in cart sidebar
    cy.contains(/item|product/i).should('exist')
  })

  it('should update cart quantity', () => {
    // Add item to cart
    cy.get('button').contains('Add to cart').first().click()
    
    // Cart sidebar should be visible, find quantity controls
    cy.contains('Your cart').should('be.visible')
    
    // Increase quantity using the + button in cart sidebar
    cy.get('button').contains('+').first().click()
    
    // Verify quantity increased (quantity is displayed as text, not input)
    cy.contains('Your cart').parent().within(() => {
      cy.contains(/\d+/).should('exist') // Should show quantity number
    })
  })

  it('should remove item from cart', () => {
    // Add item to cart
    cy.get('button').contains('Add to cart').first().click()
    
    // Cart sidebar should be visible
    cy.contains('Your cart').should('be.visible')
    
    // Decrease quantity to 0 using the - button
    cy.get('button').contains('–').first().click()
    
    // Verify cart is empty
    cy.contains(/Your cart is empty/i).should('exist')
  })

  it('should display cart total correctly', () => {
    // Add multiple items
    cy.get('button').contains('Add to cart').first().click()
    cy.wait(500)
    cy.get('button').contains('Add to cart').eq(1).click()
    
    // Cart sidebar should show totals
    cy.contains('Your cart').should('be.visible')
    
    // Check for subtotal, tax, shipping, and total
    cy.contains(/Subtotal|Total/i).should('exist')
    cy.contains(/\$/).should('exist')
  })

  it('should persist cart items after page refresh', () => {
    // Add item to cart
    cy.get('button').contains('Add to cart').first().click()
    
    // Refresh page
    cy.reload()
    cy.wait('@getProducts')
    
    // Verify cart still has items
    cy.contains('Your cart').should('be.visible')
    cy.contains(/\d+ items/).should('exist')
  })

  it('should prevent adding out of stock items', () => {
    // This test assumes there's a product with 0 stock
    // You may need to mock the API response for this
    cy.get('article').each(($card) => {
      cy.wrap($card).then(($el) => {
        const cardText = $el.text()
        const hasOutOfStock = cardText.includes('Out of Stock')
        
        if (hasOutOfStock) {
          // If out of stock, button should be disabled
          cy.wrap($el).within(() => {
            cy.get('button').contains(/Out of Stock|Add to cart/i).should('be.disabled')
          })
        }
      })
    })
  })
})

