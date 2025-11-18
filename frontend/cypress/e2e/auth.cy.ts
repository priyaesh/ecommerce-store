describe('Authentication', () => {
  const testUser = {
    email: 'cypress-test@example.com',
    password: 'TestPassword123!',
    name: 'Cypress Test User'
  }

  beforeEach(() => {
    cy.clearCart()
    // Clear any existing auth tokens
    cy.window().then((win) => {
      win.localStorage.removeItem('token')
      win.localStorage.removeItem('user')
    })
  })

  it('should display login page', () => {
    cy.visit('/login')
    cy.contains(/sign in|login/i).should('be.visible')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })

  it('should display register page', () => {
    cy.visit('/register')
    cy.contains(/sign up|register|create account/i).should('be.visible')
    cy.get('input[name="name"], input[placeholder*="name" i]').should('exist')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })

  it('should register a new user', () => {
    cy.visit('/register')
    
    // Fill in registration form
    cy.get('input[name="name"], input[placeholder*="name" i]').type(testUser.name)
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should redirect to home or show success message
    cy.url({ timeout: 10000 }).should('not.include', '/register')
  })

  it('should login with valid credentials', () => {
    // First register the user
    cy.register(testUser.email, testUser.password, testUser.name)
    
    // Then login
    cy.visit('/login')
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    cy.get('button[type="submit"]').click()
    
    // Should redirect to home or profile
    cy.url({ timeout: 10000 }).should('not.include', '/login')
    
    // Should show user info in header
    cy.contains(testUser.name).should('exist')
  })

  it('should show error for invalid login credentials', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type('invalid@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    // Should show error message
    cy.contains(/invalid|incorrect|error/i, { timeout: 5000 }).should('exist')
  })

  it('should logout user', () => {
    // Login first
    cy.register(testUser.email, testUser.password, testUser.name)
    cy.login(testUser.email, testUser.password)
    
    // Click logout button
    cy.get('button').contains(/logout|sign out/i).click()
    
    // Should redirect to home and show login button
    cy.url().should('not.include', '/profile')
    cy.contains(/login|sign in/i).should('exist')
  })

  it('should persist user session after page refresh', () => {
    // Login
    cy.register(testUser.email, testUser.password, testUser.name)
    cy.login(testUser.email, testUser.password)
    
    // Refresh page
    cy.reload()
    
    // User should still be logged in
    cy.contains(testUser.name).should('exist')
  })

  it('should show profile page for logged in user', () => {
    // Login
    cy.register(testUser.email, testUser.password, testUser.name)
    cy.login(testUser.email, testUser.password)
    
    // Visit profile page
    cy.visit('/profile')
    
    // Should show user information
    cy.contains(testUser.name).should('exist')
    cy.contains(testUser.email).should('exist')
  })

  it('should redirect to login when accessing protected route while logged out', () => {
    // Visit profile without being logged in
    cy.visit('/profile')
    
    // Should redirect to login
    cy.url().should('include', '/login')
  })
})

