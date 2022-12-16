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
    if (utf8) {
        return base64Escape(
            window.btoa(
                window.encodeURIComponent(value)
                    .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(Number.parseInt(p1, 16))),
            ),
        );
    }

    return base64Escape(window.btoa(value));
}

export function base64UrlDecode(value: string, utf8 = false): string {
    if (utf8) {
        return window.decodeURIComponent(
            Array.prototype.map.call(
                window.atob(base64Unescape(value)),
                (char: string) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`,
            ).join(''),
        );
    }

    return window.atob(base64Unescape(value));
}
