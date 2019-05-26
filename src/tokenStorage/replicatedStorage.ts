import Token, {TokenStorage} from '../token';

export default class ReplicatedStorage implements TokenStorage {
    private primary: TokenStorage;

    private secondary: TokenStorage;

    public constructor(primary: TokenStorage, secondary: TokenStorage) {
        this.primary = primary;
        this.secondary = secondary;
    }

    public getToken(): Token | null {
        return this.primary.getToken();
    }

    public setToken(token: Token | null): void {
        this.primary.setToken(token);
        this.secondary.setToken(token);
    }
}
