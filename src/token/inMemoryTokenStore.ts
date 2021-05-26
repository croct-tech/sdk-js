import {Token, TokenStore} from './token';

export class InMemoryTokenStore implements TokenStore {
    private token: Token | null = null;

    public getToken(): Token | null {
        return this.token;
    }

    public setToken(token: Token | null): void {
        this.token = token;
    }
}
