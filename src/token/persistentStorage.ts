import Token, {TokenStorage} from './index';

export default class PersistentStorage implements TokenStorage {
    private readonly storage: Storage;

    private readonly key: string;

    public constructor(storage: Storage, key = 'token') {
        this.storage = storage;
        this.key = key;
    }

    public getToken(): Token | null {
        const data: string | null = this.storage.getItem(this.key);

        if (data === null) {
            return null;
        }

        try {
            return Token.parse(data);
        } catch (error) {
            return null;
        }
    }

    public setToken(token: Token | null): void {
        if (token === null) {
            this.storage.removeItem(this.key);

            return;
        }

        this.storage.setItem(this.key, token.toString());
    }
}
