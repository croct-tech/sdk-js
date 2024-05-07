function base64Unescape(value: string): string {
    return (value + '==='.slice((value.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}

function base64Escape(value: string): string {
    return value
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function base64UrlEncode(value: string, utf8 = false): string {
    return utf8
        ? base64Escape(btoa(String.fromCodePoint(...new TextEncoder().encode(value))))
        : base64Escape(btoa(value));
}

export function base64UrlDecode(value: string, utf8 = false): string {
    return utf8
        ? new TextDecoder().decode(Uint8Array.from(atob(base64Unescape(value)), m => m.codePointAt(0)!))
        : atob(base64Unescape(value));
}
