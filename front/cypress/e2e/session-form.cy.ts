// Écran "Création / Modification de session" (réservé aux admins).
describe('Session form', () => {
  const newSession = {
    name: 'Yoga du week-end',
    date: '2026-11-20', // format attendu par <input type="date">
    teacher: 'Hélène THIERCELIN', // texte de l'option dans la liste déroulante
    description: 'Séance longue et tonique',
  };

  // Remplit les champs donnés (on peut en omettre pour tester les champs obligatoires)
  const fillForm = (fields: Partial<typeof newSession>): void => {
    if (fields.name) cy.get('input[formControlName=name]').type(fields.name);
    if (fields.date) cy.get('input[formControlName=date]').type(fields.date);
    if (fields.teacher) {
      // Liste déroulante Material : on l'ouvre, puis on clique sur l'option
      cy.get('mat-select[formControlName=teacher_id]').click();
      cy.contains('mat-option', fields.teacher).click();
    }
    if (fields.description) cy.get('textarea[formControlName=description]').type(fields.description);
  };

  beforeEach(() => {
    cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' }).as('teachers');
    cy.login('admin');
  });

  describe('create a session', () => {
    beforeEach(() => {
      cy.contains('button', 'Create').click();
      cy.wait('@teachers');
    });

    it('should display the creation title and an empty form', () => {
      cy.url().should('include', '/sessions/create');
      cy.get('h1').should('have.text', 'Create session');
      cy.get('input[formControlName=name]').should('have.value', '');
    });

    it('should create the session and go back to the list', () => {
      cy.intercept('POST', '/api/session', { statusCode: 200, body: { id: 3, users: [] } }).as('create');

      fillForm(newSession);
      cy.get('button[type=submit]').click();

      // Le front envoie au back les valeurs saisies ; la date est convertie en Date, puis en texte ISO
      cy.wait('@create').its('request.body').should('deep.equal', {
        name: 'Yoga du week-end',
        date: '2026-11-20T00:00:00.000Z',
        teacher_id: 2,
        description: 'Séance longue et tonique',
      });
      cy.contains('Session created !').should('be.visible'); // snackbar
      cy.url().should('match', /\/sessions$/);
    });

    // Un test par champ obligatoire : on remplit tous les champs SAUF celui-là
    (Object.keys(newSession) as (keyof typeof newSession)[]).forEach(missingField => {
      it(`should disable the Save button when ${missingField} is missing`, () => {
        const { [missingField]: _omitted, ...otherFields } = newSession;

        fillForm(otherFields);

        cy.get('button[type=submit]').should('be.disabled');
      });
    });

    it('should go back to the list with the back arrow', () => {
      // Vérifie la correction de FormComponent (RouterLink manquant : la flèche ne faisait rien)
      cy.contains('button', 'arrow_back').click();

      cy.url().should('match', /\/sessions$/);
    });
  });

  describe('update a session', () => {
    beforeEach(() => {
      // On modifie la session 1 ("Yoga du matin") : on la retrouve par son id dans la fixture, et par son nom dans la liste
      cy.fixture<{ id: number }[]>('sessions.json').then(sessions => {
        cy.intercept('GET', '/api/session/1', sessions.find(s => s.id === 1)).as('detail');
      });
      cy.contains('mat-card.item', 'Yoga du matin').contains('button', 'Edit').click();
      cy.wait(['@detail', '@teachers']);
    });

    it('should display the update title and a form filled with the session', () => {
      cy.url().should('include', '/sessions/update/1');
      cy.get('h1').should('have.text', 'Update session');
      cy.get('input[formControlName=name]').should('have.value', 'Yoga du matin');
      cy.get('input[formControlName=date]').should('have.value', '2026-11-10');
      cy.get('mat-select[formControlName=teacher_id]').should('contain', 'Margot DELAHAYE');
      cy.get('textarea[formControlName=description]')
        .should('have.value', 'Séance douce pour bien commencer la journée');
    });

    it('should update the session and go back to the list', () => {
      cy.intercept('PUT', '/api/session/1', { statusCode: 200, body: { id: 1, users: [] } }).as('update');

      cy.get('input[formControlName=name]').clear().type('Yoga du matin (modifié)');
      cy.get('button[type=submit]').click();

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
      cy.get('textarea[formControlName=description]').clear();

      cy.get('button[type=submit]').should('be.disabled');
    });
  });
});
