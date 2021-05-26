import {Token, CachedTokenStore} from '../../src/token';

import {InMemoryCache} from '../../src/cache';

describe('A cache token store', () => {
    const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);

    test('should store tokens into cache', () => {
        const store = new CachedTokenStore(new InMemoryCache());

        expect(store.getToken()).toBeNull();

        store.setToken(token);

        expect(store.getToken()).toEqual(token);
    });

    test('should remove a token set to null from the cache', () => {
        const store = new CachedTokenStore(new InMemoryCache());

        store.setToken(token);

        expect(store.getToken()).toEqual(token);

        store.setToken(null);

        expect(store.getToken()).toBeNull();
    });

    test('should retrieve the token from the cache', () => {
        const store = new CachedTokenStore(new InMemoryCache());

        expect(store.getToken()).toBeNull();

        store.setToken(token);

        expect(store.getToken()).toEqual(token);
    });

    test('should consider corrupted tokens as null', () => {
        const cache = new InMemoryCache();
        cache.put('bad');

        const store = new CachedTokenStore(cache);

        expect(store.getToken()).toBeNull();
    });
});
