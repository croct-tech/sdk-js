export interface CidAssigner {
    assignCid(): Promise<string>;
}
