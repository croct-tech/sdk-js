import {Token, TokenStorage} from '../token';

export class PersistentStorage implements TokenStorage {
    private readonly storage: Storage;
    private readonly key: string;

    constructor(storage: Storage, key: string = 'token') {
        this.storage = storage;
        this.key = key;
    }

    getToken(): Token | null {
        const data: string | null = this.storage.getItem(this.key);

        if (data === null) {
            return null;
        }

        try {
            return Token.deserialize(data);
        } catch (error) {
            return null;
        }
    }

    setToken(token: Token | null): void {
        if (token === null) {
            this.storage.removeItem(this.key);

            return;
        }

        this.storage.setItem(this.key, token.serialize());
    }
}