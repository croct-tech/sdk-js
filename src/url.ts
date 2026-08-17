export type UrlSanitizer = (url: string) => URL;

/**
 * Normalizes the URL and sanitizes it, if a sanitizer is given.
 *
 * @param url The URL to sanitize.
 * @param sanitizer The sanitizer to apply to the normalized URL.
 *
 * @returns The sanitized URL.
 */
export function sanitizeUrl(url: string, sanitizer?: UrlSanitizer): string {
    const normalizedUrl = encodeURI(decodeURI(url));

    return sanitizer !== undefined ? sanitizer(normalizedUrl).toString() : normalizedUrl;
}
