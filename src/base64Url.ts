function base64Unescape(value: string): string {
    return (value + '==='.slice((value.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}

function base64Escape(value: string): string {
    return value
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function base64UrlEncode(value: string): string {
    return base64Escape(btoa(String.fromCodePoint(...new TextEncoder().encode(value))));
}

export function base64UrlDecode(value: string): string {
    return new TextDecoder().decode(Uint8Array.from(atob(base64Unescape(value)), m => m.codePointAt(0)!));
}
