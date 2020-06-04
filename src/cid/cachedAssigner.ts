import {Logger} from '../logging/index';
import NullLogger from '../logging/nullLogger';
import CidCache from '../cache';
import CidAssigner from './index';

export default class CachedAssigner implements CidAssigner {
    private readonly assigner: CidAssigner;

    private readonly cache: CidCache;

    private readonly logger: Logger;

    public constructor(assigner: CidAssigner, cache: CidCache, logger?: Logger) {
        this.assigner = assigner;
        this.cache = cache;
        this.logger = logger ?? new NullLogger();
    }

    public async assignCid(): Promise<string> {
        const cid = this.cache.get();

        if (cid !== null) {
            this.logger.debug('Previous CID loaded from cache');

            return cid;
        }

        const newCid = await this.assigner.assignCid();

        this.cache.put(newCid);

        this.logger.debug('New CID stored into cache');

        return newCid;
    }
}
