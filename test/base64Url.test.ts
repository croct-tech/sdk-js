import {base64UrlDecode, base64UrlEncode} from '../src/base64Url';

describe('A base64 URL encoder/decoder function', () => {
    const encodeTests = [
        ['000000', 'MDAwMDAw'],
        ['', ''],
        ['f', 'Zg'],
        ['fo', 'Zm8'],
        ['foo', 'Zm9v'],
        ['foob', 'Zm9vYg'],
        ['fooba', 'Zm9vYmE'],
        ['foobar', 'Zm9vYmFy'],
        ['Jacaré', 'SmFjYXLDqQ'],
    ];

    it.each(encodeTests)('should encode "%s" as "%s"', (decoded: string, encoded: string) => {
        expect(base64UrlEncode(decoded)).toBe(encoded);
    });

    const decodeTests = encodeTests.map(([encoded, decoded]) => [decoded, encoded]);

    it.each(decodeTests)('should decode "%s" as "%s"', (encoded: string, decoded: string) => {
        expect(base64UrlDecode(encoded)).toBe(decoded);
    });
});
