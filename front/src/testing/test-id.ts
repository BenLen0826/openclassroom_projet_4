import { ComponentFixture } from '@angular/core/testing';

// Aides pour retrouver les éléments par leur attribut data-testid dans les tests Jest
// (l'équivalent de cy.getByTestId dans les tests Cypress).
// Les data-testid ne changent ni avec le texte affiché, ni avec la structure HTML ou les composants Material.
// Ce fichier est hors de src/app : il n'est pas compté dans la couverture de code.
//
// Noms choisis d'après la convention de Testing Library :
//   getBy...   → l'élément DOIT exister : sinon le test échoue avec un message clair
//   queryBy... → renvoie null si l'élément n'existe pas : pour vérifier une ABSENCE
//   queryAllBy → renvoie tous les éléments (tableau vide si aucun)

// Où chercher : dans le composant testé (fixture), ou dans tout le document
// (utile pour les éléments que Material affiche hors du composant, comme les options d'un mat-select).
type SearchRoot = ComponentFixture<unknown> | Document;

const rootElement = (root: SearchRoot): ParentNode =>
  root instanceof ComponentFixture ? root.nativeElement : root;

// Le premier élément qui porte ce data-testid, ou null s'il n'existe pas
export const queryByTestId = <T extends HTMLElement = HTMLElement>(root: SearchRoot, testId: string): T | null =>
  rootElement(root).querySelector<T>(`[data-testid="${testId}"]`);

// Tous les éléments qui portent ce data-testid (tableau vide si aucun)
export const queryAllByTestId = <T extends HTMLElement = HTMLElement>(root: SearchRoot, testId: string): T[] =>
  Array.from(rootElement(root).querySelectorAll<T>(`[data-testid="${testId}"]`));

// L'élément qui porte ce data-testid ; s'il n'existe pas, le test échoue avec un message qui dit lequel manque
export const getByTestId = <T extends HTMLElement = HTMLElement>(root: SearchRoot, testId: string): T => {
  const element = queryByTestId<T>(root, testId);
  if (!element) {
    throw new Error(`Aucun élément avec data-testid="${testId}"`);
  }
  return element;
};
