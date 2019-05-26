import Token from '../../src/token';
import ReplicatedStorage from '../../src/tokenStorage/replicatedStorage';
import InMemoryStorage from '../../src/tokenStorage/inMemoryStorage';

describe('A replicated storage', () => {
    const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);

    test('should set the token in both storages', () => {
        const firstStorage = new InMemoryStorage();
        const secondStorage = new InMemoryStorage();
        const storage = new ReplicatedStorage(firstStorage, secondStorage);

        expect(firstStorage.getToken()).toBeNull();
        expect(secondStorage.getToken()).toBeNull();

        storage.setToken(token);

        expect(firstStorage.getToken()).toEqual(token);
        expect(secondStorage.getToken()).toEqual(token);
    });

    test('should retrieve the token from the primary storage', () => {
        const storage = new ReplicatedStorage(new InMemoryStorage(), new InMemoryStorage());

        storage.setToken(token);

        expect(storage.getToken()).toEqual(token);
    });
});
