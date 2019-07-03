import {compress, decompress} from "../../src/compression/lzw";

test('should compress and decompress a json value', () => {
    const input: string = "[{\"_id\":\"5d1ba8b055717b4d80fd7352\",\"index\":0,\"guid\":\"f8b72f1b-d74c-4f8a-ae4e-4c0abead271e\",\"isActive\":true,\"balance\":\"$1,878.90\",\"picture\":\"http://placehold.it/32x32\",\"age\":29,\"eyeColor\":\"green\",\"name\":\"Lesley Riley\",\"gender\":\"female\",\"company\":\"CUBIX\",\"email\":\"lesleyriley@cubix.com\",\"phone\":\"+1 (841) 534-2509\",\"address\":\"665 Tilden Avenue, Calvary, Ohio, 3639\",\"about\":\"Tempor magna excepteur dolore in velit fugiat exercitation Lorem qui pariatur. Velit nisi amet id Lorem qui non in cupidatat nisi laboris nostrud. Id ea officia reprehenderit velit. Ut laborum deserunt sunt magna irure ut. Quis labore deserunt veniam commodo duis. Est qui occaecat nostrud laboris aliqua occaecat exercitation nulla velit proident consectetur. Labore esse quis esse ipsum pariatur magna magna enim in officia qui.\\r\\n\",\"registered\":\"2018-10-01T02:49:42 +03:00\",\"latitude\":-65.615222,\"longitude\":38.807643,\"tags\":[\"Lorem\",\"pariatur\",\"ex\",\"ipsum\",\"do\",\"do\",\"labore\"],\"friends\":[{\"id\":0,\"name\":\"Wiley Fischer\"},{\"id\":1,\"name\":\"Henrietta Peck\"},{\"id\":2,\"name\":\"Sue Love\"}],\"greeting\":\"Hello, Lesley Riley! You have 6 unread messages.\",\"favoriteFruit\":\"banana\"},{\"_id\":\"5d1ba8b0d58576996ad73dde\",\"index\":1,\"guid\":\"3c60fce8-f838-495b-8eb8-b2861e49faa8\",\"isActive\":true,\"balance\":\"$3,484.67\",\"picture\":\"http://placehold.it/32x32\",\"age\":35,\"eyeColor\":\"green\",\"name\":\"Gibson Campos\",\"gender\":\"male\",\"company\":\"XUMONK\",\"email\":\"gibsoncampos@xumonk.com\",\"phone\":\"+1 (885) 513-2950\",\"address\":\"538 Lyme Avenue, Glendale, American Samoa, 917\",\"about\":\"Incididunt dolor amet qui sunt cupidatat ipsum dolor officia cupidatat aliquip exercitation do. Commodo veniam non reprehenderit sunt labore ullamco do id pariatur in elit officia fugiat. Sit labore exercitation aliqua dolore anim fugiat pariatur. Fugiat ea dolore qui consectetur irure cillum dolor occaecat commodo magna duis est. Aute anim consectetur amet sunt laboris aliquip velit nulla cillum eu aliquip esse voluptate. Cillum ullamco officia eu et velit consectetur consequat.\\r\\n\",\"registered\":\"2016-02-08T04:42:48 +02:00\",\"latitude\":70.104139,\"longitude\":-59.408019,\"tags\":[\"laborum\",\"duis\",\"aliqua\",\"nostrud\",\"ex\",\"ipsum\",\"sit\"],\"friends\":[{\"id\":0,\"name\":\"Marie Conrad\"},{\"id\":1,\"name\":\"Burgess Wilkins\"},{\"id\":2,\"name\":\"Middleton Bullock\"}],\"greeting\":\"Hello, Gibson Campos! You have 3 unread messages.\",\"favoriteFruit\":\"banana\"},{\"_id\":\"5d1ba8b02e4e4f6e6d3e60e4\",\"index\":2,\"guid\":\"d5f22dd9-943a-4333-ae24-67263f8cbf5d\",\"isActive\":false,\"balance\":\"$1,013.22\",\"picture\":\"http://placehold.it/32x32\",\"age\":38,\"eyeColor\":\"blue\",\"name\":\"Le Carpenter\",\"gender\":\"male\",\"company\":\"SUSTENZA\",\"email\":\"lecarpenter@sustenza.com\",\"phone\":\"+1 (817) 575-3634\",\"address\":\"156 Montauk Avenue, Cherokee, Texas, 543\",\"about\":\"Pariatur commodo culpa ea nulla fugiat esse veniam. Excepteur anim nisi ipsum nisi velit ea aliquip ad ex do id fugiat adipisicing aliqua. Elit aliquip minim Lorem nisi consequat sunt veniam qui velit. Nulla dolor veniam commodo laboris nulla sunt eu cupidatat incididunt culpa. Irure reprehenderit adipisicing deserunt magna nulla magna quis. Labore tempor sit laboris excepteur do eiusmod. Elit tempor deserunt fugiat sit Lorem irure in.\\r\\n\",\"registered\":\"2015-07-07T01:14:36 +03:00\",\"latitude\":-85.392894,\"longitude\":22.908546,\"tags\":[\"quis\",\"excepteur\",\"quis\",\"eu\",\"fugiat\",\"aliquip\",\"adipisicing\"],\"friends\":[{\"id\":0,\"name\":\"Nelda Whitley\"},{\"id\":1,\"name\":\"Claire Schroeder\"},{\"id\":2,\"name\":\"Ava Rush\"}],\"greeting\":\"Hello, Le Carpenter! You have 1 unread messages.\",\"favoriteFruit\":\"strawberry\"},{\"_id\":\"5d1ba8b0539a3dd36a984552\",\"index\":3,\"guid\":\"a976a228-bbe6-4802-8833-dfd3240ad06c\",\"isActive\":true,\"balance\":\"$3,316.45\",\"picture\":\"http://placehold.it/32x32\",\"age\":37,\"eyeColor\":\"green\",\"name\":\"Faulkner Colon\",\"gender\":\"male\",\"company\":\"OPTICALL\",\"email\":\"faulknercolon@opticall.com\",\"phone\":\"+1 (970) 463-3373\",\"address\":\"662 Garden Place, Weeksville, Mississippi, 8637\",\"about\":\"Fugiat minim proident labore ea id nulla minim Lorem quis enim cillum. Cillum quis sit aliquip ullamco sit sunt. Elit incididunt enim occaecat et elit voluptate veniam. Nulla adipisicing cillum magna pariatur adipisicing fugiat id qui ipsum amet est nisi eiusmod.\\r\\n\",\"registered\":\"2017-04-15T10:55:18 +03:00\",\"latitude\":59.914608,\"longitude\":-139.818008,\"tags\":[\"dolore\",\"non\",\"commodo\",\"et\",\"nisi\",\"esse\",\"est\"],\"friends\":[{\"id\":0,\"name\":\"Mia Poole\"},{\"id\":1,\"name\":\"Heidi Barnes\"},{\"id\":2,\"name\":\"Margarita Stein\"}],\"greeting\":\"Hello, Faulkner Colon! You have 4 unread messages.\",\"favoriteFruit\":\"strawberry\"},{\"_id\":\"5d1ba8b0a2ecac5b8b8fc746\",\"index\":4,\"guid\":\"521bdfb1-a80b-4788-b5b7-d77698abca22\",\"isActive\":false,\"balance\":\"$1,077.09\",\"picture\":\"http://placehold.it/32x32\",\"age\":26,\"eyeColor\":\"blue\",\"name\":\"Watkins Hansen\",\"gender\":\"male\",\"company\":\"DAYCORE\",\"email\":\"watkinshansen@daycore.com\",\"phone\":\"+1 (950) 516-3841\",\"address\":\"764 George Street, Munjor, Oklahoma, 8287\",\"about\":\"Aliquip sunt cillum cupidatat commodo in deserunt sint adipisicing. Amet reprehenderit ut consectetur tempor commodo qui pariatur amet consectetur ad et occaecat. Fugiat Lorem mollit minim sunt labore qui adipisicing amet laboris. Labore elit quis aliqua voluptate sit consequat tempor enim. In in officia commodo officia sunt mollit duis officia duis. Sit labore do nostrud aute veniam. Commodo eiusmod magna culpa nisi deserunt anim proident aute occaecat occaecat eiusmod duis proident Lorem.\\r\\n\",\"registered\":\"2019-02-19T10:06:38 +03:00\",\"latitude\":50.422155,\"longitude\":-177.032785,\"tags\":[\"excepteur\",\"fugiat\",\"in\",\"reprehenderit\",\"proident\",\"exercitation\",\"laboris\"],\"friends\":[{\"id\":0,\"name\":\"Suzette Conway\"},{\"id\":1,\"name\":\"Beasley Cline\"},{\"id\":2,\"name\":\"Booker Humphrey\"}],\"greeting\":\"Hello, Watkins Hansen! You have 10 unread messages.\",\"favoriteFruit\":\"apple\"}]";

    expect(decompress(compress(input))).toEqual(input);
});

