import {Token, TokenStorage} from '../token';

export class InMemoryStorage implements TokenStorage {
    private token: Token | null = null;

    getToken(): Token | null {
        return this.token;
    }

    setToken(token: Token | null): void {
        this.token = token;
    }
}