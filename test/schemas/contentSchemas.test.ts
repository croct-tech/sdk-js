import {postDetails} from '../../src/schema/contentSchemas';

describe('The product details schema', () => {
    it.each([
        [{
            postId: 'post-id',
            title: 'post-title',
            publishTime: 0,
        }],
        [{
            postId: 'post-id',
            url: 'https://www.acme.com/post-id',
            title: 'post-title',
            tags: ['tag-1'],
            categories: ['category-1'],
            authors: ['author-1'],
            publishTime: 0,
            updateTime: 1,
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            postDetails.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {title: 'post-title', publishTime: 0},
            'Missing property \'/postId\'.',
        ],
        [
            {postId: 'post-id', publishTime: 0},
            'Missing property \'/title\'.',
        ],
        [
            {postId: 'post-id', title: 'post-title'},
            'Missing property \'/publishTime\'.',
        ],
        [
            {postId: '', title: 'post-title', publishTime: 0},
            'Expected at least 1 character at path \'/postId\', actual 0.',
        ],
        [
            {postId: 'x'.repeat(201), title: 'post-title', publishTime: 0},
            'Expected at most 200 characters at path \'/postId\', actual 201.',
        ],
        [
            {postId: null, title: 'post-title', publishTime: 0},
            'Expected value of type string at path \'/postId\', actual null.',
        ],
        [
            {postId: 'post-id', title: '', publishTime: 0},
            'Expected at least 1 character at path \'/title\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'x'.repeat(201), publishTime: 0},
            'Expected at most 200 characters at path \'/title\', actual 201.',
        ],
        [
            {postId: 'post-id', title: null, publishTime: 0},
            'Expected value of type string at path \'/title\', actual null.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: null},
            'Expected value of type number at path \'/publishTime\', actual null.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, updateTime: null},
            'Expected value of type number at path \'/updateTime\', actual null.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, url: 'foo'},
            'Invalid url format at path \'/url\'.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: []},
            'Expected at least 1 item at path \'/tags\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: [new Array(11).fill('x')]},
            'Expected value of type string at path \'/tags/0\', actual array.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: ['']},
            'Expected at least 1 character at path \'/tags/0\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: ['x'.repeat(51)]},
            'Expected at most 50 characters at path \'/tags/0\', actual 51.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: []},
            'Expected at least 1 item at path \'/tags\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: [new Array(11).fill('x')]},
            'Expected value of type string at path \'/tags/0\', actual array.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: ['']},
            'Expected at least 1 character at path \'/tags/0\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, tags: ['x'.repeat(51)]},
            'Expected at most 50 characters at path \'/tags/0\', actual 51.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, categories: []},
            'Expected at least 1 item at path \'/categories\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, categories: [new Array(11).fill('x')]},
            'Expected value of type string at path \'/categories/0\', actual array.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, categories: ['']},
            'Expected at least 1 character at path \'/categories/0\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, categories: ['x'.repeat(51)]},
            'Expected at most 50 characters at path \'/categories/0\', actual 51.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, authors: []},
            'Expected at least 1 item at path \'/authors\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, authors: [new Array(11).fill('x')]},
            'Expected value of type string at path \'/authors/0\', actual array.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, authors: ['']},
            'Expected at least 1 character at path \'/authors/0\', actual 0.',
        ],
        [
            {postId: 'post-id', title: 'post-title', publishTime: 0, authors: ['x'.repeat(51)]},
            'Expected at most 50 characters at path \'/authors/0\', actual 51.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            postDetails.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
