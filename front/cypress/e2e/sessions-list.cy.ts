// Écran "Sessions" : liste des sessions (cypress/fixtures/sessions.json, renvoyée par cy.login).
// Règle des sélecteurs : on localise avec data-testid (cy.getByTestId), on vérifie le contenu avec le texte.
describe('Sessions list', () => {
  // La carte d'une session, retrouvée par le nom de la session et non par sa position dans la liste
  const sessionCard = (sessionName: string) =>
    cy.getByTestId('list-session-item').filter(`:contains("${sessionName}")`);

  it('should display the sessions with the Create and Edit buttons for an admin', () => {
    cy.login('admin');

    cy.getByTestId('list-session-item').should('have.length', 2);
    sessionCard('Yoga du matin')
      .should('contain', 'Session on November 10, 2026')
      .and('contain', 'Séance douce pour bien commencer la journée');
    sessionCard('Yoga du soir')
      .should('contain', 'Session on November 12, 2026')
      .and('contain', 'Séance relaxante pour finir la journée');

    cy.getByTestId('list-create-action').should('be.visible');
    // Chaque carte a un bouton Detail et un bouton Edit
    cy.getByTestId('list-session-detail-action').should('have.length', 2);
    cy.getByTestId('list-session-edit-action').should('have.length', 2);
  });

  it('should only display the Detail buttons for a non-admin user', () => {
    cy.login('user');

    cy.getByTestId('list-session-item').should('have.length', 2);
    cy.getByTestId('list-session-detail-action').should('have.length', 2);
    cy.getByTestId('list-create-action').should('not.exist');
    cy.getByTestId('list-session-edit-action').should('not.exist');
  });

  it('should send a visitor who is not logged in to the login page', () => {
    cy.visit('/sessions');

    // AuthGuard : sans connexion, pas d'accès aux sessions
    cy.url().should('include', '/login');
  });
});
