// Écran "Création / Modification de session" (réservé aux admins).
// Règle des sélecteurs : on localise avec data-testid (cy.getByTestId), on vérifie le contenu avec le texte.
describe('Session form', () => {
  const newSession = {
    name: 'Yoga du week-end',
    date: '2026-11-20', // format attendu par <input type="date">
    teacher: 'Hélène THIERCELIN', // texte de l'option dans la liste déroulante
    description: 'Séance longue et tonique',
  };

  // Remplit les champs donnés (on peut en omettre pour tester les champs obligatoires).
  // Chaque clé de newSession correspond au data-testid "form-<clé>-field" de son champ.
  const fillForm = (fields: Partial<typeof newSession>): void => {
    Object.entries(fields).forEach(([name, value]) => {
      if (name === 'teacher') {
        // Seul cas particulier : la liste déroulante Material, qu'on ouvre puis dont on clique l'option
        cy.getByTestId('form-teacher-field').click();
        // L'option est retrouvée par son data-testid, puis filtrée par le nom du professeur (une donnée, pas un libellé)
        cy.getByTestId('form-teacher-option').filter(`:contains("${value}")`).click();
      } else {
        // name, date, description : on tape dans le champ (input, input date ou textarea)
        cy.getByTestId(`form-${name}-field`).type(value);
      }
    });
  };

  beforeEach(() => {
    cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' }).as('teachers');
    cy.login('admin');
  });

  describe('create a session', () => {
    beforeEach(() => {
      cy.getByTestId('list-create-action').click();
      cy.wait('@teachers');
    });

    it('should display the creation title and an empty form', () => {
      cy.url().should('include', '/sessions/create');
      cy.getByTestId('form-title-text').should('have.text', 'Create session');
      cy.getByTestId('form-name-field').should('have.value', '');
    });

    it('should create the session and go back to the list', () => {
      cy.intercept('POST', '/api/session', { statusCode: 200, body: { id: 3, users: [] } }).as('create');

      fillForm(newSession);
      cy.getByTestId('form-save-action').click();

      // Le front envoie au back les valeurs saisies ; la date est convertie en Date, puis en texte ISO
      cy.wait('@create').its('request.body').should('deep.equal', {
        name: 'Yoga du week-end',
        date: '2026-11-20T00:00:00.000Z',
        teacher_id: 2,
        description: 'Séance longue et tonique',
      });
      // Snackbar Angular Material : affichée hors de nos templates, donc retrouvée par son texte
      cy.contains('Session created !').should('be.visible');
      cy.url().should('match', /\/sessions$/);
    });

    // Un test par champ obligatoire : on remplit tous les champs SAUF celui-là
    (Object.keys(newSession) as (keyof typeof newSession)[]).forEach(missingField => {
      it(`should disable the Save button when ${missingField} is missing`, () => {
        const { [missingField]: _omitted, ...otherFields } = newSession;

        fillForm(otherFields);

        cy.getByTestId('form-save-action').should('be.disabled');
      });
    });

    it('should go back to the list with the back arrow', () => {
      // Vérifie la correction de FormComponent (RouterLink manquant : la flèche ne faisait rien)
      cy.getByTestId('form-back-action').click();

      cy.url().should('match', /\/sessions$/);
    });
  });

  describe('update a session', () => {
    beforeEach(() => {
      // On modifie la session 1 ("Yoga du matin") : on la retrouve par son id dans la fixture, et par son nom dans la liste
      cy.fixture<{ id: number }[]>('sessions.json').then(sessions => {
        cy.intercept('GET', '/api/session/1', sessions.find(s => s.id === 1)).as('detail');
      });
      cy.getByTestId('list-session-item').filter(':contains("Yoga du matin")').within(() => {
        cy.getByTestId('list-session-edit-action').click();
      });
      cy.wait(['@detail', '@teachers']);
    });

    it('should display the update title and a form filled with the session', () => {
      cy.url().should('include', '/sessions/update/1');
      cy.getByTestId('form-title-text').should('have.text', 'Update session');
      cy.getByTestId('form-name-field').should('have.value', 'Yoga du matin');
      cy.getByTestId('form-date-field').should('have.value', '2026-11-10');
      cy.getByTestId('form-teacher-field').should('contain', 'Margot DELAHAYE');
      cy.getByTestId('form-description-field').should('have.value', 'Séance douce pour bien commencer la journée');
    });

    it('should update the session and go back to the list', () => {
      cy.intercept('PUT', '/api/session/1', { statusCode: 200, body: { id: 1, users: [] } }).as('update');

      cy.getByTestId('form-name-field').clear().type('Yoga du matin (modifié)');
      cy.getByTestId('form-save-action').click();

      cy.wait('@update').its('request.body').should('deep.equal', {
        name: 'Yoga du matin (modifié)',
        date: '2026-11-10T00:00:00.000Z',
        teacher_id: 1,
        description: 'Séance douce pour bien commencer la journée',
      });
      cy.contains('Session updated !').should('be.visible');
      cy.url().should('match', /\/sessions$/);
    });

    it('should disable the Save button when a required field is emptied', () => {
      cy.getByTestId('form-description-field').clear();

      cy.getByTestId('form-save-action').should('be.disabled');
    });
  });
});
