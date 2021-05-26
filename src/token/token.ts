import {base64UrlDecode, base64UrlEncode} from '../base64Url';
import {tokenSchema} from '../schema';
import {formatCause} from '../error';

export type Headers = {
    typ: string,
    alg: string,
    kid?: string,
    appId: string,
};

export type Claims = {
    iss: string,
    aud: string,
    iat: number,
    exp?: number,
    sub?: string,
    jid?: string,
};

export class Token {
    private readonly headers: Headers;

    private readonly claims: Claims;

    private readonly signature: string;

    private constructor(headers: Headers, claims: Claims, signature = '') {
        this.headers = headers;
        this.claims = claims;
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
        let claims;
        let
            signature;

        try {
            headers = JSON.parse(base64UrlDecode(parts[0]));
            claims = JSON.parse(base64UrlDecode(parts[1]));

            if (parts.length === 3) {
                signature = base64UrlDecode(parts[2]);
            }
        } catch {
            throw new Error('The token is corrupted.');
        }

        try {
            tokenSchema.validate({headers, claims, signature});
        } catch (violation) {
            throw new Error(`The token is invalid: ${formatCause(violation)}`);
        }

        return new Token(headers as Headers, claims as Claims, signature as string);
    }

    public getHeaders(): Headers {
        return {...this.headers};
    }

    public getClaims(): Claims {
        return {...this.claims};
    }

    public getSignature(): string {
        return this.signature;
    }

    public isAnonymous(): boolean {
        return this.claims.sub === undefined;
    }

    public getSubject(): string | null {
        return this.claims.sub !== undefined ? this.claims.sub : null;
    }

    public getIssueTime(): number {
        return this.claims.iat;
    }

    public toJSON(): string {
        return this.toString();
    }

    public toString(): string {
        const headers = base64UrlEncode(JSON.stringify(this.headers));
        const claims = base64UrlEncode(JSON.stringify(this.claims));
        const signature = base64UrlEncode(this.signature);

        return `${headers}.${claims}.${signature}`;
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
