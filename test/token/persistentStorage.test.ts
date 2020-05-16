import Token from '../../src/token';
import PersistentStorage from '../../src/token/persistentStorage';
import {DumbStorage} from '../utils/dumbStorage';

describe('A persistent storage', () => {
    const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);

    test('should store tokens in the storage', () => {
        const storage = new PersistentStorage(new DumbStorage(), 'token');

        expect(storage.getToken()).toBeNull();

        storage.setToken(token);

        expect(storage.getToken()).toEqual(token);
    });

    test('should remove a token set to null from the storage', () => {
        const storage = new PersistentStorage(new DumbStorage(), 'token');

        storage.setToken(token);

        expect(storage.getToken()).toEqual(token);

        storage.setToken(null);

        expect(storage.getToken()).toBeNull();
    });

    test('should retrieve the token from the storage', () => {
        const storage = new PersistentStorage(new DumbStorage(), 'token');

        expect(storage.getToken()).toBeNull();

        storage.setToken(token);

        expect(storage.getToken()).toEqual(token);
    });

    test('should consider corrupted tokens as null', () => {
        const storage = new PersistentStorage(new DumbStorage(true), 'token');

        expect(storage.getToken()).toBeNull();
    });
});
