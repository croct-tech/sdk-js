import {Logger, NullLogger} from '../logging';
import {Cache} from '../cache';
import {CidAssigner} from './assigner';

type CachedAssignerOptions = {
    logger?: Logger,
    refresh?: boolean,
};

export class CachedAssigner implements CidAssigner {
    private readonly assigner: CidAssigner;

    private readonly cache: Cache;

    private readonly options: Required<CachedAssignerOptions>;

    public constructor(assigner: CidAssigner, cache: Cache, options: CachedAssignerOptions = {}) {
        this.assigner = assigner;
        this.cache = cache;
        this.options = {
            logger: options.logger ?? new NullLogger(),
            refresh: options.refresh ?? false,
        };
    }

    public async assignCid(): Promise<string> {
        const cid = this.cache.get();
        const {logger, refresh} = this.options;

        if (cid !== null) {
            logger.debug('Previous CID loaded from cache');

            if (refresh) {
                logger.debug('Refreshing CID');

                this.assigner
                    .assignCid()
                    .then(newCid => {
                        if (newCid !== cid) {
                            logger.warn('The CID has changed, updating cache');

                            this.cache.put(newCid);
                        }
                    })
                    .catch(() => {
                        logger.error('Failed to refresh CID');
                    });
            }

            return cid;
        }

        const newCid = await this.assigner.assignCid();

        this.cache.put(newCid);

        logger.debug('New CID stored into cache');

        return newCid;
    }
}
