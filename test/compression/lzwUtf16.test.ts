import {compress, decompress} from "../../src/compression/lzwUtf16";

test('should compress and decompress a string that repeats', () => {
    const input = 'hello1hello2hello3hello4hello5hello6hello7hello8hello9helloAhelloBhelloChelloDhelloEhelloF';

    expect(decompress(compress(input))).toBe(input);
});


test('should compress and decompress a string with any encoding', () => {
    const input = '捯湳潬攮汯木≈敬汯⁷潲汤™⤠`';

    expect(decompress(compress(input))).toBe(input);
});

test('should compress and decompress a string with emoji', () => {
    const input = '😀😁😂🤣😃😄😅';

    expect(decompress(compress(input))).toBe(input);
});

test('should compress and decompress all printable UTF-16 characters', () => {
    let input = '';

    for (let i = 32; i < 127; ++i) {
        input += String.fromCharCode(i);
    }

    for (let i = 128 + 32; i < 55296; ++i) {
        input += String.fromCharCode(i);
    }
    for (let i = 63744; i < 65536; ++i) {
        input += String.fromCharCode(i);
    }

    const compressed = compress(input);

    expect(compressed).not.toBe(input);

    const uncompressed = decompress(compressed);

    expect(uncompressed).toBe(input);
});
