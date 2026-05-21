module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  rootDir: '.',

  testMatch: ['**/apps/backend/test/**/*.spec.ts'],

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/apps/backend/tsconfig.json',
      diagnostics: false
    }],
  },

  moduleFileExtensions: ['ts', 'js'],
};