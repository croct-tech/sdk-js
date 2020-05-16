import Token, {TokenStorage} from './index';

export default class InMemoryStorage implements TokenStorage {
    private token: Token | null = null;

    public getToken(): Token | null {
        return this.token;
    }

    public setToken(token: Token | null): void {
        this.token = token;
    }
}
