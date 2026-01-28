/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    testEnvironment: 'jest-fixed-jsdom',
    preset: 'ts-jest',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest.setup.js'],
};