test('should compress and decompress a string that repeats', () => {
    const input: string = "hello1hello2hello3hello4hello5hello6hello7hello8hello9helloAhelloBhelloChelloDhelloEhelloF";

    expect(decompress(compress(input))).toEqual(input);
});

test('should compress and decompress a string with any encoding', () => {
    const input: string = "捯湳潬攮汯木≈敬汯⁷潲汤™⤠`";

    expect(decompress(compress(input))).toEqual(input);
});

test('should compress and decompress a string with emoji', () => {
    const input: string = "😀😁😂🤣😃😄😅";

    expect(decompress(compress(input))).toEqual(input);
});

test('should compress and decompress an empty string', () => {
    const input: string = "";

    expect(decompress(compress(input))).toEqual(input);
});

test('should compress and decompress a null value', () => {
    const input: null = null;

    expect(decompress(compress(input))).toEqual(input);
});

test('should compress and decompress all printable UTF-16 characters', () => {
    let testString: string = '';
    let i: number;

    for (i = 32; i < 127; ++i) {
        testString += String.fromCharCode(i);
    }
    for (i = 128 + 32; i < 55296; ++i) {
        testString += String.fromCharCode(i);
    }
    for (i = 63744; i < 65536; ++i) {
        testString += String.fromCharCode(i);
    }

    let compressed: string | null = compress(testString);

    expect(compressed).not.toEqual(testString);

    let decompressed: string | null = decompress(compressed);

    expect(decompressed).toBe(testString);
});

test('should compress and decompress a long string', () => {
    let testString: string = '';
    let i: number;

    for (i = 32; i < 1000; ++i) {
        testString += Math.random() + " ";
    }

    let compressed: string | null = compress(testString);

    expect(compressed).not.toEqual(testString);
    expect(compressed.length).toBeLessThan(testString.length);

    let decompressed: string | null = decompress(compressed);

    expect(decompressed).toBe(testString);
});