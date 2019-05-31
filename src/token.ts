export enum TokenScope {
    ISOLATED = 'isolated',
    GLOBAL = 'global',
    CONTEXTUAL = 'contextual',
}

export class Token {
    public readonly value : string;
    public readonly timestamp : number;

    constructor(value: string, timestamp: number) {
        if (value === '') {
            throw new Error('The value cannot be empty.');
        }

        this.value = value;
        this.timestamp = timestamp;
    }

    static deserialize(json: string) : Token {
        const {value, timestamp} = JSON.parse(json);

        return new Token(value, timestamp);
    }

    serialize() : string {
        return JSON.stringify(this);
    }

    toJSON() {
        return {value: this.value, timestamp: this.timestamp};
    }
}

export interface TokenStorage {
    getToken() : Token | null;
    setToken(token: Token | null) : void;
}

export class WebTokenStorage implements TokenStorage {
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

export class ReplicatedTokenStorage implements TokenStorage {
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

export class InMemoryTokenStorage implements TokenStorage {
    private token: Token | null = null;

    getToken(): Token | null {
        return this.token;
    }

    setToken(token: Token | null): void {
        this.token = token;
    }
}