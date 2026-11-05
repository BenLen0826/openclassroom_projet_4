// Déconnexion, depuis le lien "Logout" de la barre du haut.
describe('Logout', () => {
  it('should log the user out and go back to the login page', () => {
    cy.login('user');

    cy.contains('mat-toolbar span', 'Logout').click();

    cy.url().should('include', '/login');
    // La barre du haut affiche à nouveau le menu d'un visiteur
    cy.get('mat-toolbar').should('contain', 'Login').and('contain', 'Register')
      .and('not.contain', 'Account').and('not.contain', 'Logout');
  });
});
