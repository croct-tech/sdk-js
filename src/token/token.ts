import {JsonObject} from '@croct/json';
import {encodeURI as base64Encode, decode as base64Decode} from 'js-base64';
import {tokenSchema} from '../schema';
import {formatCause} from '../error';
import {ApiKey} from '../apiKey';

export type Headers = {
    typ: string,
    alg: string,
    kid?: string,
    appId?: string,
};

type Claims = {
    iss: string,
    aud: string|string[],
    iat: number,
    exp?: number,
    sub?: string,
    jti?: string,
};

export type TokenPayload = JsonObject & Claims;

export class Token {
    private readonly headers: Headers;

    private readonly payload: TokenPayload;

    private readonly signature: string;

    private constructor(headers: Headers, payload: TokenPayload, signature = '') {
        this.headers = headers;
        this.payload = payload;
        this.signature = signature;
    }

    public static issue(
        appId: string,
        subject: string|null = null,
        timestamp: number = Math.floor(Date.now() / 1000),
    ): Token {
        if (timestamp < 0) {
            throw new Error('The timestamp must be non-negative.');
        }

        if (subject === '') {
            throw new Error('The subject must be non-empty.');
        }

        return new Token(
            {
                typ: 'JWT',
                alg: 'none',
                appId: appId,
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: timestamp,
                ...(subject !== null ? {sub: subject} : null),
            },
        );
    }

    public static parse(token: string): Token {
        if (token === '') {
            throw new Error('The token cannot be empty.');
        }

        const parts = token.split('.', 3);

        // This token is invalid
        if (parts.length < 2) {
            throw new Error('The token is malformed.');
        }

        let headers;
        let payload;
        const signature = parts[2];

        try {
            const part0 = base64Decode(parts[0]);
            const part1 = base64Decode(parts[1]);

            headers = JSON.parse(part0);
            payload = JSON.parse(part1);

        } catch (error) {
            throw new Error('The token is corrupted.');
        }

        return Token.of(headers, payload, signature);
    }

    public static of(headers: Headers, payload: TokenPayload, signature: string = ''): Token {
        try {
            tokenSchema.validate({
                headers: headers,
                payload: payload,
                signature: signature,
            });
        } catch (violation) {
            throw new Error(`The token is invalid: ${formatCause(violation)}`);
        }

        return new Token(headers as Headers, payload as TokenPayload, signature);
    }

    public async signedWith(apiKey: ApiKey): Promise<Token> {
        const keyId = await apiKey.getIdentifierHash();
        const headers: Headers = {
            ...this.headers,
            kid: keyId,
            alg: 'EdDSA',
        };

        const encodedHeader = base64Encode(JSON.stringify(headers));
        const encodedPayload = base64Encode(JSON.stringify(this.payload));
        const signatureData = `${encodedHeader}.${encodedPayload}`;
        const signature = await apiKey.sign(Buffer.from(signatureData, 'utf-8'));

        return new Token(headers, this.payload, signature.toString('base64url'));
    }

    public isSigned(): boolean {
        return this.headers.alg !== 'none' && this.signature !== '';
    }

    public isSubject(subject: string): boolean {
        return this.getSubject() === subject;
    }

    public isAnonymous(): boolean {
        return this.payload.sub === undefined;
    }

    public isValidNow(now: number = Math.floor(Date.now() / 1000)): boolean {
        const {exp, iat} = this.payload;

        return (exp === undefined || exp >= now) && iat <= now;
    }

    public isNewerThan(token: Token): boolean {
        return this.payload.iat > token.payload.iat;
    }

    public async matchesKeyId(apiKey: ApiKey): Promise<boolean> {
        return this.headers.kid === await apiKey.getIdentifierHash();
    }

    public getHeaders(): Headers {
        return {...this.headers};
    }

    public getPayload(): TokenPayload {
        return {...this.payload};
    }

    public getSignature(): string {
        return this.signature;
    }

    public getSubject(): string | null {
        return this.payload.sub !== undefined ? this.payload.sub : null;
    }

    public getIssueTime(): number {
        return this.payload.iat;
    }

    public toJSON(): string {
        return this.toString();
    }

    public toString(): string {
        const headers = base64Encode(JSON.stringify(this.headers));
        const payload = base64Encode(JSON.stringify(this.payload));

        return `${headers}.${payload}.${this.signature}`;
    }
}

export interface TokenProvider {
    getToken(): Token | null;
}

export interface TokenStore extends TokenProvider {
    setToken(token: Token | null): void;
}

export class FixedTokenProvider implements TokenProvider {
    private readonly token: Token | null;

    public constructor(token: Token | null) {
        this.token = token;
    }

    public getToken(): Token | null {
        return this.token;
    }
}
