// Écran "Page not found" : toute adresse inconnue est redirigée vers /404.
describe('Not found', () => {
  it('should redirect an unknown address to the 404 page', () => {
    cy.visit('/page-inexistante');

    cy.url().should('match', /\/404$/);
    cy.contains('h1', 'Page not found !').should('be.visible');
  });
});
