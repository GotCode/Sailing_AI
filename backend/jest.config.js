/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.(test|spec).ts', '<rootDir>/src/**/*.(test|spec).ts'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};