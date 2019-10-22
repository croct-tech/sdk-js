export function base64UrlEncode(input: string) : string {
    return window.btoa(input)
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}