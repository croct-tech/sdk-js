import Token from '../../src/token';
import InMemoryStorage from '../../src/token/inMemoryStorage';

describe('An in-memory storage', () => {
    const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);

    test('should store tokens in memory', () => {
        const storage = new InMemoryStorage();

        storage.setToken(token);

        expect(storage.getToken()).toEqual(token);
    });

    test('should retrieve tokens from memory', () => {
        const storage = new InMemoryStorage();

        storage.setToken(token);

        expect(storage.getToken()).toEqual(token);
    });
});
