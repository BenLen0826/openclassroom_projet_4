/**
 * @type {Cypress.PluginConfig}
 */
 // Valeur initiale : import * as registerCodeCoverageTasks from '@cypress/code-coverage/task';
 // Cette librairie exporte directement une fonction (module.exports = fonction). "import * as" crée
 // un objet vide à la place, d'où l'erreur "registerCodeCoverageTasks is not a function" au lancement de Cypress.
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const registerCodeCoverageTasks = require('@cypress/code-coverage/task');

 export default (on, config) => {
   return registerCodeCoverageTasks(on, config);
 };
