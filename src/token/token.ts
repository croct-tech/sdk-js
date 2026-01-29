import type {JsonObject} from '@croct/json';
import {tokenSchema} from '../schema';
import {formatCause} from '../error';
import type {ApiKey} from '../apiKey';
import {base64UrlDecode, base64UrlEncode} from '../base64Url';

export type TokenHeaders = {
    typ: string,
    alg: string,
    kid?: string,
    appId?: string,
};

export type TokenClaims = {
    iss: string,
    aud: string | string[],
    iat: number,
    exp?: number,
    sub?: string,
    jti?: string,
};

export type TokenPayload = JsonObject & TokenClaims;

export class Token {
    private static readonly UUID_PATTERN = /^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/;

    private readonly headers: TokenHeaders;

    private readonly payload: TokenPayload;

    private readonly signature: string;

    private constructor(headers: TokenHeaders, payload: TokenPayload, signature = '') {
        this.headers = headers;
        this.payload = payload;
        this.signature = signature;
    }

    public static issue(
        appId: string,
        subject: string | null = null,
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

        try {
            headers = JSON.parse(base64UrlDecode(parts[0], true));
            payload = JSON.parse(base64UrlDecode(parts[1], true));
        } catch {
            throw new Error('The token is corrupted.');
        }

        return Token.of(headers, payload, parts[2]);
    }

    public static of(headers: TokenHeaders, payload: TokenPayload, signature = ''): Token {
        try {
            tokenSchema.validate({
                headers: headers,
                payload: payload,
                signature: signature,
            });
        } catch (violation) {
            throw new Error(`The token is invalid: ${formatCause(violation)}`);
        }

        return new Token(headers, payload, signature);
    }

    public async signedWith(apiKey: ApiKey): Promise<Token> {
        const keyId = await apiKey.getIdentifierHash();
        const headers: TokenHeaders = {
            ...this.headers,
            kid: keyId,
            alg: apiKey.getSigningAlgorithm(),
        };

        const encodedHeader = base64UrlEncode(JSON.stringify(headers), true);
        const encodedPayload = base64UrlEncode(JSON.stringify(this.payload), true);
        const signature = await apiKey.sign(`${encodedHeader}.${encodedPayload}`);

        return new Token(headers, this.payload, base64UrlEncode(signature, false));
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

    public getHeaders(): TokenHeaders {
        return {...this.headers};
    }

    public getPayload(): TokenPayload {
        return {...this.payload};
    }

    public getSignature(): string {
        return this.signature;
    }

    public getApplicationId(): string | null {
        return this.headers.appId ?? null;
    }

    public getAlgorithm(): string {
        return this.headers.alg;
    }

    public getType(): string {
        return this.headers.typ;
    }

    public getKeyId(): string | null {
        return this.headers.kid ?? null;
    }

    public getSubject(): string | null {
        return this.payload.sub ?? null;
    }

    public getIssueTime(): number {
        return this.payload.iat;
    }

    public getExpirationTime(): number | null {
        return this.payload.exp ?? null;
    }

    public getTokenId(): string | null {
        return this.payload.jti ?? null;
    }

    public getAudience(): string | string[] {
        return this.payload.aud;
    }

    public getIssuer(): string {
        return this.payload.iss;
    }

    public withTokenId(tokenId: string): Token {
        if (tokenId === '' || !Token.UUID_PATTERN.test(tokenId)) {
            throw new Error('The token ID must be a valid UUID.');
        }

        return new Token(
            this.headers,
            {
                ...this.payload,
                jti: tokenId,
            },
            this.signature,
        );
    }

    public withDuration(duration: number, now: number = Math.floor(Date.now() / 1000)): Token {
        return new Token(
            this.headers,
            {
                ...this.payload,
                iat: now,
                exp: now + duration,
            },
            this.signature,
        );
    }

    public withAddedHeaders(headers: Partial<TokenHeaders>): Token {
        return this.withHeaders({
            ...this.headers,
            ...Object.fromEntries(
                Object.entries(headers)
                    .filter(([, value]) => value !== undefined),
            ),
        });
    }

    public withAddedClaims(claims: Partial<TokenClaims>): Token {
        return this.withPayload({
            ...this.payload,
            ...Object.fromEntries(
                Object.entries(claims)
                    .filter(([, value]) => value !== undefined),
            ),
        });
    }

    public withHeaders(headers: TokenHeaders): Token {
        return new Token(
            headers,
            this.payload,
            this.signature,
        );
    }

    public withPayload(payload: TokenPayload): Token {
        return new Token(
            this.headers,
            payload,
            this.signature,
        );
    }

    public withSignature(signature: string): Token {
        return new Token(
            this.headers,
            this.payload,
            signature,
        );
    }

    public toJSON(): string {
        return this.toString();
    }

    public toString(): string {
        const headers = base64UrlEncode(JSON.stringify(this.headers), true);
        const payload = base64UrlEncode(JSON.stringify(this.payload), true);

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
