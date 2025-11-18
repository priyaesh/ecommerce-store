/// <reference types="cypress" />

// Custom commands for Cypress tests

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  // Wait for redirect or success message
  cy.url().should('not.include', '/login', { timeout: 10000 })
})

Cypress.Commands.add('register', (email: string, password: string, name: string) => {
  cy.visit('/register')
  cy.get('input[name="name"]').type(name)
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  // Wait for redirect or success message
  cy.url().should('not.include', '/register', { timeout: 10000 })
})

Cypress.Commands.add('addToCart', (productName: string) => {
  cy.contains(productName).parents('article').within(() => {
    cy.get('button').contains('Add to cart').click()
  })
})

Cypress.Commands.add('clearCart', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
  })
})

