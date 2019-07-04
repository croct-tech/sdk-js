import {compress, decompress} from "../../src/compression/lzwBase64";

function expectBase64(input: string) {
    const compressed = compress(input);

    expect(compressed).toMatch(/^[A-Za-z0-9+/=]+$/);

    const decompressed = decompress(compressed);

    expect(decompressed).toBe(input);
}

test('should compress and decompress a string that repeats', () => {
    const input = 'hello1hello2hello3hello4hello5hello6hello7hello8hello9helloAhelloBhelloChelloDhelloEhelloF';

    expectBase64(input);
});


test('should compress and decompress a string with any encoding', () => {
    const input = '捯湳潬攮汯木≈敬汯⁷潲汤™⤠`';

    expectBase64(input);
});

test('should compress and decompress a string with emoji', () => {
    const input = '😀😁😂🤣😃😄😅';

    expectBase64(input);
});