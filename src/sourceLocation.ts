export type Position = {
    line: number,
    column: number,
    index: number,
};

export type Location = {
    start: Position,
    end: Position,
};

export function getLength(input: string): number {
    return [...input].length;
}

export function getLocation(input: string, startIndex: number, endIndex: number): Location {
    if (startIndex < 0) {
        throw Error('The start index cannot be negative.');
    }

    if (endIndex < startIndex) {
        throw new Error('The end index must greater than or equal to the start index.');
    }

    let start: Position | undefined;
    let end: Position | undefined;

    const chars = [...input];
    let line = 1;
    let column = 0;

    for (let offset = 0; offset < chars.length; offset++) {
        const char = chars[offset];

        if (offset === startIndex) {
            start = {
                index: offset,
                line: line,
                column: column,
            };
        }

        if (offset === endIndex) {
            end = {
                index: offset,
                line: line,
                column: column,
            };

            break;
        }

        if (char === '\n') {
            line += 1;
            column = 0;
        } else {
            column += 1;
        }
    }

    if (start === undefined) {
        start = {
            index: chars.length,
            line: line,
            column: column,
        };
    }

    if (end === undefined) {
        end = {
            index: chars.length,
            line: line,
            column: column,
        };
    }

    return {
        start: start,
        end: end,
    };
}

export function getPosition(input: string, index: number): Position {
    return getLocation(input, index, index).start;
}
