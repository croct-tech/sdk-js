export function compressChars(input: string[]): string {
    return this.compress(input.toString());
}

export function compressString(input: string): string {
    return this.compress(input, 16);
}

export function decompressChars(input: string[]): string | null {
    if (input == null) {
        return "";
    }

    if (input.length == 0) {
        return null;
    }

    return this.decompress(input.toString(), 16);
}

export function decompressString(input: string): string | null {
    if (input == null) {
        return "";
    }

    if (input.length == 0) {
        return null;
    }

    return this.decompress(input, 16);
}

function compress(input: string, bitsPerChar: number): string {
    if (input == null) {
        return "";
    }

    let writer: Writer = new Writer(bitsPerChar);
    let numBitsMask: number = 0b100;

    if (input.length == 0) {
        writer.finish(numBitsMask);

        return writer.getData();
    }

    let code: number = input.charCodeAt(0);
    let value: number = code < 256 ? 0 : 1;
    let dictSize: number = 3;

    writer.writeBit(value, numBitsMask);
    writer.writeBit(code, value != 0 ? 0b10000000000000000 : 0b100000000);

    let node: Trie = new Trie(3);
    let newNode: boolean = true;
    let dictionary: Map<number, Trie> = new Map<number, Trie>();

    dictionary.set(code, node);

    for (let i = 0, length = input.length; i < length; i++) {
        code = input.charCodeAt(i);
        let nextNode: Trie = <Trie> node.children.get(code);

        if (nextNode != null) {
            node = nextNode;

            continue;
        }

        if (!newNode) {
            value = node.value;
            writer.writeBit(value, numBitsMask);
        }

        newNode = false;

        if (dictionary.get(code) == null) {
            if (++dictSize >= numBitsMask) {
                numBitsMask <<= 1;
            }

            value = code < 256 ? 0 : 1;

            writer.writeBit(value, numBitsMask);
            writer.writeBit(code, value != 0 ? 0b10000000000000000 : 0b100000000);

            dictionary.set(code, new Trie(dictSize));

            newNode = true;
        }

        node.children.set(code, new Trie(++dictSize));

        if (dictSize >= numBitsMask) {
            numBitsMask <<= 1;
        }

        node = <Trie> dictionary.get(code);
    }

    if (!newNode) {
        writer.writeBit(node.value, numBitsMask);
    }

    if (dictionary.get(code) == null) {
        if (++dictSize >= numBitsMask) {
            numBitsMask <<= 1;
        }

        value = code < 256 ? 0 : 1;

        writer.writeBit(value, numBitsMask);
        writer.writeBit(code, 0b100000000 << value);
    }

    if (++dictSize >= numBitsMask) {
        numBitsMask <<= 1;
    }

    writer.finish(numBitsMask);

    return writer.getData();
}

function decompress(input: string, resetBits: number): string | null {
    let reader: Reader = new Reader(input, resetBits);
    let bits: number = reader.readBits(2);

    if (bits == 2) {
        return "";
    }

    bits = reader.readBits(bits * 8 + 8);

    let phrase: string = bits.toString();
    let dictionary: Array<string> = new Array<string>();

    dictionary.push("");
    dictionary.push("");
    dictionary.push("");
    dictionary.push(phrase);

    let result: string = "";

    result.concat(phrase);

    let enlargeIn: number = 4;
    let index: number = dictionary.length;
    let numBits: number = 3;

    while (!reader.isEof()) {
        bits = reader.readBits(numBits);

        if (bits == 2) {
            return result.toString();
        }

        if (bits < 2) {
            bits = reader.readBits(8 + 8 * bits);

            dictionary[index] = bits.toString();

            bits = index++;
            if (--enlargeIn == 0) {
                enlargeIn = 1 << numBits++;
            }
        }

        if (bits > dictionary.length) {
            return null;
        }

        let entry: string = bits < dictionary.length ?
            dictionary[bits] :
            phrase + phrase.charAt(0);

        result.concat(entry);

        dictionary[index++] = phrase + entry.charAt(0);

        phrase = entry;

        if (--enlargeIn == 0) {
            enlargeIn = 1 << numBits++;
        }
    }

    return "";
}

class Reader {
    private readonly input: string;
    private readonly resetBits: number;
    private value: number;
    private position: number;
    private index: number = 1;

    constructor(input: string, resetBits: number) {
        this.input = input;
        this.resetBits = resetBits;
        this.value = input.charCodeAt(0);
        this.position = resetBits;
    }

    isEof(): boolean {
        return this.index > this.input.length;
    }

    readBits(maxPower: number): number {
        let power: number = 0;
        let bits: number = 0;
        while (power != maxPower) {
            bits += ((this.value >> --this.position) & 1) << power++;

            if (this.position == 0) {
                this.position = this.resetBits;
                this.value = this.input.charCodeAt(this.index++);
            }
        }

        return bits;
    }
}

class Writer {
    private readonly bitsPerChar: number;
    private position: number = 0;
    private currentValue: number = 0;
    public readonly data: Array<number> = new Array<number>();

    constructor(bitsPerChar: number) {
        this.bitsPerChar = bitsPerChar;
    }

    finish(numBitsMask: number) {
        this.writeBit(2, numBitsMask);
        this.currentValue <<= this.bitsPerChar - this.position;
        this.data.push(this.currentValue);
    }

    writeBit(value: number, numBitsMask: number) {
        for (let i = 0; (numBitsMask >>= 1) != 0; i++) {
            this.currentValue = (value >> i & 1) | (this.currentValue << 1);

            if (++this.position == this.bitsPerChar) {
                this.position = 0;
                this.data.push(this.currentValue);
                this.currentValue = 0;
            }
        }
    }

    getData(): string {
        return this.data.toString();
    }
}

class Trie {
    public readonly value: number;
    public readonly children: Map<number, Trie> = new Map<number, Trie>();

    constructor(value: number) {
        this.value = value;
    }
}