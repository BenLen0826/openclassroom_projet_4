// Écran "Account" : informations du compte de l'utilisateur connecté, et suppression du compte.
// Fixtures : me-user.json (utilisateur 2, Lucas Martin) et me-admin.json (admin, id 1).
describe('Account', () => {
  // Depuis n'importe quelle page, clique sur "Account" dans la barre du haut
  const openAccount = (): void => {
    cy.contains('mat-toolbar span', 'Account').click();
    cy.wait('@me');
  };

  describe('as a user', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/2', { fixture: 'me-user.json' }).as('me');
      cy.login('user');
      openAccount();
    });

    it('should display the user information and the delete button', () => {
      cy.url().should('include', '/me');
      cy.contains('Name: Lucas MARTIN').should('be.visible'); // nom de famille en majuscules (pipe uppercase)
      cy.contains('Email: lucas@studio.com').should('be.visible');
      cy.contains('September 1, 2026').should('be.visible');  // createdAt
      cy.contains('October 20, 2026').should('be.visible');   // updatedAt
      cy.contains('Delete my account').should('be.visible');
      cy.contains('button', 'Delete').should('be.visible');
      cy.contains('You are admin').should('not.exist');
    });

    it('should go back to the previous page with the back arrow', () => {
      cy.contains('button', 'arrow_back').click();

      cy.url().should('match', /\/sessions$/);
    });

    it('should delete the account, log the user out and go back to the login page', () => {
      cy.intercept('DELETE', '/api/user/2', { statusCode: 200 }).as('deleteAccount');

      cy.contains('button', 'Delete').click();

      cy.wait('@deleteAccount');
      cy.contains('Your account has been deleted !').should('be.visible'); // snackbar
      // L'utilisateur est déconnecté : la barre du haut affiche à nouveau Login / Register
      cy.get('mat-toolbar').should('contain', 'Login').and('contain', 'Register').and('not.contain', 'Logout');
      cy.url().should('include', '/login');
    });
  });

  describe('as an admin', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/1', { fixture: 'me-admin.json' }).as('me');
      cy.login('admin');
      openAccount();
    });

    it('should display "You are admin" and no delete button', () => {
      cy.contains('Name: Admin ADMIN').should('be.visible');
      cy.contains('Email: yoga@studio.com').should('be.visible');
      cy.contains('You are admin').should('be.visible');
      cy.contains('Delete my account').should('not.exist');
      cy.contains('button', 'Delete').should('not.exist');
    });
  });
});
