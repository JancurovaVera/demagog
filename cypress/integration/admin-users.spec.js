const ADMIN_USERS_URL = 'http://localhost:3000/admin/users';
const ADMIN_USERS_NEW_URL = 'http://localhost:3000/admin/users/new';
const LOGIN_URL = 'http://localhost:3000/admin/test-login/1';

describe('Admin Users', () => {
  it('should require authentication', () => {
    cy.visit(ADMIN_USERS_URL);

    cy.contains('Přihlášení');
  });

  it('should list users', () => {
    cy.visit(LOGIN_URL);
    cy.visit(ADMIN_USERS_URL);

    cy.get('[data-test-id="user-card"]').should('have.length', 2);

    cy.contains('Zachary Wehner');
    cy.contains('Eugenia Padberg');

    cy.get('[data-test-id="toggle-deactive-users-btn"]')
      .closest('.bp3-switch')
      .click();

    cy.get('[data-test-id="user-card"]').should('have.length', 3);

    cy.contains('Glory Turner');
  });

  it('should search users', () => {
    cy.visit(LOGIN_URL);
    cy.visit(ADMIN_USERS_URL);

    cy.get('[data-test-id="user-card"]').should('have.length', 2);

    cy.get('[data-test-id="search-input"]').type('Wehner');

    cy.get('[data-test-id="user-card"]').should('have.length', 1);

    cy.contains('Zachary Wehner');
  });

  it('should lead to new user page', () => {
    cy.visit(LOGIN_URL);
    cy.visit(ADMIN_USERS_URL);

    cy.get('[data-test-id="create-user-btn"]').click();

    cy.url().should('eq', ADMIN_USERS_NEW_URL);
  });

  it('should be possible to deactivate user', () => {
    cy.visit(LOGIN_URL);
    cy.visit(ADMIN_USERS_URL);

    cy.get('[data-test-id="user-card"]')
      .first()
      .find('[data-test-id="deactivate-user-btn"]')
      .click();

    cy.get('[data-test-id="user-card"]')
      .first()
      .find('[data-test-id="activate-user-btn"]')
      .click();
  });
});
