class Trie {
    readonly value: number;
    readonly children: {[key: number]: Trie} = {};

    constructor(value: number) {
        this.value = value;
    }
}

class Compressor {
    private readonly bitsPerChar: number;
    private position: number = 0;
    private value: number = 0;
    public data: string = '';

    private constructor(bitsPerChar: number) {
        this.bitsPerChar = bitsPerChar;
    }

    static compress(input: string | null, bitsPerChar: number): string {
        if (input === null) {
            return '';
        }

        const compressor = new Compressor(bitsPerChar);

        let numBitsMask = 0b100;

        if (input === '') {
            return compressor.finish(numBitsMask);
        }

        let code = input.charCodeAt(0);
        let value = code < 256 ? 0 : 1;
        let dictSize = 3;

        compressor.write(value, numBitsMask);
        compressor.write(code, value !== 0 ? 0b10000000000000000 : 0b100000000);

        let node = new Trie(3);
        let isNewNode = true;
        let dictionary: {[key: number]: Trie} = {};

        dictionary[code] = node;

        for (let i = 1, length = input.length; i < length; i++) {
            code = input.charCodeAt(i);

            const nextNode = node.children[code];

            if (nextNode) {
                node = nextNode;

                continue;
            }

            if (!isNewNode) {
                value = node.value;
                compressor.write(value, numBitsMask);
            }

            isNewNode = false;

            if (!dictionary[code]) {
                if (++dictSize >= numBitsMask) {
                    numBitsMask <<= 1;
                }

                value = code < 256 ? 0 : 1;

                compressor.write(value, numBitsMask);
                compressor.write(code, value !== 0 ? 0b10000000000000000 : 0b100000000);

                dictionary[code] = new Trie(dictSize);

                isNewNode = true;
            }

            node.children[code] = new Trie(++dictSize);

            if (dictSize >= numBitsMask) {
                numBitsMask <<= 1;
            }

            node = dictionary[code];
        }

        if (!isNewNode) {
            compressor.write(node.value, numBitsMask);
        }

        if (!dictionary[code]) {
            if (++dictSize >= numBitsMask) {
                numBitsMask <<= 1;
            }

            value = code < 256 ? 0 : 1;

            compressor.write(value, numBitsMask);
            compressor.write(code, 0b100000000 << value);
        }

        if (++dictSize >= numBitsMask) {
            numBitsMask <<= 1;
        }

        return compressor.finish(numBitsMask);
    }

    write(value: number, numBitsMask: number) {
        for (let i = 0; (numBitsMask >>= 1) !== 0; i++) {
            this.value = (value >> i & 1) | (this.value << 1);

            if (++this.position === this.bitsPerChar) {
                this.position = 0;
                this.data += String.fromCharCode(this.value);
                this.value = 0;
            }
        }
    }

    finish(numBitsMask: number) {
        this.write(2, numBitsMask);

        this.value <<= this.bitsPerChar - this.position;
        this.data += String.fromCharCode(this.value);

        return this.data;
    }
}

class Decompressor {
    private readonly input: string;
    private readonly resetBits: number;
    private value: number;
    private position: number;
    private index: number = 1;

    private constructor(input: string, resetBits: number) {
        this.input = input;
        this.resetBits = resetBits;
        this.value = input.charCodeAt(0);
        this.position = resetBits;
    }

    static decompress(input: string | null, resetBits: number): string | null {
        if (input === null) {
            return '';
        }

        if (input === '') {
            return null;
        }

        const decompressor: Decompressor = new Decompressor(input, resetBits);

        let bits = decompressor.read(2);

        if (bits === 2) {
            return '';
        }

        bits = decompressor.read(bits * 8 + 8);

        let phrase = String.fromCharCode(bits);
        const dictionary: string[] = ['', '', '', phrase];
        let result = phrase;

        let enlargeIn = 4;
        let index = dictionary.length;
        let numBits = 3;

        while (!decompressor.isEof()) {
            bits = decompressor.read(numBits);

            if (bits === 2) {
                return result;
            }

            if (bits < 2) {
                bits = decompressor.read(8 + 8 * bits);

                dictionary[index] = String.fromCharCode(bits);

                bits = index++;
                if (--enlargeIn === 0) {
                    enlargeIn = 1 << numBits++;
                }
            }

            if (bits > dictionary.length) {
                return null;
            }

            let entry: string = bits < dictionary.length ?
                dictionary[bits] :
                phrase + phrase.charAt(0);

            result += entry;

            dictionary[index++] = phrase + entry.charAt(0);

            phrase = entry;

            if (--enlargeIn === 0) {
                enlargeIn = 1 << numBits++;
            }
        }

        return '';
    }

    isEof(): boolean {
        return this.index > this.input.length;
    }

    read(maxPower: number): number {
        let power: number = 0;
        let bits: number = 0;

        while (power !== maxPower) {
            bits += ((this.value >> --this.position) & 1) << power++;

            if (this.position === 0) {
                this.position = this.resetBits;
                this.value = this.input.charCodeAt(this.index++);
            }
        }

        return bits;
    }
}

export function compress(input: string | null): string {
    return Compressor.compress(input, 16);
}

export function decompress(input: string | null): string | null {
    return Decompressor.decompress(input, 16);
}
