import Token, {TokenStore} from './index';

export default class InMemoryTokenStore implements TokenStore {
    private token: Token | null = null;

    public getToken(): Token | null {
        return this.token;
    }

    public setToken(token: Token | null): void {
        this.token = token;
    }
}
