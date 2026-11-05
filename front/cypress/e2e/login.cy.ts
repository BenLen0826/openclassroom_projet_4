// Écran "Login" : connexion.
// Le back est simulé avec cy.intercept et les fixtures (cypress/fixtures).
// Règle des sélecteurs : on localise avec data-testid (cy.getByTestId), on vérifie le contenu avec le texte.
describe('Login', () => {
  const credentials = { email: 'yoga@studio.com', password: 'test!1234' };

  beforeEach(() => {
    // Après une connexion réussie, l'application affiche la liste des sessions
    cy.intercept('GET', '/api/session', { fixture: 'sessions.json' }).as('sessions');
    cy.visit('/login');
  });

  it('should log in and display the sessions page', () => {
    cy.intercept('POST', '/api/auth/login', { fixture: 'user.json' }).as('login');

    cy.getByTestId('login-email-field').type(credentials.email);
    cy.getByTestId('login-password-field').type(credentials.password);
    cy.getByTestId('login-submit-action').click();

    // Le front envoie bien au back l'email et le mot de passe saisis
    cy.wait('@login').its('request.body').should('deep.equal', credentials);
    cy.url().should('include', '/sessions');
    // La barre du haut affiche maintenant le menu d'un utilisateur connecté
    cy.getByTestId('nav-sessions-action').should('be.visible');
    cy.getByTestId('nav-account-action').should('be.visible');
    cy.getByTestId('nav-logout-action').should('be.visible');
    cy.getByTestId('nav-login-action').should('not.exist');
  });

  it('should log in when the user presses Enter in the password field', () => {
    // Vérifie la correction du bouton "œil" : avant, Entrée affichait le mot de passe au lieu de se connecter
    cy.intercept('POST', '/api/auth/login', { fixture: 'user.json' }).as('login');

    cy.getByTestId('login-email-field').type(credentials.email);
    cy.getByTestId('login-password-field').type(`${credentials.password}{enter}`);

    cy.wait('@login');
    cy.url().should('include', '/sessions');
  });

  it('should display an error and stay on the page with wrong credentials', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401 }).as('login');

    cy.getByTestId('login-email-field').type(credentials.email);
    cy.getByTestId('login-password-field').type('wrong-password');
    cy.getByTestId('login-submit-action').click();

    cy.wait('@login');
    cy.getByTestId('login-error-message').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should disable the Submit button when the email is missing', () => {
    cy.getByTestId('login-password-field').type(credentials.password);

    cy.getByTestId('login-submit-action').should('be.disabled');
  });

  it('should disable the Submit button when the password is missing', () => {
    cy.getByTestId('login-email-field').type(credentials.email);

    cy.getByTestId('login-submit-action').should('be.disabled');
  });

  it('should send a logged user back to the sessions page when he returns to the login page', () => {
    cy.login();

    // Bouton "précédent" du navigateur : retour sur /login SANS recharger la page (l'utilisateur reste connecté)
    cy.go('back');

    // UnauthGuard le renvoie vers la liste des sessions
    cy.url().should('include', '/sessions');
    cy.getByTestId('list-session-item').should('have.length', 2);
  });
});
