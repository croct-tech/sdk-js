export default interface CidAssigner {
    assignCid(): Promise<string>;
}
