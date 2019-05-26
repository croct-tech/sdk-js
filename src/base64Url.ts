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
    return base64Escape(window.btoa(value));
}

export function base64UrlDecode(value: string): string {
    return window.atob(base64Unescape(value));
}
