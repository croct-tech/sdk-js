import {pack, unpack} from "../../src/compression/jsonPack";
import {JsonArray, JsonObject, JsonValue} from "../../src/json";

const primitives: [JsonValue, JsonValue][] = [
    ['Hello!', 'Hello!'],
    [true, true],
    [false, false],
    [0, 0],
    [1, 1],
    [3.14, 3.14],
    [2e4, 20000],
    [null, null],
];

test.each(primitives)('should not pack primitive (%p)', (unpacked, packed) => {
    expect(pack(unpacked)).toEqual(packed);
    expect(unpack(packed)).toEqual(unpacked);
});

const maps: [JsonValue, JsonValue][] = [
    [{}, {}],
    [{a: 1}, {a: 1}],
    [{a: 1, b: 2}, {a: 1, b: 2}],
    [{a: 1, b: ['tag1', 'tag2']}, {a: 1, b: ['tag1', 'tag2']}],
    [[{a: 1}, {b: null}], [{a: 1}, {b: null}]],
    // schema 1 is {a: ...}
    [[{a: 1}, {a: 7}], [{a: 1}, [1, 7]]],
    [[{a: 1}, {a: 7}, {a: 8}], [{a: 1}, [1, 7, 8]]],
    [[{a: 1}, {a: 7}, {a: 8}, {a: 9}], [{a: 1}, [1, 7, 8, 9]]],
    [[{a: 1, b: 2}, {a: 8, b: 9}, {a: 10, b: 11}], [{a: 1, b: 2}, [1, 8, 9, 10, 11]]],
    // schema 1 is {id: ..., items: ...}
    // schema 2 is {a: ..., b: ...}
    // schema 3 is {a: ...}
    [{id: 1, items: [{a: 1, b: 2}, {a: 8, b: 9}, {a: 10}]}, {id: 1, items: [{a: 1, b: 2}, [2, 8, 9], {a: 10}]}],
    [{id: 1, items: [{a: 1, b: 2}, {a: 8, b: 9}, {a: 10}, {a: 11}, {a: 12}]}, {id: 1, items: [{a: 1, b: 2}, [2, 8, 9], {a: 10}, [3, 11, 12]]}],
    // After packing order of keys may be changed but restored document will be fully identical to the original document
    [{test: [{b: 1, a: 1}, {b: 2, a: 2}]}, {test: [{a: 1, b: 1}, [2, 2, 2]]}],
];

test.each(maps)('should pack map %# (%p)', (unpacked, packed) => {
    expect(pack(unpacked)).toEqual(packed);
});

test.each(maps)('should unpack map %# (%p)', (unpacked, packed) => {
    expect(unpack(packed)).toEqual(unpacked);
});

const arrays: [JsonValue, JsonValue][] = [
    [[], []],
    [['A'], ['A']],
    [[['A']], [['A']]],
    [['A', 'B', 'C'], ['A', 'B', 'C']],
    [[1, 2, 3], [0, 1, 2, 3]],
    [[0, 1], [0, 0, 1]],
    [[0], [0, 0]],
    [[1], [0, 1]],
    [[1.618, 3.14], [0, 1.618, 3.14]],
    [[[1.618, 3.14]], [[0, 1.618, 3.14]]],
    [[['X', 'Y'], ['A', 'B']], [['X', 'Y'], ['A', 'B']]],
    [[[1, 2], [3, 4]], [[0, 1, 2], [0, 3, 4]]],
];

test.each(arrays)('should pack array (%p)', (unpacked, packed) => {
    expect(pack(unpacked)).toEqual(packed);
});

test.each(arrays)('should unpack array (%p)', (unpacked, packed) => {
    expect(unpack(packed)).toEqual(unpacked);
});

const doc0: JsonArray = [
    {key1: 1, key2: 2},
    {key1: 3, key2: 4},
    {key1: 5, key2: 6, key3: 7},
    {key1: 8, key2: 9, key3: 10},
    {key1: 1, key2: 12},
    {key1: 13, key2: 14, key3: 15}
];

const doc1: JsonObject = {
    'id': 1,
    'items': [
        {'key1': 7e5, 'key2': 'two'},
        {'key1': true, 'key2': false, 'key3': [0, 1, 2]},
        {'key1': null, 'key2': '', 'key3': [true, false]},
        {'key1': 3, 'key2': [['X', 'Y'], ['X', 'Z']], 'key3': ['A', 'B', 'C']},
        {'key1': '', 'key2': [['X', 'Y']], 'key3': [[0, 1]]},
        {'key1': '', 'key2': [[['X', 'Y']], ['Z']], 'key3': [[[0, 1]]]},
        {'parent': {'key1': '1', 'key2': 2}},
        {'parent': {'key1': '4', 'key2': 5}},
        {id: 8, creator: {id: 1, name: 'Name1'},
            tags: [{id: 2, name: 'Tag2'}]},
        {id: 9, creator: {id: 2, name: 'Name2'},
            tags: [{id: 2, name: 'Tag2'}, {id: 3, name: 'Tag3'}]},
        {id: 10, creator: null,
            tags: [[{id: 4, name: 'Tag4'}, {id: 5, name: 'Tag5'}]]},
        {id: 10, creator: {id: 3}, tags: []},
        {id: 11, creator: {}, tags: []},
        {id: 12, creator: {}, tags: []}
    ],
    'box': [[-14.833, -199.035, -30.143], [14.833, 199.035, 0.184]]
};

const doc2: JsonObject = {
    id: 2,
    data: [{a: 6, b: 7}, {b: 8, a: 9}]
};

const doc3 : JsonObject = {test: [{b: '1', a: '1'},
        {b: '2', a: '2'}]};

const docs: JsonValue[] = [doc0, doc1, doc2, doc3];

test.each(docs)('should pack and unpack doc%#', (data: JsonValue) => {
    expect(unpack(pack(data))).toEqual(data);
});