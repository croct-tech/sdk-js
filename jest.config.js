module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    setupFilesAfterEnv: ['jest-extended/all'],
};
