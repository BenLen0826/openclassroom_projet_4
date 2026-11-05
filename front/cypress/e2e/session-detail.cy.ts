// Écran "Informations session" : détail d'une session, participation et suppression.
// Rappel des fixtures : session 1 = "Yoga du matin", sans participant, professeure 1 (Margot DELAHAYE) ;
// session 2 = "Yoga du soir", l'utilisateur 2 (user.json) y participe, professeure 2 (Hélène THIERCELIN).
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

  // Clique sur "Detail" de la carte qui porte ce nom, comme le ferait un utilisateur
  const openDetail = (sessionName: string): void => {
    cy.contains('mat-card.item', sessionName).contains('button', 'Detail').click();
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
      cy.get('h1').should('have.text', 'Yoga Du Matin'); // pipe titlecase
      cy.contains('Margot DELAHAYE').should('be.visible');
      cy.contains('0 attendees').should('be.visible');
      cy.contains('November 10, 2026').should('be.visible');
      cy.contains('Séance douce pour bien commencer la journée').should('be.visible');
      cy.get('.created').should('contain', 'October 1, 2026');
      cy.get('.updated').should('contain', 'October 15, 2026');
      // Pas de bouton Delete pour un utilisateur qui n'est pas admin
      cy.contains('button', 'Delete').should('not.exist');
    });

    it('should let the user participate in a session', () => {
      interceptDetail(1); // l'utilisateur 2 ne participe pas encore
      openDetail('Yoga du matin');
      cy.intercept('POST', '/api/session/1/participate/2', { statusCode: 200 }).as('participate');
      // Après la participation, le composant recharge la session : le back renvoie maintenant l'utilisateur 2
      interceptDetail(1, [2]);

      cy.contains('button', 'Participate').click();

      cy.wait('@participate');
      cy.contains('button', 'Do not participate').should('be.visible');
      cy.contains('1 attendees').should('be.visible');
    });

    it('should let the user cancel his participation', () => {
      interceptDetail(2); // l'utilisateur 2 participe déjà à la session 2
      openDetail('Yoga du soir');
      cy.intercept('DELETE', '/api/session/2/participate/2', { statusCode: 200 }).as('unParticipate');
      interceptDetail(2, []);

      cy.contains('button', 'Do not participate').click();

      cy.wait('@unParticipate');
      // cy.contains respecte les majuscules : "Participate" ne correspond pas à "Do not participate"
      cy.contains('button', 'Participate').should('be.visible');
      cy.contains('0 attendees').should('be.visible');
    });

    it('should go back to the list with the back arrow', () => {
      interceptDetail(1);
      openDetail('Yoga du matin');

      cy.contains('button', 'arrow_back').click();

      cy.url().should('match', /\/sessions$/);
      cy.get('mat-card.item').should('have.length', 2);
    });
  });

  describe('as an admin', () => {
    beforeEach(() => {
      cy.login('admin');
      interceptDetail(1);
      openDetail('Yoga du matin');
    });

    it('should display the Delete button and no participation button', () => {
      cy.contains('button', 'Delete').should('be.visible');
      cy.contains('button', 'Participate').should('not.exist');
    });

    it('should delete the session and go back to the list', () => {
      cy.intercept('DELETE', '/api/session/1', { statusCode: 200 }).as('delete');

      cy.contains('button', 'Delete').click();

      cy.wait('@delete');
      cy.contains('Session deleted !').should('be.visible'); // snackbar
      cy.url().should('match', /\/sessions$/);
    });
  });
});
