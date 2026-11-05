// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// ***********************************************
// Commandes du projet
// ***********************************************

// Déclare la commande pour TypeScript (autocomplétion et vérification de type dans les tests)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Connecte un utilisateur en passant par le vrai formulaire de connexion,
       * avec une réponse du back simulée (fixture admin.json ou user.json).
       * Attention : la connexion n'est gardée qu'en mémoire. Après cy.login(), il faut
       * naviguer en cliquant dans l'application : un cy.visit() rechargerait la page et déconnecterait l'utilisateur.
       * @example cy.login('admin')
       */
      login(role?: 'admin' | 'user'): Chainable<void>;

      /**
       * Trouve le ou les éléments qui portent l'attribut data-testid donné.
       * Les data-testid sont ajoutés dans les templates uniquement pour les tests : ils ne changent
       * ni avec le texte affiché, ni avec la structure HTML ou les composants Material utilisés.
       * @example cy.getByTestId('login-submit-action').click()
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('getByTestId', (testId: string) => {
  // Valeur entre guillemets : le sélecteur reste valide même si le nom contient un point, un espace ou commence par un chiffre
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('login', (role: 'admin' | 'user' = 'user') => {
  // Réponses simulées du back : la connexion, puis la liste des sessions affichée juste après
  cy.intercept('POST', '/api/auth/login', { fixture: `${role}.json` }).as('login');
  cy.intercept('GET', '/api/session', { fixture: 'sessions.json' }).as('sessions');

  cy.visit('/login');
  // L'email tapé est celui de la fixture (admin.json ou user.json) : ce qu'on saisit et ce que "répond le back" restent cohérents
  cy.fixture<{ username: string }>(`${role}.json`).then(user => {
    cy.getByTestId('login-email-field').type(user.username);
  });
  cy.getByTestId('login-password-field').type('test!1234');
  cy.getByTestId('login-submit-action').click();

  cy.wait('@login');
  cy.url().should('include', '/sessions');
});

// Fait de ce fichier un module, nécessaire pour "declare global"
export {};
