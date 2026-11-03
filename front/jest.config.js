module.exports = {
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
  },
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  bail: false,
  verbose: false,
  collectCoverage: false,
  // Mesure TOUS les fichiers de l'application, même ceux qu'aucun test ne charge
  // (sinon un fichier jamais testé serait absent du rapport au lieu d'afficher 0 %).
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',      // les tests eux-mêmes
    '!src/app/**/*.interface.ts', // types TypeScript : aucun code exécutable
  ],
  coverageDirectory: './coverage/jest',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
  // Jest échoue si un des 4 indicateurs passe sous 80 %
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  // Rapport HTML listant chaque test et son résultat
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Yoga - rapport des tests Jest',
      outputPath: './coverage/jest/test-report.html',
      includeFailureMsg: true,
    }],
  ],
  roots: [
    "<rootDir>"
  ],
  modulePaths: [
    "<rootDir>"
  ],
  moduleDirectories: [
    "node_modules"
  ],
};
