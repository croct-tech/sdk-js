export interface CidAssigner {
    assignCid(currentCid?: string): Promise<string>;
}
