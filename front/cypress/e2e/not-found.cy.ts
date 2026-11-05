// Écran "Page not found" : toute adresse inconnue est redirigée vers /404.
// Règle des sélecteurs : on localise avec data-testid (cy.getByTestId), on vérifie le contenu avec le texte.
describe('Not found', () => {
  it('should redirect an unknown address to the 404 page', () => {
    cy.visit('/page-inexistante');

    cy.url().should('match', /\/404$/);
    cy.getByTestId('not-found-title-text').should('have.text', 'Page not found !');
  });
});
