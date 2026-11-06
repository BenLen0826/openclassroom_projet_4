// Déconnexion, depuis le lien "Logout" de la barre du haut.
describe('Logout', () => {
  it('should log the user out and go back to the login page', () => {
    cy.login('user');

    cy.getByTestId('nav-logout-action').click();

    cy.url().should('include', '/login');
    // La barre du haut affiche à nouveau le menu d'un visiteur
    cy.getByTestId('nav-login-action').should('be.visible');
    cy.getByTestId('nav-register-action').should('be.visible');
    cy.getByTestId('nav-account-action').should('not.exist');
    cy.getByTestId('nav-logout-action').should('not.exist');
  });
});
