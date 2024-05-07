import {base64UrlDecode, base64UrlEncode} from '../src/base64Url';

describe('A base64 URL encoder/decoder function', () => {
    const encodeTests: Array<[string, string, boolean]> = [
        ['000000', 'MDAwMDAw', false],
        ['\0\0\0\0', 'AAAAAA', false],
        ['\xff', 'w78', true],
        ['\xff\xff', '__8', false],
        ['\xff\xff\xff', '____', false],
        ['\xff\xff\xff\xff', '_____w', false],
        ['\xfb', '-w', false],
        ['', '', false],
        ['f', 'Zg', false],
        ['fo', 'Zm8', false],
        ['foo', 'Zm9v', false],
        ['foob', 'Zm9vYg', false],
        ['fooba', 'Zm9vYmE', false],
        ['foobar', 'Zm9vYmFy', false],
        // UTF-8 tests
        ['Jacaré', 'SmFjYXLDqQ', true],
        ['\u00e9', 'w6k', true],
        ['\u00e9\u00e9', 'w6nDqQ', true],
        // Binary tests
        [
            atob('qacWVddeO9x66kkymtPHTvh4hHnhdJ437m1HOSHh1od+aA94EB9bK67QFjaMo4PVxjZxhf2x4dHSCLievgGKpQ=='),
            'qacWVddeO9x66kkymtPHTvh4hHnhdJ437m1HOSHh1od-aA94EB9bK67QFjaMo4PVxjZxhf2x4dHSCLievgGKpQ',
            false,
        ],
    ];

    it.each(encodeTests)('should encode "%s" as "%s"', (decoded: string, encoded: string, utf8: boolean) => {
        expect(base64UrlEncode(decoded, utf8)).toBe(encoded);
    });

    const decodeTests = encodeTests.map(([encoded, decoded, utf8]) => [decoded, encoded, utf8]);

    it.each(decodeTests)('should decode "%s" as "%s"', (encoded: string, decoded: string, utf8: boolean) => {
        expect(base64UrlDecode(encoded, utf8)).toBe(decoded);
    });
});
