import { ComponentFixture } from '@angular/core/testing';

// Recherche d'éléments par data-testid dans les tests Jest (équivalent de cy.getByTestId côté Cypress).
// Placé hors de src/app pour ne pas être compté dans la couverture.
// Nommage de Testing Library : getBy (l'élément doit exister), queryBy (null si absent), queryAllBy (tableau).

// Racine de recherche : la fixture du composant, ou document pour les éléments que Material
// affiche hors du composant (options d'un mat-select, par exemple).
type SearchRoot = ComponentFixture<unknown> | Document;

const rootElement = (root: SearchRoot): ParentNode =>
  root instanceof ComponentFixture ? root.nativeElement : root;

export const queryByTestId = <T extends HTMLElement = HTMLElement>(root: SearchRoot, testId: string): T | null =>
  rootElement(root).querySelector<T>(`[data-testid="${testId}"]`);

export const queryAllByTestId = <T extends HTMLElement = HTMLElement>(root: SearchRoot, testId: string): T[] =>
  Array.from(rootElement(root).querySelectorAll<T>(`[data-testid="${testId}"]`));

// Lève une erreur nommant le data-testid manquant, plus lisible qu'un « cannot read property of null ».
export const getByTestId = <T extends HTMLElement = HTMLElement>(root: SearchRoot, testId: string): T => {
  const element = queryByTestId<T>(root, testId);
  if (!element) {
    throw new Error(`Aucun élément avec data-testid="${testId}"`);
  }
  return element;
};
