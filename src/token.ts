export interface TokenStorage {
    getToken(): Token | null;
    setToken(token: Token | null): void;
}

export class Token {
    public readonly value: string;
    public readonly timestamp: number;

    constructor(value: string, timestamp: number) {
        if (value === '') {
            throw new Error('The value cannot be empty.');
        }

        this.value = value;
        this.timestamp = timestamp;
    }

    static deserialize(json: string): Token {
        const {value, timestamp} = JSON.parse(json);

        return new Token(value, timestamp);
    }

    serialize(): string {
        return JSON.stringify(this);
    }

    toJSON() {
        return {value: this.value, timestamp: this.timestamp};
    }
}