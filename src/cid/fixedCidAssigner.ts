import CidAssigner from './index';

export default class FixedCidAssigner implements CidAssigner {
    private readonly cid: string;

    public constructor(cid: string) {
        this.cid = cid;
    }

    public assignCid(): Promise<string> {
        return Promise.resolve(this.cid);
    }
}
