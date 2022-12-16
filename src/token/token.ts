import {JsonObject} from '@croct/json';
import {base64UrlDecode, base64UrlEncode} from '../base64Url';
import {tokenSchema} from '../schema';
import {formatCause} from '../error';

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
    jid?: string,
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
        let signature;

        try {
            headers = JSON.parse(base64UrlDecode(parts[0], true));
            payload = JSON.parse(base64UrlDecode(parts[1], true));

            if (parts.length === 3) {
                signature = base64UrlDecode(parts[2], false);
            }
        } catch {
            throw new Error('The token is corrupted.');
        }

        return Token.of(headers, payload, signature);
    }

    public static of(headers: Headers, payload: TokenPayload, signature = ''): Token {
        try {
            tokenSchema.validate({
                headers: headers,
                payload: payload,
                signature: signature,
            });
        } catch (violation) {
            throw new Error(`The token is invalid: ${formatCause(violation)}`);
        }

        return new Token(headers as Headers, payload as TokenPayload, signature as string);
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

    public isAnonymous(): boolean {
        return this.payload.sub === undefined;
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
        const headers = base64UrlEncode(JSON.stringify(this.headers));
        const payload = base64UrlEncode(JSON.stringify(this.payload));
        const signature = base64UrlEncode(this.signature);

        return `${headers}.${payload}.${signature}`;
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
