import Token, {TokenStore} from './index';
import Cache from '../cache/index';

export default class CachedTokenStore implements TokenStore {
    private readonly cache: Cache;

    public constructor(cache: Cache) {
        this.cache = cache;
    }

    public getToken(): Token | null {
        const data: string | null = this.cache.get();

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
            this.cache.clear();

            return;
        }

        this.cache.put(token.toString());
    }
}
