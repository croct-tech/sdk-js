/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    testEnvironment: '<rootDir>/custom-jsdom-environment.js',
    preset: 'ts-jest',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest.setup.js'],
};
