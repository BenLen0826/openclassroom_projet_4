// Écran "Register" : création de compte.
// Le back est simulé avec cy.intercept : aucune donnée n'est réellement enregistrée.
describe('Register', () => {
  const newUser = {
    firstName: 'Lucas',
    lastName: 'Martin',
    email: 'lucas@studio.com',
    password: 'test!1234',
  };

  // data-testid de chaque champ du formulaire
  const fieldTestIds: Record<keyof typeof newUser, string> = {
    firstName: 'register-first-name-field',
    lastName: 'register-last-name-field',
    email: 'register-email-field',
    password: 'register-password-field',
  };

  // Remplit les champs donnés (on peut en omettre pour tester les champs obligatoires)
  const fillForm = (fields: Partial<typeof newUser>): void => {
    (Object.entries(fields) as [keyof typeof newUser, string][]).forEach(([name, value]) => {
      cy.getByTestId(fieldTestIds[name]).type(value);
    });
  };

  beforeEach(() => {
    cy.visit('/register');
  });

  it('should create the account and redirect to the login page', () => {
    // 201 sans contenu : ce que renvoie le back quand l'inscription réussit
    cy.intercept('POST', '/api/auth/register', { statusCode: 201 }).as('register');

    fillForm(newUser);
    cy.getByTestId('register-submit-action').click();

    // Le front envoie bien au back ce que l'utilisateur a saisi
    cy.wait('@register').its('request.body').should('deep.equal', newUser);
    cy.url().should('include', '/login');
  });

  it('should display an error and stay on the page when the back refuses the registration', () => {
    // Par exemple : email déjà utilisé
    cy.intercept('POST', '/api/auth/register', { statusCode: 400 }).as('register');

    fillForm(newUser);
    cy.getByTestId('register-submit-action').click();

    cy.wait('@register');
    cy.getByTestId('register-error-message').should('be.visible');
    cy.url().should('include', '/register');
  });

  // Un test par champ obligatoire : on remplit tous les champs SAUF celui-là
  (Object.keys(newUser) as (keyof typeof newUser)[]).forEach(missingField => {
    it(`should disable the Submit button when ${missingField} is missing`, () => {
      const { [missingField]: _omitted, ...otherFields } = newUser;

      fillForm(otherFields);

      cy.getByTestId('register-submit-action').should('be.disabled');
    });
  });
});
