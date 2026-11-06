import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

/*
 * jsdom ne sait pas lire certains CSS d'Angular Material (calques des listes déroulantes,
 * snackbars...) et affiche "Could not parse CSS stylesheet". C'est une limite connue de jsdom,
 * sans effet sur les tests : on masque UNIQUEMENT ce message, les autres erreurs restent visibles.
 */
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0] instanceof Error ? args[0].message : String(args[0]);
  if (message.includes('Could not parse CSS stylesheet')) {
    return;
  }
  originalConsoleError(...args);
};

/* global mocks for jsdom */
const mock = () => {
  let storage: { [key: string]: string } = {};
  return {
    getItem: (key: string) => (key in storage ? storage[key] : null),
    setItem: (key: string, value: string) => (storage[key] = value || ''),
    removeItem: (key: string) => delete storage[key],
    clear: () => (storage = {}),
  };
};

Object.defineProperty(window, 'localStorage', { value: mock() });
Object.defineProperty(window, 'sessionStorage', { value: mock() });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ['-webkit-appearance'],
});

Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

