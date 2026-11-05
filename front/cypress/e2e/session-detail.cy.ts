// Écran "Informations session" : détail d'une session, participation et suppression.
// Rappel des fixtures : session 1 = "Yoga du matin", sans participant, professeure 1 (Margot DELAHAYE) ;
// session 2 = "Yoga du soir", l'utilisateur 2 (user.json) y participe, professeure 2 (Hélène THIERCELIN).
// Règle des sélecteurs : on localise avec data-testid (cy.getByTestId), on vérifie le contenu avec le texte.
describe('Session detail', () => {
  // Prépare les réponses du back pour le détail d'une session : la session, puis son professeur.
  // La session est désignée par son id, et son professeur est retrouvé par teacher_id, comme le fait l'application.
  // "users" permet de modifier la liste des participants renvoyée par le back.
  const interceptDetail = (sessionId: number, users?: number[]): void => {
    cy.fixture<{ id: number; teacher_id: number; users: number[] }[]>('sessions.json').then(sessions => {
      const session = sessions.find(s => s.id === sessionId)!;
      cy.intercept('GET', `/api/session/${session.id}`, { ...session, users: users ?? session.users }).as('detail');

      cy.fixture<{ id: number }[]>('teachers.json').then(teachers => {
        const teacher = teachers.find(t => t.id === session.teacher_id)!;
        cy.intercept('GET', `/api/teacher/${teacher.id}`, teacher).as('teacher');
      });
    });
  };

  // Clique sur "Detail" dans la carte de la session qui porte ce nom
  const openDetail = (sessionName: string): void => {
    cy.getByTestId('list-session-item').filter(`:contains("${sessionName}")`).within(() => {
      cy.getByTestId('list-session-detail-action').click();
    });
    cy.wait(['@detail', '@teacher']);
  };

  describe('as a user', () => {
    beforeEach(() => {
      cy.login('user');
    });

    it('should display the session information', () => {
      interceptDetail(1);
      openDetail('Yoga du matin');

      cy.url().should('include', '/sessions/detail/1');
      cy.getByTestId('detail-name-text').should('have.text', 'Yoga Du Matin'); // pipe titlecase
      cy.getByTestId('detail-teacher-text').should('have.text', 'Margot DELAHAYE');
      cy.getByTestId('detail-attendees-text').should('contain', '0 attendees');
      cy.getByTestId('detail-date-text').should('have.text', 'November 10, 2026');
      cy.getByTestId('detail-description-text').should('contain', 'Séance douce pour bien commencer la journée');
      cy.getByTestId('detail-created-at-text').should('contain', 'October 1, 2026');
      cy.getByTestId('detail-updated-at-text').should('contain', 'October 15, 2026');
      // Pas de bouton Delete pour un utilisateur qui n'est pas admin
      cy.getByTestId('detail-delete-action').should('not.exist');
    });

    it('should let the user participate in a session', () => {
      interceptDetail(1); // l'utilisateur 2 ne participe pas encore
      openDetail('Yoga du matin');
      cy.intercept('POST', '/api/session/1/participate/2', { statusCode: 200 }).as('participate');
      // Après la participation, le composant recharge la session : le back renvoie maintenant l'utilisateur 2
      interceptDetail(1, [2]);

      cy.getByTestId('detail-participate-action').click();

      cy.wait('@participate');
      cy.getByTestId('detail-unparticipate-action').should('be.visible');
      cy.getByTestId('detail-participate-action').should('not.exist');
      cy.getByTestId('detail-attendees-text').should('contain', '1 attendees');
    });

    it('should let the user cancel his participation', () => {
      interceptDetail(2); // l'utilisateur 2 participe déjà à la session 2
      openDetail('Yoga du soir');
      cy.intercept('DELETE', '/api/session/2/participate/2', { statusCode: 200 }).as('unParticipate');
      interceptDetail(2, []);

      cy.getByTestId('detail-unparticipate-action').click();

      cy.wait('@unParticipate');
      cy.getByTestId('detail-participate-action').should('be.visible');
      cy.getByTestId('detail-unparticipate-action').should('not.exist');
      cy.getByTestId('detail-attendees-text').should('contain', '0 attendees');
    });

    it('should go back to the list with the back arrow', () => {
      interceptDetail(1);
      openDetail('Yoga du matin');

      cy.getByTestId('detail-back-action').click();

      cy.url().should('match', /\/sessions$/);
      cy.getByTestId('list-session-item').should('have.length', 2);
    });
  });

  describe('as an admin', () => {
    beforeEach(() => {
      cy.login('admin');
      interceptDetail(1);
      openDetail('Yoga du matin');
    });

    it('should display the Delete button and no participation button', () => {
      cy.getByTestId('detail-delete-action').should('be.visible');
      cy.getByTestId('detail-participate-action').should('not.exist');
      cy.getByTestId('detail-unparticipate-action').should('not.exist');
    });

    it('should delete the session and go back to the list', () => {
      cy.intercept('DELETE', '/api/session/1', { statusCode: 200 }).as('delete');

      cy.getByTestId('detail-delete-action').click();

      cy.wait('@delete');
      // Snackbar Angular Material : affichée hors de nos templates, donc pas de data-testid → on la retrouve par son texte
      cy.contains('Session deleted !').should('be.visible');
      cy.url().should('match', /\/sessions$/);
    });
  });
});
