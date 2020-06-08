import Token, {TokenStore} from './index';

export default class ReplicatedTokenStore implements TokenStore {
    private primary: TokenStore;

    private secondary: TokenStore;

    public constructor(primary: TokenStore, secondary: TokenStore) {
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
