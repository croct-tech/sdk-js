import { base64UrlDecode, base64UrlEncode } from '../src/base64Url';

describe('A base64 URL encoder/decoder function', () => {
    const encodeTests: Array<[string]> = [
        ['000000'],
        ['\0\0\0\0'],
        ['\xff'],
        ['\xff\xff'],
        ['\xff\xff\xff'],
        ['\xff\xff\xff\xff'],
        ['\xfb'],
        [''],
        ['f'],
        ['fo'],
        ['foo'],
        ['foob'],
        ['fooba'],
        ['foobar'],
        // UTF-8 tests
        ['Jacaré'],
        ['\u00e9'],
        ['\u00e9\u00e9'],
        [atob('qacWVddeO9x66kkymtPHTvh4hHnhdJ437m1HOSHh1od+aA94EB9bK67QFjaMo4PVxjZxhf2x4dHSCLievgGKpQ')],
        [atob('qacWVddeO9x66kkymtPHTvh4hHnhdJ437m1HOSHh1od+aA94EB9bK67QFjaMo4PVxjZxhf2x4dHSCLievgGKpQ==')],
    ];

    it.each(encodeTests)('should encode "%s" as "%s"', (decoded: string) => {
        expect(base64UrlDecode(base64UrlEncode(decoded))).toBe(decoded);
    });

    it('should encode a reference string', () => {
        const original = atob('qacWVddeO9x66kkymtPHTvh4hHnhdJ437m1HOSHh1od+aA94EB9bK67QFjaMo4PVxjZxhf2x4dHSCLievgGKpQ==');

        const encoded = base64UrlEncode(original);

        expect(encoded).toEqual('qacWVddeO9x66kkymtPHTvh4hHnhdJ437m1HOSHh1od-aA94EB9bK67QFjaMo4PVxjZxhf2x4dHSCLievgGKpQ');
    });
});
