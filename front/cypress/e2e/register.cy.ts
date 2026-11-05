// Écran "Register" : création de compte.
// Le back est simulé avec cy.intercept : aucune donnée n'est réellement enregistrée.
describe('Register', () => {
  const newUser = {
    firstName: 'Lucas',
    lastName: 'Martin',
    email: 'lucas@studio.com',
    password: 'test!1234',
  };

  // Remplit les champs donnés (on peut en omettre pour tester les champs obligatoires)
  const fillForm = (fields: Partial<typeof newUser>): void => {
    Object.entries(fields).forEach(([name, value]) => {
      cy.get(`input[formControlName=${name}]`).type(value);
    });
  };

  beforeEach(() => {
    cy.visit('/register');
  });

  it('should create the account and redirect to the login page', () => {
    // 201 sans contenu : ce que renvoie le back quand l'inscription réussit
    cy.intercept('POST', '/api/auth/register', { statusCode: 201 }).as('register');

    fillForm(newUser);
    cy.get('button[type=submit]').click();

    // Le front envoie bien au back ce que l'utilisateur a saisi
    cy.wait('@register').its('request.body').should('deep.equal', newUser);
    cy.url().should('include', '/login');
  });

  it('should display an error and stay on the page when the back refuses the registration', () => {
    // Par exemple : email déjà utilisé
    cy.intercept('POST', '/api/auth/register', { statusCode: 400 }).as('register');

    fillForm(newUser);
    cy.get('button[type=submit]').click();

    cy.wait('@register');
    cy.contains('An error occurred').should('be.visible');
    cy.url().should('include', '/register');
  });

  // Un test par champ obligatoire : on remplit tous les champs SAUF celui-là
  (Object.keys(newUser) as (keyof typeof newUser)[]).forEach(missingField => {
    it(`should disable the Submit button when ${missingField} is missing`, () => {
      const { [missingField]: _omitted, ...otherFields } = newUser;

      fillForm(otherFields);

      cy.get('button[type=submit]').should('be.disabled');
    });
  });
});
