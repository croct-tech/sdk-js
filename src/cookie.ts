export function getBaseDomain(domain = window.document.domain): string {
    const parts: string[] = domain.split('.');
    const random = `___${Math.random()}`;

    for (let i = parts.length - 2; i >= 0; i--) {
        const level = parts.slice(i).join('.');
        const entry = `${random}=${random}`;

        window.document.cookie = `${entry}; Domain=${level};`;

        const {cookie} = window.document;

        if (cookie.includes(entry)) {
            window.document.cookie = `${random}=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=${level};`;

            return level;
        }
    }

    return domain;
}

export type CookieOptions = {
    secure?: boolean,
    domain?: string,
    path?: string,
    maxAge?: number,
    sameSite?: 'strict' | 'lax' | 'none',
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
    let data = `${encode(name, true)}=${encode(value)};`;

    if (options.secure === true) {
        data += ' Secure;'
    }

    if (options.maxAge !== undefined) {
        data += ` Max-Age=${options.maxAge};`;
    }

    if (options.domain !== undefined) {
        data += ` Domain=${options.domain};`;
    }

    if (options.path !== undefined) {
        data += ` Path=${options.path};`;
    }

    if (options.sameSite !== undefined) {
        data += ` SameSite=${options.sameSite};`;
    }

    window.document.cookie = data;
}

export function getCookie(name: string): string|null {
    const cookies = window.document.cookie ? document.cookie.split(';') : [];

    for (let i = 0; i < cookies.length; i++) {
        const [key, value] = cookies[i].split('=');

        if (decode(key.trim(), true) === name) {
            return decode(value);
        }
    }

    return null;
}

export function unsetCookie(name: string): void {
    window.document.cookie = `${encode(name, true)}=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`
}

function encode(value: string, identifier = false): string {
    let result = value.replace(/;/g, '%3B');

    if (identifier) {
        result = result.replace(/=/g, '%3D');
    }

    return result;
}

function decode(value: string, identifier = false): string {
    let result = value.replace(/%3B/g, ';');

    if (identifier) {
        result = result.replace(/%3D/g, '=');
    }

    return result;
}

