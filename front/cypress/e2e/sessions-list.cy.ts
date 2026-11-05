// Écran "Sessions" : liste des sessions (cypress/fixtures/sessions.json, renvoyée par cy.login).
describe('Sessions list', () => {
  it('should display the sessions with the Create and Edit buttons for an admin', () => {
    cy.login('admin');

    cy.get('mat-card.item').should('have.length', 2);
    // Chaque carte est retrouvée par le nom de sa session, et non par sa position dans la liste
    cy.contains('mat-card.item', 'Yoga du matin')
      .should('contain', 'Session on November 10, 2026')
      .and('contain', 'Séance douce pour bien commencer la journée');
    cy.contains('mat-card.item', 'Yoga du soir')
      .should('contain', 'Session on November 12, 2026')
      .and('contain', 'Séance relaxante pour finir la journée');

    cy.contains('button', 'Create').should('be.visible');
    cy.get('mat-card.item').each(card => {
      cy.wrap(card).contains('button', 'Detail').should('be.visible');
      cy.wrap(card).contains('button', 'Edit').should('be.visible');
    });
  });

  it('should only display the Detail buttons for a non-admin user', () => {
    cy.login('user');

    cy.get('mat-card.item').should('have.length', 2);
    cy.contains('button', 'Create').should('not.exist');
    cy.contains('button', 'Edit').should('not.exist');
    cy.get('mat-card.item').each(card => {
      cy.wrap(card).contains('button', 'Detail').should('be.visible');
    });
  });

  it('should send a visitor who is not logged in to the login page', () => {
    cy.visit('/sessions');

    // AuthGuard : sans connexion, pas d'accès aux sessions
    cy.url().should('include', '/login');
  });
});
