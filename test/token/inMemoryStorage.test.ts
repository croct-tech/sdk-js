import {Token, InMemoryTokenStore} from '../../src/token';

describe('An in-memory token store', () => {
    const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);

    test('should store tokens in memory', () => {
        const store = new InMemoryTokenStore();

        store.setToken(token);

        expect(store.getToken()).toEqual(token);
    });

    test('should retrieve tokens from memory', () => {
        const store = new InMemoryTokenStore();

        store.setToken(token);

        expect(store.getToken()).toEqual(token);
    });
});
