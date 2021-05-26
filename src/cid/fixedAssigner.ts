import {CidAssigner} from './assigner';

export class FixedAssigner implements CidAssigner {
    private readonly cid: string;

    public constructor(cid: string) {
        this.cid = cid;
    }

    public assignCid(): Promise<string> {
        return Promise.resolve(this.cid);
    }
}
