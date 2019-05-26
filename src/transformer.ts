export interface Transformer<I, O> {
    (input: I): Promise<O>;
}

export const encodeJson: Transformer<any, string> = function encodeJson(input: any): Promise<string> {
    return Promise.resolve(JSON.stringify(input));
};
