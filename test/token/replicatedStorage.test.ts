import {Token, ReplicatedTokenStore, InMemoryTokenStore} from '../../src/token';

describe('A replicated token store', () => {
    const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);

    test('should set the token in both stores', () => {
        const firstStore = new InMemoryTokenStore();
        const secondStore = new InMemoryTokenStore();
        const store = new ReplicatedTokenStore(firstStore, secondStore);

        expect(firstStore.getToken()).toBeNull();
        expect(secondStore.getToken()).toBeNull();

        store.setToken(token);

        expect(firstStore.getToken()).toEqual(token);
        expect(secondStore.getToken()).toEqual(token);
    });

    test('should retrieve the token from the primary store', () => {
        const store = new ReplicatedTokenStore(new InMemoryTokenStore(), new InMemoryTokenStore());

        store.setToken(token);

        expect(store.getToken()).toEqual(token);
    });
});
