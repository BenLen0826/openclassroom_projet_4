// Écran "Account" : informations du compte de l'utilisateur connecté, et suppression du compte.
// Fixtures : me-user.json (utilisateur 2, Lucas Martin) et me-admin.json (admin, id 1).
describe('Account', () => {
  // Depuis n'importe quelle page, clique sur "Account" dans la barre du haut
  const openAccount = (): void => {
    cy.getByTestId('nav-account-action').click();
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
      cy.getByTestId('me-name-text').should('contain', 'Lucas MARTIN'); // nom de famille en majuscules (pipe uppercase)
      cy.getByTestId('me-email-text').should('contain', 'lucas@studio.com');
      cy.getByTestId('me-created-at-text').should('contain', 'September 1, 2026');
      cy.getByTestId('me-updated-at-text').should('contain', 'October 20, 2026');
      cy.getByTestId('me-delete-action').should('be.visible');
      cy.getByTestId('me-admin-message').should('not.exist');
    });

    it('should go back to the previous page with the back arrow', () => {
      cy.getByTestId('me-back-action').click();

      cy.url().should('match', /\/sessions$/);
    });

    it('should delete the account, log the user out and go back to the login page', () => {
      cy.intercept('DELETE', '/api/user/2', { statusCode: 200 }).as('deleteAccount');

      cy.getByTestId('me-delete-action').click();

      cy.wait('@deleteAccount');
      // Snackbar Angular Material : affichée hors de nos templates, donc retrouvée par son texte
      cy.contains('Your account has been deleted !').should('be.visible');
      // L'utilisateur est déconnecté : la barre du haut affiche à nouveau Login / Register
      cy.getByTestId('nav-login-action').should('be.visible');
      cy.getByTestId('nav-register-action').should('be.visible');
      cy.getByTestId('nav-logout-action').should('not.exist');
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
      cy.getByTestId('me-name-text').should('contain', 'Admin ADMIN');
      cy.getByTestId('me-email-text').should('contain', 'yoga@studio.com');
      cy.getByTestId('me-admin-message').should('be.visible');
      cy.getByTestId('me-delete-action').should('not.exist');
    });
  });
});
