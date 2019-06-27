import {Token, TokenStorage} from '../token';

export class ReplicatedStorage implements TokenStorage {
    private primary: TokenStorage;
    private secondary: TokenStorage;

    constructor(primary: TokenStorage, secondary: TokenStorage) {
        this.primary = primary;
        this.secondary = secondary;
    }

    getToken(): Token | null {
        return this.primary.getToken();
    }

    setToken(token: Token | null): void {
        this.primary.setToken(token);
        this.secondary.setToken(token);
    }
}